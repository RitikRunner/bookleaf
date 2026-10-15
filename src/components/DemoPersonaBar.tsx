"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, UserCheck, ShieldCheck, RefreshCw, Lock, X } from "lucide-react";

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
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("admin123");
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);

  const switchAuthorPersona = async (persona: string, redirectPath: string) => {
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
      } else {
        const data = await res.json();
        alert(data.error || "Failed to switch persona");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading("admin");
    setAdminAuthError(null);

    try {
      // Secure: Admin must authenticate with real credentials through /api/auth/login
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@bookleaf.in",
          password: adminPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      setShowAdminModal(false);
      router.push("/admin/tickets");
      router.refresh();
    } catch (err: any) {
      setAdminAuthError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const handleAdminClick = () => {
    if (currentUser?.role === "ADMIN") {
      router.push("/admin/tickets");
    } else {
      setShowAdminModal(true);
    }
  };

  return (
    <>
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
              onClick={() => switchAuthorPersona("priya", "/author/books")}
              disabled={loading !== null}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded border border-slate-700 transition flex items-center gap-1 font-medium cursor-pointer"
              title="Standard Author with 2 published books & royalties"
            >
              {loading === "priya" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3 text-sky-400" />}
              Priya (Live Books)
            </button>

            <button
              onClick={() => switchAuthorPersona("kavita", "/author/books")}
              disabled={loading !== null}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded border border-slate-700 transition flex items-center gap-1 font-medium cursor-pointer"
              title="Edge Case: Pending royalty ₹850 is under ₹1,000 threshold (Rollover policy test)"
            >
              {loading === "kavita" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-amber-400" />}
              Kavita (&lt;₹1k Rollover)
            </button>

            <button
              onClick={() => switchAuthorPersona("sneha", "/author/books")}
              disabled={loading !== null}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded border border-slate-700 transition flex items-center gap-1 font-medium cursor-pointer"
              title="Edge Case: Book in production (Cover Design) with null fields & production timeline"
            >
              {loading === "sneha" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3 text-purple-400" />}
              Sneha (In Production)
            </button>

            <button
              onClick={handleAdminClick}
              disabled={loading !== null}
              className="px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 active:bg-indigo-800 text-indigo-200 rounded border border-indigo-700 transition flex items-center gap-1 font-semibold cursor-pointer"
              title="Protected Staff Access: Authenticates admin@bookleaf.in via credentials"
            >
              {loading === "admin" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3 text-indigo-400" />}
              Aman (Ops Admin)
            </button>
          </div>
        </div>
      </div>

      {/* Admin Password Verification Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-900 rounded-lg">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Staff Security Verification</h3>
                  <p className="text-[11px] text-slate-500">Admin privileges require credential validation</p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {adminAuthError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {adminAuthError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Email
                </label>
                <input
                  type="email"
                  disabled
                  value="admin@bookleaf.in"
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-100 border border-slate-300 rounded font-mono text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Admin Password
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="admin123"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-indigo-600 outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Default seed password: admin123</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading === "admin"}
                  className="px-4 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-semibold rounded shadow-xs cursor-pointer"
                >
                  {loading === "admin" ? "Authenticating..." : "Authenticate Staff Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
