import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { generateDraftResponse } from "@/lib/ai/drafter";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        author: true,
        book: true
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    let bookSnapshot = null;
    if (ticket.book) {
      bookSnapshot = {
        title: ticket.book.title,
        status: ticket.book.status,
        isbn: ticket.book.isbn,
        totalCopiesSold: ticket.book.totalCopiesSold,
        totalRoyaltyEarned: ticket.book.totalRoyaltyEarned,
        royaltyPaid: ticket.book.royaltyPaid,
        royaltyPending: ticket.book.royaltyPending,
        lastRoyaltyPayoutDate: ticket.book.lastRoyaltyPayoutDate,
        printPartner: ticket.book.printPartner
      };
    }

    const newDraft = await generateDraftResponse({
      category: ticket.category,
      subject: ticket.subject,
      description: ticket.description,
      authorName: ticket.author.name,
      book: bookSnapshot
    });

    const updated = await prisma.ticket.update({
      where: { id },
      data: { aiDraftResponse: newDraft }
    });

    return NextResponse.json({ aiDraftResponse: updated.aiDraftResponse });
  } catch (error) {
    console.error("Regenerate draft error:", error);
    return NextResponse.json({ error: "Failed to regenerate draft" }, { status: 500 });
  }
}
