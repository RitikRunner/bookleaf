import OpenAI from "openai";
import { z } from "zod";
import { TicketCategory, TicketPriority } from "@prisma/client";

const ClassificationResponseSchema = z.object({
  category: z.nativeEnum(TicketCategory),
  priority: z.nativeEnum(TicketPriority),
  confidence: z.number().min(0).max(1),
  reasoning: z.string()
});

export type ClassificationResult = z.infer<typeof ClassificationResponseSchema> & {
  aiStatus: "SUCCESS" | "FALLBACK";
};

// Heuristic fallback when OpenAI is down, unconfigured, or rate-limited
function heuristicClassification(subject: string, description: string): ClassificationResult {
  const text = `${subject} ${description}`.toLowerCase();

  let category: TicketCategory = TicketCategory.GENERAL_INQUIRY;
  let priority: TicketPriority = TicketPriority.MEDIUM;
  let reasoning = "Classified via rule-based heuristic fallback.";

  if (text.includes("isbn") || text.includes("barcode") || text.includes("wrong book")) {
    category = TicketCategory.ISBN_METADATA;
    priority = TicketPriority.CRITICAL;
    reasoning = "Detected ISBN or metadata integrity keyword. Marked Critical for urgent escalation.";
  } else if (
    text.includes("royalty") ||
    text.includes("payment") ||
    text.includes("payout") ||
    text.includes("money") ||
    text.includes("threshold") ||
    text.includes("₹")
  ) {
    category = TicketCategory.ROYALTY_PAYMENTS;
    priority = text.includes("overdue") || text.includes("months") ? TicketPriority.HIGH : TicketPriority.MEDIUM;
    reasoning = "Detected royalty/payment inquiry. Assigned based on financial settlement rules.";
  } else if (
    text.includes("print") ||
    text.includes("defect") ||
    text.includes("misprint") ||
    text.includes("binding") ||
    text.includes("blurry") ||
    text.includes("quality")
  ) {
    category = TicketCategory.PRINTING_QUALITY;
    priority = TicketPriority.HIGH;
    reasoning = "Physical product quality issue detected. Requires customer photo verification.";
  } else if (
    text.includes("unavailable") ||
    text.includes("out of stock") ||
    text.includes("amazon") ||
    text.includes("flipkart") ||
    text.includes("listing")
  ) {
    category = TicketCategory.DISTRIBUTION_AVAILABILITY;
    priority = TicketPriority.MEDIUM;
    reasoning = "Distribution/availability query. May require catalog feed re-sync.";
  } else if (
    text.includes("typesetting") ||
    text.includes("proof") ||
    text.includes("cover design") ||
    text.includes("manuscript") ||
    text.includes("production")
  ) {
    category = TicketCategory.BOOK_STATUS_PRODUCTION;
    priority = TicketPriority.MEDIUM;
    reasoning = "Inquiry regarding publishing pipeline timeline progress.";
  }

  return {
    category,
    priority,
    confidence: 0.85,
    reasoning,
    aiStatus: "FALLBACK"
  };
}

export async function classifyTicket(
  subject: string,
  description: string
): Promise<ClassificationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your-openai-api-key") {
    return heuristicClassification(subject, description);
  }

  const openai = new OpenAI({ apiKey });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s fail-safe timeout

    const prompt = `Analyze this BookLeaf Publishing author support ticket.
Classify into exactly one category and one priority.

Categories:
- ROYALTY_PAYMENTS: Royalties, sales calculation, payouts, thresholds, banking.
- ISBN_METADATA: ISBN errors, wrong title on Amazon, author bio/description updates.
- PRINTING_QUALITY: Blurry prints, binding defects, defective author copies, reprint requests.
- DISTRIBUTION_AVAILABILITY: Book showing "Currently Unavailable", stock sync issues.
- BOOK_STATUS_PRODUCTION: Production delays, typesetting status, cover design approvals.
- GENERAL_INQUIRY: General publishing questions, package details.

Priority Criteria:
- CRITICAL: Live store ISBN mismatch, severe print batches, unpaid royalties > 3 months.
- HIGH: Quality defects requiring reprint, overdue payments past 45-day window.
- MEDIUM: Standard production inquiries, stock sync requests, general royalty queries.
- LOW: Minor bio updates, cosmetic questions.

Return JSON in this format:
{
  "category": "CATEGORY_ENUM",
  "priority": "PRIORITY_ENUM",
  "confidence": 0.95,
  "reasoning": "One concise sentence explaining classification."
}`;

    const completion = await openai.chat.completions.create(
      {
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: prompt },
          {
            role: "user",
            content: `Subject: ${subject}\n\nDescription: ${description}`
          }
        ]
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response from AI classifier");

    const parsed = ClassificationResponseSchema.parse(JSON.parse(raw));
    return {
      ...parsed,
      aiStatus: "SUCCESS"
    };
  } catch (error) {
    console.warn("AI Classifier failed or timed out. Falling back to heuristic engine:", error);
    return heuristicClassification(subject, description);
  }
}
