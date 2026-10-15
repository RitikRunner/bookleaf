import { TicketCategory } from "@prisma/client";

export const BOOKLEAF_OVERVIEW = `
Company Overview:
- BookLeaf Publishing is a self-publishing company operating in India and the US.
- Publishing Packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium, paid package with marketing and distribution add-ons).
- Services: Cover design, typesetting, ISBN assignment, printing, distribution, and royalty management.
- Facilities: In-house printing facility and warehouse located in Delhi. Print partners: Repro India and Epitome Books.
`;

export const KNOWLEDGE_BASE_SECTIONS: Record<TicketCategory, string> = {
  ROYALTY_PAYMENTS: `
Royalty Policy & Rules:
- 80/20 royalty split: 80% of net profit per book goes to author, 20% to BookLeaf.
- Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.
- Royalties calculated quarterly and paid within 45 days of the quarter ending.
- Minimum payout threshold: ₹1,000. If accumulated royalties are below ₹1,000, they roll over to the next quarter.
- Payouts are made via bank transfer to the account linked in the author's dashboard.
- If an author has not received royalty: Check whether accumulated pending is >= ₹1,000. If below, explain the rollover rule. If overdue past 45 days, escalate with a guaranteed 48-hour resolution timeline.
- If author questions royalty calculation: Explain the net profit breakdown (MRP minus printing, commission, shipping) and offer to share a detailed line-by-line royalty breakdown.
`,

  ISBN_METADATA: `
ISBN & Metadata Policy:
- Every book published through BookLeaf receives a unique ISBN assigned by BookLeaf under BookLeaf's publisher imprint.
- If author wants an ISBN under their own imprint, they must obtain it independently.
- ISBN Errors (duplicate, wrong book linked, mismatch on Amazon/Flipkart): Treat as HIGH/CRITICAL priority. Confirm immediate escalation to production team with a 48-hour resolution timeline.
- Metadata updates (description, bio, title changes): Submitted through dashboard; changes typically reflect on platforms within 3–5 business days.
`,

  PRINTING_QUALITY: `
Printing & Quality Policy:
- In-house printing in Delhi handles most orders. Overflow or specific format requirements go to Repro India or Epitome Books.
- Standard print turnaround: 5–7 business days from order confirmation.
- Defective copies (misprints, binding defects, blurry images, misaligned pages): Apologize sincerely. Request author to share photos of defective copies. Confirm that BookLeaf arranges a 100% FREE reprint once verified. Provide 5–7 business days timeline for reprint.
`,

  DISTRIBUTION_AVAILABILITY: `
Distribution & Availability Policy:
- Listed on Amazon India, Flipkart, Amazon US, Amazon UK, and the BookLeaf Store.
- New listings typically go live within 7–10 business days after publication is complete.
- "Currently Unavailable" status: Usually indicates an automated stock sync issue between distributor feeds. BookLeaf operations can trigger a manual re-sync within 24–48 hours to restore availability.
`,

  BOOK_STATUS_PRODUCTION: `
Production Stages & Timeline Policy:
- Production pipeline stages:
  1. Manuscript Received
  2. Editing (if opted)
  3. Cover Design (Waiting for author concept approval)
  4. Typesetting
  5. Proofreading (Author revision rounds)
  6. ISBN Assignment
  7. Printing
  8. Distribution Setup
  9. Published & Live
- Authors are updated at each stage via email. Delays typically occur during Cover Design (waiting for author feedback) or Proofreading (revision rounds).
- Support approach: Check actual production status honestly. Provide specific updated timelines. Never blame the author—collaborate and clarify next milestones.
`,

  GENERAL_INQUIRY: `
General Inquiries Policy:
- Package upgrades: Authors can upgrade from Standard Free to Bestseller Breakthrough at any time by speaking to publishing advisors.
- Account details: Authors can update bank accounts and contact details directly in their dashboard.
- Platform updates: Retailer platform updates reflect within 3–5 business days.
`
};

export const COMMUNICATION_TONE_GUIDELINES = `
Communication Tone & Persona Guidelines:
1. Always empathetic and professional. Authors are our partners, not customers to be managed.
2. Acknowledge the author's concern and emotion before jumping directly to technical solutions.
3. Be specific: include actual numbers, dates, copies sold, and statuses from the author's record rather than vague reassurances.
4. If something is BookLeaf's fault (delayed royalties, ISBN sync error), own it directly with zero corporate deflection.
5. If the issue requires escalation or investigation, provide a concrete timeline ("Our team will look into this and get back to you within 48 hours") rather than open-ended promises.
6. Always conclude with a clear, actionable next step for the author and/or the BookLeaf team.
`;
