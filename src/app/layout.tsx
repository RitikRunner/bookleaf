import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { DemoPersonaBar } from "@/components/DemoPersonaBar";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "BookLeaf Publishing | Author Support & Operations Portal",
  description: "AI-assisted author support and query resolution platform for BookLeaf Publishing.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        <DemoPersonaBar currentUser={user} />
        <Navbar user={user} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
