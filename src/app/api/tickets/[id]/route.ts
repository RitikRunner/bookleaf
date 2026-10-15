import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role, TicketStatus, TicketPriority, TicketCategory } from "@prisma/client";
import { z } from "zod";

const UpdateTicketSchema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  category: z.nativeEnum(TicketCategory).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  assignedAdminId: z.string().nullable().optional()
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true, authorCode: true, phone: true, city: true }
        },
        book: true,
        assignedAdmin: {
          select: { id: true, name: true, email: true }
        },
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, role: true }
            }
          },
          orderBy: { createdAt: "asc" }
        },
        ...(user.role === Role.ADMIN
          ? {
              internalNotes: {
                include: {
                  author: {
                    select: { id: true, name: true }
                  }
                },
                orderBy: { createdAt: "asc" }
              }
            }
          : {})
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Role-based access control: Authors can only view their own tickets
    if (user.role === Role.AUTHOR && ticket.authorId !== user.id) {
      return NextResponse.json({ error: "Access denied: You can only view your own tickets" }, { status: 403 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Fetch ticket error:", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can update status/priority/overrides
    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = UpdateTicketSchema.parse(body);

    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    let isOverridden = existing.isAiOverridden;
    if (
      (validated.category && validated.category !== existing.aiSuggestedCategory) ||
      (validated.priority && validated.priority !== existing.aiSuggestedPriority)
    ) {
      isOverridden = true;
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        ...(validated.status ? { status: validated.status } : {}),
        ...(validated.category ? { category: validated.category } : {}),
        ...(validated.priority ? { priority: validated.priority } : {}),
        ...(validated.assignedAdminId !== undefined ? { assignedAdminId: validated.assignedAdminId } : {}),
        isAiOverridden: isOverridden
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        assignedAdmin: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ ticket: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Update ticket error:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
