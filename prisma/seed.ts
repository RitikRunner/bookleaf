import { PrismaClient, Role, TicketStatus, TicketPriority, TicketCategory } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting BookLeaf Database Seeding...");

  // Load sample data
  const dataPath = path.join(process.cwd(), "bookleaf_sample_data.json");
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Sample data file not found at ${dataPath}`);
  }
  const rawData = fs.readFileSync(dataPath, "utf-8");
  const dataset = JSON.parse(rawData);

  // Hash standard default passwords
  const authorPasswordHash = await bcrypt.hash("author123", 10);
  const adminPasswordHash = await bcrypt.hash("admin123", 10);

  // 1. Seed Operations Admin accounts
  const admin1 = await prisma.user.upsert({
    where: { email: "admin@bookleaf.in" },
    update: {},
    create: {
      email: "admin@bookleaf.in",
      passwordHash: adminPasswordHash,
      name: "Aman Verma (Ops Lead)",
      role: Role.ADMIN,
      phone: "+91-98111-22334",
      city: "Delhi"
    }
  });

  const admin2 = await prisma.user.upsert({
    where: { email: "support@bookleaf.in" },
    update: {},
    create: {
      email: "support@bookleaf.in",
      passwordHash: adminPasswordHash,
      name: "Neha Gupta (Support Spec.)",
      role: Role.ADMIN,
      phone: "+91-98222-33445",
      city: "Delhi"
    }
  });

  console.log(`✅ Seeded 2 Admin accounts: ${admin1.email}, ${admin2.email}`);

  // 2. Seed Authors and their Books
  let totalAuthors = 0;
  let totalBooks = 0;

  for (const authorData of dataset.authors) {
    const authorUser = await prisma.user.upsert({
      where: { email: authorData.email },
      update: {
        name: authorData.name,
        phone: authorData.phone,
        city: authorData.city,
        authorCode: authorData.author_id,
        joinedDate: authorData.joined_date ? new Date(authorData.joined_date) : new Date()
      },
      create: {
        authorCode: authorData.author_id,
        email: authorData.email,
        passwordHash: authorPasswordHash,
        name: authorData.name,
        phone: authorData.phone,
        city: authorData.city,
        role: Role.AUTHOR,
        joinedDate: authorData.joined_date ? new Date(authorData.joined_date) : new Date()
      }
    });
    totalAuthors++;

    for (const bookData of authorData.books) {
      await prisma.book.upsert({
        where: { bookCode: bookData.book_id },
        update: {
          title: bookData.title,
          isbn: bookData.isbn || null,
          genre: bookData.genre,
          publicationDate: bookData.publication_date ? new Date(bookData.publication_date) : null,
          status: bookData.status,
          mrp: bookData.mrp !== null ? Number(bookData.mrp) : null,
          authorRoyaltyPerCopy: bookData.author_royalty_per_copy !== null ? Number(bookData.author_royalty_per_copy) : null,
          totalCopiesSold: Number(bookData.total_copies_sold || 0),
          totalRoyaltyEarned: Number(bookData.total_royalty_earned || 0),
          royaltyPaid: Number(bookData.royalty_paid || 0),
          royaltyPending: Number(bookData.royalty_pending || 0),
          lastRoyaltyPayoutDate: bookData.last_royalty_payout_date ? new Date(bookData.last_royalty_payout_date) : null,
          printPartner: bookData.print_partner || null,
          availableOn: bookData.available_on || []
        },
        create: {
          bookCode: bookData.book_id,
          authorId: authorUser.id,
          title: bookData.title,
          isbn: bookData.isbn || null,
          genre: bookData.genre,
          publicationDate: bookData.publication_date ? new Date(bookData.publication_date) : null,
          status: bookData.status,
          mrp: bookData.mrp !== null ? Number(bookData.mrp) : null,
          authorRoyaltyPerCopy: bookData.author_royalty_per_copy !== null ? Number(bookData.author_royalty_per_copy) : null,
          totalCopiesSold: Number(bookData.total_copies_sold || 0),
          totalRoyaltyEarned: Number(bookData.total_royalty_earned || 0),
          royaltyPaid: Number(bookData.royalty_paid || 0),
          royaltyPending: Number(bookData.royalty_pending || 0),
          lastRoyaltyPayoutDate: bookData.last_royalty_payout_date ? new Date(bookData.last_royalty_payout_date) : null,
          printPartner: bookData.print_partner || null,
          availableOn: bookData.available_on || []
        }
      });
      totalBooks++;
    }
  }

  console.log(`✅ Seeded ${totalAuthors} Authors and ${totalBooks} Books.`);

  // 3. Seed Realistic Demonstration Tickets
  const rohit = await prisma.user.findUnique({ where: { email: "rohit.kapoor@email.com" } });
  const rohitBook = await prisma.book.findUnique({ where: { bookCode: "BK003" } });

  const kavita = await prisma.user.findUnique({ where: { email: "kavita.deshmukh@email.com" } });
  const kavitaBook = await prisma.book.findUnique({ where: { bookCode: "BK016" } });

  const sneha = await prisma.user.findUnique({ where: { email: "sneha.kulkarni@email.com" } });
  const snehaBook = await prisma.book.findUnique({ where: { bookCode: "BK013" } });

  const priya = await prisma.user.findUnique({ where: { email: "priya.sharma@email.com" } });
  const priyaBook = await prisma.book.findUnique({ where: { bookCode: "BK001" } });

  if (rohit && rohitBook) {
    const existingTicket = await prisma.ticket.findFirst({ where: { authorId: rohit.id, subject: { contains: "ISBN" } } });
    if (!existingTicket) {
      const ticket = await prisma.ticket.create({
        data: {
          authorId: rohit.id,
          bookId: rohitBook.id,
          subject: "Critical: Wrong ISBN showing on Amazon for Code & Karma",
          description: "My physical book shows ISBN 978-93-5XXXX-03-5, but Amazon India listing is showing a completely different title and wrong ISBN! Please fix urgently as readers are getting confused.",
          category: TicketCategory.ISBN_METADATA,
          priority: TicketPriority.CRITICAL,
          status: TicketStatus.OPEN,
          aiSuggestedCategory: TicketCategory.ISBN_METADATA,
          aiSuggestedPriority: TicketPriority.CRITICAL,
          aiConfidenceScore: 0.98,
          aiReasoning: "Mismatch of ISBN on external retail platform is an urgent catalog integrity defect requiring immediate production escalation.",
          aiDraftResponse: `Dear Rohit,

Thank you for bringing this to our attention immediately. We sincerely apologize for this discrepancy—an ISBN mismatch on a live store listing is taken very seriously at BookLeaf.

I have escalated this issue directly to our Production and Cataloging teams as a Critical Priority ticket. We are actively initiating a metadata re-sync with Amazon India to ensure the physical ISBN (978-93-5XXXX-03-5) correctly links to your book "Code & Karma".

Our team will investigate and follow up with a confirmed status update within 48 hours.

Best regards,
BookLeaf Support Team`
        }
      });

      await prisma.internalNote.create({
        data: {
          ticketId: ticket.id,
          authorId: admin1.id,
          note: "Escalated to Deepak from cataloging. Amazon feed batch #4402 being verified."
        }
      });
    }
  }

  if (kavita && kavitaBook) {
    const existing = await prisma.ticket.findFirst({ where: { authorId: kavita.id, subject: { contains: "Nagpur" } } });
    if (!existing) {
      await prisma.ticket.create({
        data: {
          authorId: kavita.id,
          bookId: kavitaBook.id,
          subject: "Why haven't I received royalty for The Nagpur Notebooks?",
          description: "I published The Nagpur Notebooks in November and 34 copies have been sold, but I have not received any payment in my bank account yet. Could you check what is happening?",
          category: TicketCategory.ROYALTY_PAYMENTS,
          priority: TicketPriority.MEDIUM,
          status: TicketStatus.OPEN,
          aiSuggestedCategory: TicketCategory.ROYALTY_PAYMENTS,
          aiSuggestedPriority: TicketPriority.MEDIUM,
          aiConfidenceScore: 0.95,
          aiReasoning: "Query regards royalty payout schedule and minimum payout threshold check.",
          aiDraftResponse: `Dear Kavita,

Thank you for reaching out to BookLeaf. Congratulations on the 34 copies sold of "The Nagpur Notebooks"!

I reviewed your royalty ledger. Your total accumulated earnings currently stand at ₹850. Under BookLeaf's Royalty Policy, payouts are processed quarterly with a minimum payout threshold of ₹1,000. 

Because your current pending balance of ₹850 is just under this ₹1,000 threshold, your earnings will safely roll over into the upcoming quarter and be disbursed in the next payout cycle once the threshold is crossed.

Please feel free to verify your bank details in your author dashboard so everything is set for the upcoming transfer.

Warm regards,
BookLeaf Support Team`
        }
      });
    }
  }

  if (sneha && snehaBook) {
    const existing = await prisma.ticket.findFirst({ where: { authorId: sneha.id, subject: { contains: "Midnight" } } });
    if (!existing) {
      await prisma.ticket.create({
        data: {
          authorId: sneha.id,
          bookId: snehaBook.id,
          subject: "When will Cover Design finish for Midnight in Mysore?",
          description: "My manuscript was approved 2 weeks ago and the dashboard still shows 'In Production - Cover Design'. When can I expect the first cover concept?",
          category: TicketCategory.BOOK_STATUS_PRODUCTION,
          priority: TicketPriority.MEDIUM,
          status: TicketStatus.OPEN,
          aiSuggestedCategory: TicketCategory.BOOK_STATUS_PRODUCTION,
          aiSuggestedPriority: TicketPriority.MEDIUM,
          aiConfidenceScore: 0.92,
          aiReasoning: "Author checking on production milestone progress for book currently in design phase.",
          aiDraftResponse: `Dear Sneha,

Thank you for checking in on "Midnight in Mysore". We are excited to bring this thriller to life!

Your manuscript completed editorial check-in and is actively with our in-house design team in Delhi. Under our standard production workflow, Cover Design concepts are finalized within 7–10 business days, after which we will email you the mockups for your review and approval.

You will receive an email notification as soon as the design drafts are uploaded. Once you approve the cover, your book will advance to Typesetting immediately.

Warm regards,
BookLeaf Support Team`
        }
      });
    }
  }

  console.log("✅ Seeded demonstration tickets with grounded AI drafts.");
  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
