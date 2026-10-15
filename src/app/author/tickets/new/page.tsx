"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, Send, Upload, Sparkles, AlertCircle, ArrowLeft, Paperclip, Check } from "lucide-react";

function NewTicketForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBookId = searchParams.get("bookId") || "general";

  const [books, setBooks] = useState<any[]>([]);
  const [selectedBookId, setSelectedBookId] = useState(preselectedBookId);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/books")
      .then((res) => res.json())
      .then((data) => {
        if (data.books) {
          setBooks(data.books);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          bookId: selectedBookId === "general" ? null : selectedBookId,
          attachmentFileName: attachmentName
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create ticket");
      }

      // Redirect immediately to the new ticket view
      router.push(`/author/tickets/${data.ticket.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <a
          href="/author/tickets"
          className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </a>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Submit a Support Query
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            BookLeaf’s operations team and AI support system will review your query.
          </p>
        </div>
      </div>

      <div className="portal-card p-6 sm:p-8 bg-white">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Book Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Which book is this query regarding? <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none bg-white transition cursor-pointer"
              >
                <option value="general">General / Account Level (Not book-specific)</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    📖 {b.title} ({b.status})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Selecting your book allows our AI support engine to pull your production milestone & royalty figures automatically.
            </p>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Subject Line <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Inquiry regarding Q3 royalty payment calculation"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={5}
              placeholder="Please provide complete context (e.g. details of the issue, dates, screenshots, or copies affected)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition resize-y"
            />
          </div>

          {/* Optional File Attachment UI */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              File Attachment <span className="text-slate-400 font-normal">(Optional UI)</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-4 text-center transition bg-slate-50/50">
              <input
                type="file"
                id="ticket-file"
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="ticket-file"
                className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
              >
                <div className="p-2 bg-white rounded-full border border-slate-200 text-slate-600 shadow-2xs">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-blue-900 hover:underline">
                  Click to attach photos or documents
                </span>
                <span className="text-[11px] text-slate-400">
                  PNG, JPG, or PDF up to 10MB (Useful for defective print photos)
                </span>
              </label>

              {attachmentName && (
                <div className="mt-3 inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 text-xs px-3 py-1 rounded-full border border-blue-200">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="font-medium">{attachmentName}</span>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI will auto-categorize and assign priority on submission</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                  Analyzing &amp; Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewTicketPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading support query form...</div>}>
      <NewTicketForm />
    </Suspense>
  );
}

