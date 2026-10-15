import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { authorId: true }
  });

  if (!ticket) {
    return new Response("Ticket not found", { status: 404 });
  }

  if (user.role === Role.AUTHOR && ticket.authorId !== user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial connection event
  writer.write(encoder.encode(`data: ${JSON.stringify({ type: "CONNECTED", ticketId: id })}\n\n`));

  let lastCheckedTime = new Date();
  let isClosed = false;

  // Interval polling for new messages on this ticket
  const interval = setInterval(async () => {
    if (isClosed) return;
    try {
      const newMessages = await prisma.ticketMessage.findMany({
        where: {
          ticketId: id,
          createdAt: { gt: lastCheckedTime }
        },
        include: {
          sender: {
            select: { id: true, name: true, role: true }
          }
        },
        orderBy: { createdAt: "asc" }
      });

      if (newMessages.length > 0) {
        lastCheckedTime = newMessages[newMessages.length - 1].createdAt;
        writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: "NEW_MESSAGES", messages: newMessages })}\n\n`)
        );
      }

      // Also check if ticket status changed
      const currentTicket = await prisma.ticket.findUnique({
        where: { id },
        select: { status: true, priority: true, category: true }
      });

      if (currentTicket) {
        writer.write(
          encoder.encode(`data: ${JSON.stringify({ type: "STATUS_UPDATE", ticket: currentTicket })}\n\n`)
        );
      }
    } catch (e) {
      clearInterval(interval);
      isClosed = true;
    }
  }, 2500);

  req.signal.addEventListener("abort", () => {
    isClosed = true;
    clearInterval(interval);
    writer.close().catch(() => {});
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
