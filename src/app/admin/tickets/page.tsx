"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge, PriorityBadge, CategoryBadge } from "@/components/TicketBadge";
import {
  LayoutDashboard,
  Search,
  Filter,
  Clock,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  User,
  BookOpen,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function AdminTicketQueuePage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (priorityFilter !== "ALL") params.append("priority", priorityFilter);
      if (searchQuery.trim()) params.append("q", searchQuery.trim());

      const res = await fetch(`/api/tickets?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load queue");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const openTicketsCount = tickets.filter((t) => t.status === "OPEN").length;
  const criticalCount = tickets.filter((t) => t.priority === "CRITICAL" && t.status !== "CLOSED").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;

  return (
    <div className="space-y-6">
      {/* Header & KPI Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Operations Ticket Queue
            </h1>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded">
              BookLeaf Support Desk
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Incoming author queries with AI-assisted categorization, priority scoring, and grounded drafting.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="portal-card p-4 bg-white border-l-4 border-l-red-500">
          <div className="text-xs font-bold uppercase text-slate-400">Critical Issues</div>
          <div className="text-2xl font-extrabold text-red-600 mt-1 flex items-center gap-2">
            {criticalCount}
            {criticalCount > 0 && <span className="text-xs font-normal text-red-500 badge-pulse">Needs immediate action</span>}
          </div>
        </div>

        <div className="portal-card p-4 bg-white border-l-4 border-l-emerald-500">
          <div className="text-xs font-bold uppercase text-slate-400">New Unassigned (Open)</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{openTicketsCount}</div>
        </div>

        <div className="portal-card p-4 bg-white border-l-4 border-l-amber-500">
          <div className="text-xs font-bold uppercase text-slate-400">In Progress</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{inProgressCount}</div>
        </div>

        <div className="portal-card p-4 bg-white border-l-4 border-l-indigo-500">
          <div className="text-xs font-bold uppercase text-slate-400">Total Filtered</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{tickets.length}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="portal-card p-4 bg-white space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by author name, book title, or query description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-medium text-slate-700 outline-none"
          >
            <option value="ALL">Status: All</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-medium text-slate-700 outline-none"
          >
            <option value="ALL">Priority: All</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-medium text-slate-700 outline-none"
          >
            <option value="ALL">Category: All</option>
            <option value="ROYALTY_PAYMENTS">Royalty &amp; Payments</option>
            <option value="ISBN_METADATA">ISBN &amp; Metadata</option>
            <option value="PRINTING_QUALITY">Printing &amp; Quality</option>
            <option value="DISTRIBUTION_AVAILABILITY">Distribution &amp; Stock</option>
            <option value="BOOK_STATUS_PRODUCTION">Book Status &amp; Production</option>
            <option value="GENERAL_INQUIRY">General Inquiry</option>
          </select>

          {(statusFilter !== "ALL" || priorityFilter !== "ALL" || categoryFilter !== "ALL" || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setPriorityFilter("ALL");
                setCategoryFilter("ALL");
                setSearchQuery("");
              }}
              className="text-indigo-600 hover:underline font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Ticket Queue List */}
      <div className="space-y-3">
        {loading ? (
          <div className="portal-card p-12 text-center text-slate-400 text-xs">
            Loading ticket queue...
          </div>
        ) : tickets.length === 0 ? (
          <div className="portal-card p-12 text-center text-slate-500 text-xs">
            No tickets found matching current filters.
          </div>
        ) : (
          tickets.map((t) => {
            const isCritical = t.priority === "CRITICAL";
            const isUnresolvedOld =
              t.status !== "RESOLVED" &&
              t.status !== "CLOSED" &&
              Date.now() - new Date(t.createdAt).getTime() > 1000 * 60 * 60 * 24;

            return (
              <a
                key={t.id}
                href={`/admin/tickets/${t.id}`}
                className={`portal-card p-5 block transition group ${
                  isCritical
                    ? "border-red-300 hover:border-red-400 bg-red-50/20"
                    : isUnresolvedOld
                    ? "border-amber-300 hover:border-amber-400 bg-amber-50/20"
                    : "hover:border-indigo-300"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        #{t.ticketNumber}
                      </span>
                      <PriorityBadge priority={t.priority} />
                      <StatusBadge status={t.status} />
                      <CategoryBadge category={t.category} />

                      {/* AI Confidence Chip */}
                      {t.aiConfidenceScore && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                          <Sparkles className="w-3 h-3 text-indigo-600" />
                          AI Match: {Math.round(t.aiConfidenceScore * 100)}%
                        </span>
                      )}

                      {/* AI Overridden Flag */}
                      {t.isAiOverridden && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          Admin Overridden
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-900 transition flex items-center gap-2">
                      {t.subject}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-1">
                      {t.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1 text-slate-700 font-semibold">
                        <User className="w-3 h-3 text-indigo-600" />
                        Author: {t.author.name} ({t.author.authorCode || t.author.email})
                      </span>
                      {t.book && (
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                          <BookOpen className="w-3 h-3 text-blue-600" />
                          {t.book.title}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(t.createdAt).toLocaleDateString()} at{" "}
                        {new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {t.assignedAdmin ? (
                        <span className="text-indigo-700 font-medium">
                          Assigned to: {t.assignedAdmin.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </div>
                  </div>

                  <div className="self-end md:self-center shrink-0">
                    <div className="p-2.5 bg-indigo-50 group-hover:bg-indigo-100 text-indigo-900 rounded-lg text-xs font-bold flex items-center gap-1.5 transition">
                      <span>Open Copilot</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}
