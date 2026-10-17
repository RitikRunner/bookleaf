import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role, TicketStatus, TicketPriority, TicketCategory } from "@prisma/client";
import { classifyTicket } from "@/lib/ai/classifier";
import { generateDraftResponse } from "@/lib/ai/drafter";
import { z } from "zod";

const CreateTicketSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200),
  description: z.string().min(5, "Please provide more details (at least 5 characters)"),
  bookId: z.string().nullable().optional(),
  attachmentFileName: z.string().nullable().optional()
});

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as TicketStatus | null;
    const category = searchParams.get("category") as TicketCategory | null;
    const priority = searchParams.get("priority") as TicketPriority | null;
    const query = searchParams.get("q");

    let whereClause: any = {};

    if (user.role === Role.AUTHOR) {
      whereClause.authorId = user.id;
    } else {
      // Admin filters
      if (status) whereClause.status = status;
      if (category) whereClause.category = category;
      if (priority) whereClause.priority = priority;
      if (query) {
        whereClause.OR = [
          { subject: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { author: { name: { contains: query, mode: "insensitive" } } }
        ];
      }
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        author: {
          select: { id: true, name: true, email: true, authorCode: true }
        },
        book: {
          select: { id: true, bookCode: true, title: true, status: true, isbn: true }
        },
        assignedAdmin: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { messages: true, internalNotes: true }
        }
      },
      orderBy: [
        { priority: "asc" }, // CRITICAL first (by enum sorting or custom priority)
        { createdAt: "desc" }
      ]
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("List tickets error:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = CreateTicketSchema.parse(body);

    let bookSnapshot = null;
    if (validated.bookId && validated.bookId !== "general") {
      const foundBook = await prisma.book.findFirst({
        where: {
          id: validated.bookId,
          ...(user.role === Role.AUTHOR ? { authorId: user.id } : {})
        }
      });
      if (foundBook) {
        bookSnapshot = {
          title: foundBook.title,
          status: foundBook.status,
          isbn: foundBook.isbn,
          totalCopiesSold: foundBook.totalCopiesSold,
          totalRoyaltyEarned: foundBook.totalRoyaltyEarned,
          royaltyPaid: foundBook.royaltyPaid,
          royaltyPending: foundBook.royaltyPending,
          lastRoyaltyPayoutDate: foundBook.lastRoyaltyPayoutDate,
          printPartner: foundBook.printPartner
        };
      }
    }

    // 1. Run AI Classification with graceful degradation
    const classification = await classifyTicket(validated.subject, validated.description);

    // 2. Pre-generate grounded AI response draft
    const aiDraft = await generateDraftResponse({
      category: classification.category,
      subject: validated.subject,
      description: validated.description,
      authorName: user.name,
      book: bookSnapshot
    });

    // 3. Persist Ticket in Database
    const ticket = await prisma.ticket.create({
      data: {
        authorId: user.id,
        bookId: validated.bookId && validated.bookId !== "general" ? validated.bookId : null,
        subject: validated.subject,
        description: validated.description,
        attachmentFileName: validated.attachmentFileName || null,
        status: TicketStatus.OPEN,
        category: classification.category,
        priority: classification.priority,
        aiSuggestedCategory: classification.category,
        aiSuggestedPriority: classification.priority,
        aiConfidenceScore: classification.confidence,
        aiReasoning: classification.reasoning,
        aiDraftResponse: aiDraft,
        aiStatus: classification.aiStatus,
        isAiOverridden: false
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, authorCode: true }
        },
        book: true
      }
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const firstMessage = error.issues[0]?.message || "Validation failed";
      return NextResponse.json({ error: firstMessage, details: error.issues }, { status: 400 });
    }
    console.error("Create ticket error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
