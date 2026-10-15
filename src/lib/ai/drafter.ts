import OpenAI from "openai";
import { TicketCategory } from "@prisma/client";
import {
  KNOWLEDGE_BASE_SECTIONS,
  COMMUNICATION_TONE_GUIDELINES,
  BOOKLEAF_OVERVIEW
} from "./knowledge-base";

export interface BookSnapshot {
  title: string;
  status: string;
  isbn?: string | null;
  totalCopiesSold: number;
  totalRoyaltyEarned: number;
  royaltyPaid: number;
  royaltyPending: number;
  lastRoyaltyPayoutDate?: Date | string | null;
  printPartner?: string | null;
}

export interface GenerateDraftParams {
  category: TicketCategory;
  subject: string;
  description: string;
  authorName: string;
  book?: BookSnapshot | null;
}

// Fallback template generator ensuring grounded, policy-accurate responses even without an API key
function fallbackDraftGenerator(params: GenerateDraftParams): string {
  const { category, authorName, book } = params;

  if (category === TicketCategory.ROYALTY_PAYMENTS) {
    if (book && book.royaltyPending < 1000 && book.royaltyPending > 0) {
      return `Dear ${authorName},

Thank you for reaching out regarding your royalties for "${book.title}". Congratulations on the ${book.totalCopiesSold} copies sold to date!

I reviewed your royalty records. Your current pending royalty is ₹${book.royaltyPending.toLocaleString("en-IN")}. Under BookLeaf's Royalty Policy, payouts are processed quarterly with a minimum threshold of ₹1,000. 

Because your accumulated amount is currently below ₹1,000, it will safely roll over into the next quarter and be transferred to your linked bank account once the threshold is reached.

Please feel free to confirm that your bank details are updated in your dashboard. We are always here to help!

Warm regards,
BookLeaf Support Team`;
    }

    return `Dear ${authorName},

Thank you for reaching out to us. We understand how important royalty settlements are to our author partners.

Royalties at BookLeaf follow an 80/20 net profit split and are distributed quarterly within 45 days of the quarter ending. I have flagged your account with our finance team to verify your recent platform sales and disbursement status.

We will review your account and provide a detailed update within 48 hours.

Warm regards,
BookLeaf Support Team`;
  }

  if (category === TicketCategory.ISBN_METADATA) {
    return `Dear ${authorName},

Thank you for bringing this issue to our attention. An ISBN discrepancy is treated as an urgent priority at BookLeaf.

I have escalated your query directly to our Production and Cataloging leads. We are reviewing the retailer feeds to ensure your book${book ? ` ("${book.title}")` : ""} matches its registered ISBN correctly.

Our team will follow up with confirmed resolution progress within 48 hours.

Best regards,
BookLeaf Support Team`;
  }

  if (category === TicketCategory.PRINTING_QUALITY) {
    return `Dear ${authorName},

We sincerely apologize for the quality issues with your copies. We hold our printing partners to high standards, and we are sorry this batch did not meet your expectations.

Could you please reply with a couple of clear photos showing the defective areas (pages, binding, or cover)? Once verified by our print quality team, BookLeaf will immediately arrange a free reprint, which takes 5–7 business days.

We will make sure this is rectified for you promptly.

Best regards,
BookLeaf Support Team`;
  }

  if (category === TicketCategory.DISTRIBUTION_AVAILABILITY) {
    return `Dear ${authorName},

Thank you for contacting us. When a published title displays as "Currently Unavailable", it is typically an automated inventory feed sync issue between our distributor and retailer platforms.

We are triggering a manual stock and catalog re-sync for your book${book ? ` ("${book.title}")` : ""}. These updates normally reflect live on Amazon and Flipkart within 24–48 hours.

We will keep an eye on your listing and follow up once it is active.

Warm regards,
BookLeaf Support Team`;
  }

  if (category === TicketCategory.BOOK_STATUS_PRODUCTION) {
    return `Dear ${authorName},

Thank you for checking in on the progress of your book${book ? ` ("${book.title}")` : ""}.

${book ? `Your book is currently in the "${book.status}" milestone.` : "Our team is actively coordinating with our editorial and design leads."} Standard turnaround for design and proofing stages is typically 7–10 business days.

We will notify you via email the moment the next proof is ready for your review and approval.

Warm regards,
BookLeaf Support Team`;
  }

  return `Dear ${authorName},

Thank you for contacting BookLeaf Publishing. We have received your query and an operations team member is actively reviewing the details.

We will get back to you with a full response within 24–48 hours.

Best regards,
BookLeaf Support Team`;
}

export async function generateDraftResponse(params: GenerateDraftParams): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your-openai-api-key") {
    return fallbackDraftGenerator(params);
  }

  const { category, subject, description, authorName, book } = params;
  const policyContext = KNOWLEDGE_BASE_SECTIONS[category] || KNOWLEDGE_BASE_SECTIONS.GENERAL_INQUIRY;

  let bookContext = "Author selected 'General / Account Level' query (No specific book selected).";
  if (book) {
    bookContext = `
Specific Book in Question:
- Title: "${book.title}"
- Status: ${book.status}
- ISBN: ${book.isbn || "Pending assignment"}
- Copies Sold: ${book.totalCopiesSold}
- Royalty Earned: ₹${book.totalRoyaltyEarned}
- Royalty Paid: ₹${book.royaltyPaid}
- Royalty Pending: ₹${book.royaltyPending}
- Last Payout Date: ${book.lastRoyaltyPayoutDate ? new Date(book.lastRoyaltyPayoutDate).toLocaleDateString() : "None (First Cycle)"}
${book.royaltyPending < 1000 && book.royaltyPending > 0 ? "CRITICAL NOTE: Pending royalty is below the ₹1,000 threshold. Explain the quarterly rollover policy kindly." : ""}
${book.status.startsWith("In Production") ? `CRITICAL NOTE: Book is currently in production (${book.status}). Give realistic update based on workflow.` : ""}
`;
  }

  const openai = new OpenAI({ apiKey });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const completion = await openai.chat.completions.create(
      {
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `You are BookLeaf Publishing's AI Support Copilot.
Your job is to draft a complete, empathetic, professional response for our operations team to review and send to authors.

${BOOKLEAF_OVERVIEW}

Tone and Style Requirements:
${COMMUNICATION_TONE_GUIDELINES}

Relevant Policy Reference:
${policyContext}
`
          },
          {
            role: "user",
            content: `Author Name: ${authorName}
Author Query Subject: ${subject}
Author Query Description: ${description}

${bookContext}

Draft the complete response email now:`
          }
        ]
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);
    return completion.choices[0]?.message?.content || fallbackDraftGenerator(params);
  } catch (error) {
    console.warn("AI Drafter failed or timed out. Falling back to template generator:", error);
    return fallbackDraftGenerator(params);
  }
}
