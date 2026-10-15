import { TicketStatus, TicketPriority, TicketCategory } from "@prisma/client";
import { AlertCircle, Clock, CheckCircle2, XCircle, AlertTriangle, ShieldAlert } from "lucide-react";

export function StatusBadge({ status }: { status: TicketStatus }) {
  switch (status) {
    case TicketStatus.OPEN:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Clock className="w-3 h-3 text-emerald-600" /> Open
        </span>
      );
    case TicketStatus.IN_PROGRESS:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="w-3 h-3 text-amber-600" /> In Progress
        </span>
      );
    case TicketStatus.RESOLVED:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <CheckCircle2 className="w-3 h-3 text-blue-600" /> Resolved
        </span>
      );
    case TicketStatus.CLOSED:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          <XCircle className="w-3 h-3 text-slate-500" /> Closed
        </span>
      );
    default:
      return null;
  }
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  switch (priority) {
    case TicketPriority.CRITICAL:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 shadow-xs">
          <ShieldAlert className="w-3 h-3 text-red-600" /> Critical
        </span>
      );
    case TicketPriority.HIGH:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200">
          <AlertTriangle className="w-3 h-3 text-orange-600" /> High
        </span>
      );
    case TicketPriority.MEDIUM:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          Medium
        </span>
      );
    case TicketPriority.LOW:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          Low
        </span>
      );
    default:
      return null;
  }
}

export function CategoryBadge({ category }: { category: TicketCategory }) {
  const map: Record<TicketCategory, { label: string; color: string }> = {
    ROYALTY_PAYMENTS: { label: "Royalty & Payments", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    ISBN_METADATA: { label: "ISBN & Metadata", color: "bg-violet-50 text-violet-800 border-violet-200" },
    PRINTING_QUALITY: { label: "Printing & Quality", color: "bg-rose-50 text-rose-800 border-rose-200" },
    DISTRIBUTION_AVAILABILITY: { label: "Distribution & Stock", color: "bg-cyan-50 text-cyan-800 border-cyan-200" },
    BOOK_STATUS_PRODUCTION: { label: "Book Status & Pipeline", color: "bg-amber-50 text-amber-800 border-amber-200" },
    GENERAL_INQUIRY: { label: "General Inquiry", color: "bg-slate-100 text-slate-700 border-slate-200" }
  };

  const item = map[category] || { label: category, color: "bg-slate-100 text-slate-700 border-slate-200" };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${item.color}`}>
      {item.label}
    </span>
  );
}
