"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Shield, User, ArrowRight, Lock, Mail, AlertCircle, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.user.role === "ADMIN") {
        router.push("/admin/tickets");
      } else {
        router.push("/author/books");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (persona: string, destination: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/switch-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona })
      });
      if (res.ok) {
        router.push(destination);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-900 text-amber-300 shadow-md mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
          BookLeaf Publishing
        </h1>
        <p className="mt-2 text-base text-slate-600 max-w-xl mx-auto">
          Author Support & Operations Communication Portal with AI-assisted response generation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Standard Login Form */}
        <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Sign In to Your Account</h2>
          <p className="text-xs text-slate-500 mb-6">
            Enter your author or staff credentials below.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="e.g. priya.sharma@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white font-medium text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In to Portal"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Default password for all accounts: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">author123</code> (Authors) / <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono">admin123</code> (Staff)
            </p>
          </div>
        </div>

        {/* Right Column: 1-Click Evaluation Personas */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-indigo-950 text-sm">Evaluation Quick Access</h3>
            </div>
            <p className="text-xs text-indigo-900/80 mb-4 leading-relaxed">
              Skip typing passwords. Click any pre-configured seed persona below to test specific workflows & edge cases:
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => quickLogin("priya", "/author/books")}
                className="w-full p-3 bg-white hover:bg-slate-50 border border-indigo-200/80 rounded-xl text-left flex items-start gap-3 transition shadow-2xs group cursor-pointer"
              >
                <div className="p-2 bg-blue-50 text-blue-800 rounded-lg group-hover:bg-blue-100 transition shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Priya Sharma (Author)</div>
                  <div className="text-[11px] text-slate-500">2 live books, sales & pending royalty</div>
                </div>
              </button>

              <button
                onClick={() => quickLogin("kavita", "/author/books")}
                className="w-full p-3 bg-white hover:bg-slate-50 border border-amber-200/80 rounded-xl text-left flex items-start gap-3 transition shadow-2xs group cursor-pointer"
              >
                <div className="p-2 bg-amber-50 text-amber-800 rounded-lg group-hover:bg-amber-100 transition shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Kavita Deshmukh (Author)</div>
                  <div className="text-[11px] text-slate-500">Edge Case: ₹850 royalty (&lt;₹1,000 threshold rollover)</div>
                </div>
              </button>

              <button
                onClick={() => quickLogin("sneha", "/author/books")}
                className="w-full p-3 bg-white hover:bg-slate-50 border border-purple-200/80 rounded-xl text-left flex items-start gap-3 transition shadow-2xs group cursor-pointer"
              >
                <div className="p-2 bg-purple-50 text-purple-800 rounded-lg group-hover:bg-purple-100 transition shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Sneha Kulkarni (Author)</div>
                  <div className="text-[11px] text-slate-500">Edge Case: Book in Production (Cover Design stepper)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail("admin@bookleaf.in");
                  setPassword("admin123");
                }}
                className="w-full p-3 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-left flex items-start gap-3 transition shadow-2xs group cursor-pointer"
              >
                <div className="p-2 bg-indigo-800/80 rounded-lg shrink-0">
                  <Shield className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>Operations Team (Admin)</span>
                    <span className="text-[10px] bg-indigo-800 px-1.5 py-0.5 rounded font-mono">Fill Form</span>
                  </div>
                  <div className="text-[11px] text-indigo-200">Pre-fills admin@bookleaf.in / admin123 for credential sign-in</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
