"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, UserCheck, ShieldCheck, RefreshCw } from "lucide-react";

interface DemoPersonaBarProps {
  currentUser?: {
    email: string;
    name: string;
    role: string;
  } | null;
}

export function DemoPersonaBar({ currentUser }: DemoPersonaBarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const switchPersona = async (persona: string, redirectPath: string) => {
    try {
      setLoading(persona);
      const res = await fetch("/api/auth/switch-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona })
      });

      if (res.ok) {
        router.push(redirectPath);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 text-xs px-4 py-2 border-b border-slate-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold tracking-wide text-slate-300 uppercase text-[10px]">
            Reviewer Demo Switcher:
          </span>
          {currentUser ? (
            <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-emerald-400 font-medium">
              Active: {currentUser.name} ({currentUser.role})
            </span>
          ) : (
            <span className="text-slate-400">Not logged in</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 hidden sm:inline">1-Click Test Personas:</span>

          <button
            onClick={() => switchPersona("priya", "/author/books")}
            disabled={loading !== null}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded border border-slate-700 transition flex items-center gap-1 font-medium cursor-pointer"
            title="Standard Author with 2 published books & royalties"
          >
            {loading === "priya" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3 text-sky-400" />}
            Priya (Live Books)
          </button>

          <button
            onClick={() => switchPersona("kavita", "/author/books")}
            disabled={loading !== null}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded border border-slate-700 transition flex items-center gap-1 font-medium cursor-pointer"
            title="Edge Case: Pending royalty ₹850 is under ₹1,000 threshold (Rollover policy test)"
          >
            {loading === "kavita" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
            Kavita (&lt;₹1k Rollover)
          </button>

          <button
            onClick={() => switchPersona("sneha", "/author/books")}
            disabled={loading !== null}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded border border-slate-700 transition flex items-center gap-1 font-medium cursor-pointer"
            title="Edge Case: Book in production (Cover Design) with null fields & production timeline"
          >
            {loading === "sneha" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3 text-purple-400" />}
            Sneha (In Production)
          </button>

          <button
            onClick={() => switchPersona("admin", "/admin/tickets")}
            disabled={loading !== null}
            className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 active:bg-indigo-800 text-indigo-200 rounded border border-indigo-700 transition flex items-center gap-1 font-semibold cursor-pointer"
            title="BookLeaf Operations Team Admin (Queue, AI classification override, internal notes)"
          >
            {loading === "admin" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3 text-indigo-400" />}
            Aman (Ops Admin)
          </button>
        </div>
      </div>
    </div>
  );
}
