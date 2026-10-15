import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role, TicketStatus } from "@prisma/client";
import { z } from "zod";

const MessageSchema = z.object({
  content: z.string().min(1, "Message content cannot be empty"),
  resolved: z.boolean().optional()
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { content, resolved } = MessageSchema.parse(body);

    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // RBAC: Author can only post messages to their own tickets
    if (user.role === Role.AUTHOR && ticket.authorId !== user.id) {
      return NextResponse.json({ error: "Forbidden: Not your ticket" }, { status: 403 });
    }

    // Create the message
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: user.id,
        content: content.trim()
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    // Smart status transition:
    // If admin replies and ticket was OPEN, transition to IN_PROGRESS. If resolved is true, mark RESOLVED.
    let newStatus = ticket.status;
    if (user.role === Role.ADMIN) {
      if (resolved) {
        newStatus = TicketStatus.RESOLVED;
      } else if (ticket.status === TicketStatus.OPEN) {
        newStatus = TicketStatus.IN_PROGRESS;
      }
    } else if (user.role === Role.AUTHOR && ticket.status === TicketStatus.RESOLVED) {
      // If author replies after resolution, reopen ticket
      newStatus = TicketStatus.IN_PROGRESS;
    }

    await prisma.ticket.update({
      where: { id },
      data: {
        status: newStatus,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ message, newStatus }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid message", details: error.issues }, { status: 400 });
    }
    console.error("Create message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
