import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { PlusCircle, MessageSquare, BookOpen, Clock, ArrowRight } from "lucide-react";
import { StatusBadge, PriorityBadge, CategoryBadge } from "@/components/TicketBadge";

export default async function AuthorTicketsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const tickets = await prisma.ticket.findMany({
    where: { authorId: user.id },
    include: {
      book: { select: { title: true, bookCode: true } },
      _count: { select: { messages: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My Support Tickets
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track communication and responses from BookLeaf’s operations team in real time.
          </p>
        </div>

        <a
          href="/author/tickets/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-xs transition self-start sm:self-center"
        >
          <PlusCircle className="w-4 h-4" />
          Raise New Ticket
        </a>
      </div>

      {tickets.length === 0 ? (
        <div className="portal-card p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Support Tickets Raised Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Have questions about your royalties, printing quality, ISBN, or distribution status?
          </p>
          <a
            href="/author/tickets/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-900 text-white text-xs font-semibold rounded-lg shadow-xs hover:bg-blue-800 transition"
          >
            <PlusCircle className="w-4 h-4" /> Submit Your First Query
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <a
              key={t.id}
              href={`/author/tickets/${t.id}`}
              className="portal-card p-5 block hover:border-blue-300 transition group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      #{t.ticketNumber}
                    </span>
                    <StatusBadge status={t.status} />
                    <CategoryBadge category={t.category} />
                    <PriorityBadge priority={t.priority} />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition">
                    {t.subject}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {t.description}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    {t.book && (
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        {t.book.title}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(t.createdAt).toLocaleDateString()} at{" "}
                      {new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {t._count.messages} {t._count.messages === 1 ? "response" : "responses"}
                    </span>
                  </div>
                </div>

                <div className="self-end sm:self-center">
                  <div className="p-2 text-slate-400 group-hover:text-blue-900 group-hover:translate-x-1 transition flex items-center gap-1 text-xs font-semibold">
                    <span>View Conversation</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
