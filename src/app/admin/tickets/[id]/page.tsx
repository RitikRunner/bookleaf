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
  Sparkles,
  RefreshCw,
  Lock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Paperclip,
  Check,
  FileEdit,
  Shield,
  Phone,
  Mail,
  MapPin
} from "lucide-react";

export default function AdminTicketWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [ticket, setTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Response Editor State
  const [responseText, setResponseText] = useState("");
  const [markResolved, setMarkResolved] = useState(false);
  const [sendingResponse, setSendingResponse] = useState(false);

  // Internal Notes State
  const [newNoteText, setNewNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Draft regeneration state
  const [regeneratingDraft, setRegeneratingDraft] = useState(false);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      if (!res.ok) throw new Error("Failed to load ticket");
      const data = await res.json();
      setTicket(data.ticket);

      // Pre-fill response editor if empty and AI draft exists
      if (!responseText && data.ticket.aiDraftResponse) {
        setResponseText(data.ticket.aiDraftResponse);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setCurrentUser(d.user))
      .catch((e) => console.error(e));

    fetchTicket();
  }, [id]);

  // Real-time synchronization
  useRealtimeTicket(id, () => {
    fetchTicket();
  });

  const handleUpdateTicket = async (updates: any) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        await fetchTicket();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegenerateDraft = async () => {
    setRegeneratingDraft(true);
    try {
      const res = await fetch(`/api/tickets/${id}/draft`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setResponseText(data.aiDraftResponse);
        await fetchTicket();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRegeneratingDraft(false);
    }
  };

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim()) return;

    setSendingResponse(true);
    try {
      const res = await fetch(`/api/tickets/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: responseText.trim(),
          resolved: markResolved
        })
      });

      if (!res.ok) throw new Error("Failed to send response");

      setResponseText("");
      await fetchTicket();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSendingResponse(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    setSavingNote(true);
    try {
      const res = await fetch(`/api/tickets/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNoteText.trim() })
      });

      if (!res.ok) throw new Error("Failed to add note");

      setNewNoteText("");
      await fetchTicket();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingNote(false);
    }
  };

  if (loading || !ticket) {
    return (
      <div className="max-w-6xl mx-auto py-12 text-center text-slate-500 text-xs">
        Loading ticket copilot workspace...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <a
          href="/admin/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Ticket Queue
        </a>

        <div className="flex items-center gap-2">
          {ticket.isAiOverridden && (
            <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded border border-amber-300">
              AI Classification Overridden by Staff
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column (8 cols): Ticket Context, Conversation & Response Drafting */}
        <div className="lg:col-span-8 space-y-6">
          {/* Ticket Header & Author Snapshot */}
          <div className="portal-card p-6 bg-white space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold font-mono text-slate-500">
                  #{ticket.ticketNumber}
                </span>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                <CategoryBadge category={ticket.category} />
              </div>

              <div className="text-xs text-slate-400">
                Created: {new Date(ticket.createdAt).toLocaleString()}
              </div>
            </div>

            <h1 className="text-xl font-extrabold text-slate-900">
              {ticket.subject}
            </h1>

            {/* Author Profile Quickstrip */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-900 font-bold flex items-center justify-center">
                  {ticket.author.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900">
                    {ticket.author.name}{" "}
                    <span className="font-mono text-slate-500">({ticket.author.authorCode || "Author"})</span>
                  </div>
                  <div className="text-slate-500 flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {ticket.author.email}</span>
                    {ticket.author.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {ticket.author.phone}</span>}
                    {ticket.author.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ticket.author.city}</span>}
                  </div>
                </div>
              </div>

              {ticket.book && (
                <div className="text-right">
                  <div className="font-semibold text-slate-800 flex items-center gap-1 justify-end">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" /> {ticket.book.title}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Status: <span className="font-medium text-slate-700">{ticket.book.status}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Author Original Query */}
          <div className="portal-card p-5 bg-white border-l-4 border-l-blue-600 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-slate-900">Original Author Query</span>
              <span>{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
              {ticket.description}
            </p>
            {ticket.attachmentFileName && (
              <div className="pt-2 flex items-center gap-1.5 text-xs text-blue-800">
                <Paperclip className="w-3.5 h-3.5" />
                <span className="font-medium">Attached File: {ticket.attachmentFileName}</span>
              </div>
            )}
          </div>

          {/* Conversation Thread */}
          {ticket.messages && ticket.messages.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Conversation History
              </h2>
              {ticket.messages.map((m: any) => {
                const isAdmin = m.sender.role === "ADMIN";
                return (
                  <div
                    key={m.id}
                    className={`portal-card p-4 text-xs ${
                      isAdmin
                        ? "bg-blue-50/70 border-blue-200 border-l-4 border-l-blue-900"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-900">
                        {isAdmin ? `${m.sender.name} (BookLeaf Staff)` : `${m.sender.name} (Author)`}
                      </span>
                      <span className="text-slate-400">{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-800 whitespace-pre-line">{m.content}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Response Drafting Editor (AI Draft pre-loaded) */}
          <div className="portal-card p-6 bg-white space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-indigo-700" />
                <h3 className="font-bold text-slate-900 text-sm">Response Editor for Author</h3>
              </div>

              <div className="flex items-center gap-2">
                {ticket.aiDraftResponse && (
                  <button
                    type="button"
                    onClick={() => setResponseText(ticket.aiDraftResponse)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold rounded transition flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Reset to AI Draft
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRegenerateDraft}
                  disabled={regeneratingDraft}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${regeneratingDraft ? "animate-spin" : ""}`} />
                  Regenerate Draft
                </button>
              </div>
            </div>

            <form onSubmit={handleSendResponse} className="space-y-4">
              <textarea
                required
                rows={9}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Review and edit the AI-generated draft before sending..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition font-sans leading-relaxed resize-y"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markResolved}
                    onChange={(e) => setMarkResolved(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Mark Ticket as "Resolved" upon sending
                </label>

                <button
                  type="submit"
                  disabled={sendingResponse || !responseText.trim()}
                  className="px-5 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingResponse ? "Sending to Author..." : "Send Response to Author"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Column (4 cols): AI Insights, Overrides, Status & Internal Notes */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Copilot Insights Card */}
          <div className="portal-card p-5 bg-gradient-to-br from-indigo-50/50 to-white border-indigo-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                AI Copilot Insights
              </span>
              <span className="text-[11px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                Confidence: {Math.round((ticket.aiConfidenceScore || 0.9) * 100)}%
              </span>
            </div>

            {/* AI Reasoning */}
            <div className="p-3 bg-white rounded-lg border border-indigo-100 text-xs text-slate-600">
              <div className="font-bold text-slate-800 mb-1">AI Classification Rationale:</div>
              {ticket.aiReasoning || "Classified according to BookLeaf knowledge base criteria."}
            </div>

            {/* Overrides */}
            <div className="space-y-3 pt-2 border-t border-indigo-100">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  Category (AI: {ticket.aiSuggestedCategory || ticket.category})
                </label>
                <select
                  value={ticket.category}
                  onChange={(e) => handleUpdateTicket({ category: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-medium outline-none"
                >
                  <option value="ROYALTY_PAYMENTS">Royalty &amp; Payments</option>
                  <option value="ISBN_METADATA">ISBN &amp; Metadata</option>
                  <option value="PRINTING_QUALITY">Printing &amp; Quality</option>
                  <option value="DISTRIBUTION_AVAILABILITY">Distribution &amp; Stock</option>
                  <option value="BOOK_STATUS_PRODUCTION">Book Status &amp; Production</option>
                  <option value="GENERAL_INQUIRY">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  Priority (AI: {ticket.aiSuggestedPriority || ticket.priority})
                </label>
                <select
                  value={ticket.priority}
                  onChange={(e) => handleUpdateTicket({ priority: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-medium outline-none"
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ticket Management & Assignment */}
          <div className="portal-card p-5 bg-white space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Ticket Management
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Workflow</label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleUpdateTicket({ status: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-semibold outline-none"
                >
                  <option value="OPEN">Open (New)</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Specialist</label>
                <div className="flex gap-2">
                  <div className="flex-1 py-1.5 px-2 bg-slate-100 rounded border border-slate-200 text-slate-800 font-medium">
                    {ticket.assignedAdmin ? ticket.assignedAdmin.name : "Unassigned"}
                  </div>
                  {currentUser && ticket.assignedAdminId !== currentUser.id && (
                    <button
                      type="button"
                      onClick={() => handleUpdateTicket({ assignedAdminId: currentUser.id })}
                      className="px-2.5 py-1 bg-indigo-900 hover:bg-indigo-800 text-white rounded font-bold transition cursor-pointer"
                    >
                      Assign to Me
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Staff-Only Internal Notes (Hidden from Author) */}
          <div className="portal-card p-5 bg-amber-50/60 border-amber-200 space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-950">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              Internal Notes (Staff Only)
            </div>
            <p className="text-[11px] text-amber-900/80">
              Private notes shared across BookLeaf operations team. Never visible to authors.
            </p>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {ticket.internalNotes && ticket.internalNotes.length > 0 ? (
                ticket.internalNotes.map((note: any) => (
                  <div key={note.id} className="p-2.5 bg-white rounded border border-amber-200 text-xs shadow-2xs">
                    <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                      <span>{note.author.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(note.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-line">{note.note}</p>
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-slate-400 italic py-2 text-center">
                  No internal notes yet.
                </div>
              )}
            </div>

            <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-amber-200">
              <textarea
                rows={2}
                placeholder="Add private staff note (e.g. escalated to Repro India)..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="w-full p-2 text-xs bg-white border border-amber-300 rounded-md focus:ring-2 focus:ring-amber-500 outline-none resize-none"
              />
              <button
                type="submit"
                disabled={savingNote || !newNoteText.trim()}
                className="w-full py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {savingNote ? "Saving..." : "Add Internal Note"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
