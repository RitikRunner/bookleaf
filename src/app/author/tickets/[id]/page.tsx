"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge, PriorityBadge, CategoryBadge } from "@/components/TicketBadge";
import { useRealtimeTicket } from "@/lib/use-realtime-ticket";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Send,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff
} from "lucide-react";

export default function AuthorTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [ticket, setTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      if (res.status === 403) {
        setError("Access Denied: You can only view your own tickets.");
        return;
      }
      if (!res.ok) {
        setError("Ticket not found.");
        return;
      }
      const data = await res.json();
      setTicket(data.ticket);
    } catch (e: any) {
      console.error(e);
      setError("Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [id]);

  // Hook for real-time SSE stream with automatic fallback polling
  const { isConnected } = useRealtimeTicket(id, () => {
    fetchTicket();
  });

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim() })
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      setReplyText("");
      await fetchTicket();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
        Loading ticket details...
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="portal-card p-6 bg-red-50 border-red-200 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h2 className="text-base font-bold text-red-900">{error || "Ticket not found"}</h2>
          <a
            href="/author/tickets"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-red-800 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Tickets
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation & Real-time Indicator */}
      <div className="flex items-center justify-between">
        <a
          href="/author/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tickets
        </a>

        <div className="flex items-center gap-2 text-xs">
          {isConnected ? (
            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Wifi className="w-3 h-3" /> Live Updates Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              <WifiOff className="w-3 h-3" /> Auto-syncing (Polling)
            </span>
          )}
        </div>
      </div>

      {/* Ticket Header Card */}
      <div className="portal-card p-6 bg-white space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold font-mono text-slate-500">
            #{ticket.ticketNumber}
          </span>
          <StatusBadge status={ticket.status} />
          <CategoryBadge category={ticket.category} />
          <PriorityBadge priority={ticket.priority} />
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {ticket.subject}
        </h1>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
          {ticket.book && (
            <span className="flex items-center gap-1 text-slate-700 font-semibold">
              <BookOpen className="w-4 h-4 text-blue-600" />
              {ticket.book.title} ({ticket.book.status})
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Submitted on {new Date(ticket.createdAt).toLocaleDateString()} at{" "}
            {new Date(ticket.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {ticket.attachmentFileName && (
            <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              <Paperclip className="w-3.5 h-3.5" />
              Attachment: {ticket.attachmentFileName}
            </span>
          )}
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Conversation History
        </h2>

        {/* 1. Original Author Query */}
        <div className="portal-card p-5 bg-white border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold text-slate-900">{ticket.author.name} (You)</span>
            <span>{new Date(ticket.createdAt).toLocaleString()}</span>
          </div>
          <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
            {ticket.description}
          </p>
        </div>

        {/* 2. Messages List */}
        {ticket.messages && ticket.messages.length > 0 ? (
          ticket.messages.map((m: any) => {
            const isAdmin = m.sender.role === "ADMIN";

            return (
              <div
                key={m.id}
                className={`portal-card p-5 ${
                  isAdmin
                    ? "bg-blue-50/70 border-blue-200 border-l-4 border-l-blue-900"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {isAdmin ? `${m.sender.name} (BookLeaf Team)` : `${m.sender.name} (You)`}
                    </span>
                    {isAdmin && (
                      <span className="bg-blue-900 text-white text-[10px] px-1.5 py-0.2 rounded font-bold uppercase">
                        Support Staff
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400">
                    {new Date(m.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {m.content}
                </div>
              </div>
            );
          })
        ) : (
          <div className="portal-card p-6 bg-slate-50 text-center text-xs text-slate-500">
            Our operations team has received your query and will reply shortly.
          </div>
        )}
      </div>

      {/* Author Reply Form */}
      {ticket.status !== "CLOSED" ? (
        <div className="portal-card p-6 bg-white space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Send Follow-up Message</h3>
          <form onSubmit={handleSendReply} className="space-y-3">
            <textarea
              required
              rows={3}
              placeholder="Type your response or additional information..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition resize-y"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sending || !replyText.trim()}
                className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="portal-card p-4 bg-slate-100 text-center text-xs text-slate-600 font-medium">
          This ticket has been marked as Closed.
        </div>
      )}
    </div>
  );
}
