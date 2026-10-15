import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { z } from "zod";

const NoteSchema = z.object({
  note: z.string().min(1, "Note cannot be empty")
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Internal notes are restricted to BookLeaf staff" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { note } = NoteSchema.parse(body);

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const internalNote = await prisma.internalNote.create({
      data: {
        ticketId: id,
        authorId: user.id,
        note: note.trim()
      },
      include: {
        author: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    return NextResponse.json({ note: internalNote }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid note", details: error.issues }, { status: 400 });
    }
    console.error("Create note error:", error);
    return NextResponse.json({ error: "Failed to add internal note" }, { status: 500 });
  }
}
