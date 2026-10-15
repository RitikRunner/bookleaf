"use client";

import Link from "next/navigation";
import { useRouter, usePathname } from "next/navigation";
import { BookOpen, Ticket, PlusCircle, LayoutDashboard, LogOut, Shield } from "lucide-react";

interface NavbarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    authorCode?: string | null;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const isAuthor = user?.role === "AUTHOR";
  const isAdmin = user?.role === "ADMIN";

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-9 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <a href={isAdmin ? "/admin/tickets" : isAuthor ? "/author/books" : "/"} className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-900 flex items-center justify-center text-white font-bold shadow-xs">
                <BookOpen className="w-5 h-5 text-amber-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-900 text-lg leading-tight tracking-tight">
                  BookLeaf
                </span>
                <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                  Author Support Portal
                </span>
              </div>
            </a>

            {user && (
              <div className="hidden md:flex items-center gap-1">
                {isAuthor && (
                  <>
                    <a
                      href="/author/books"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                        pathname === "/author/books"
                          ? "bg-slate-100 text-blue-900 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" /> My Books
                      </span>
                    </a>
                    <a
                      href="/author/tickets"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                        pathname === "/author/tickets"
                          ? "bg-slate-100 text-blue-900 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Ticket className="w-4 h-4" /> My Tickets
                      </span>
                    </a>
                    <a
                      href="/author/tickets/new"
                      className="ml-2 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-md text-sm font-medium shadow-xs transition flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" /> Submit Query
                    </a>
                  </>
                )}

                {isAdmin && (
                  <>
                    <a
                      href="/admin/tickets"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                        pathname.startsWith("/admin/tickets")
                          ? "bg-indigo-50 text-indigo-900 font-semibold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <LayoutDashboard className="w-4 h-4 text-indigo-600" /> Operations Queue
                      </span>
                    </a>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-800 flex items-center justify-end gap-1.5">
                    {user.name}
                    {isAdmin && (
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" /> Staff
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <a
                href="/"
                className="text-sm font-medium text-blue-900 hover:underline"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
