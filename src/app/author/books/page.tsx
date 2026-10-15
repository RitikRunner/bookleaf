import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { BookOpen, IndianRupee, Layers, CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";
import { ProductionStepper } from "@/components/ProductionStepper";

export default async function AuthorBooksPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const books = await prisma.book.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" }
  });

  const totalCopiesSold = books.reduce((acc, b) => acc + b.totalCopiesSold, 0);
  const totalEarned = books.reduce((acc, b) => acc + b.totalRoyaltyEarned, 0);
  const totalPaid = books.reduce((acc, b) => acc + b.royaltyPaid, 0);
  const totalPending = books.reduce((acc, b) => acc + b.royaltyPending, 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              My Books & Royalties
            </h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">
              {books.length} {books.length === 1 ? "Title" : "Titles"}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Author Account: <span className="font-semibold text-slate-800">{user.name}</span> ({user.authorCode || user.email})
          </p>
        </div>

        <a
          href="/author/tickets/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-xs transition"
        >
          Submit Support Query
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>

      {/* Financial & Catalog Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="portal-card p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-2">
            <span>Total Copies Sold</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalCopiesSold.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">Across all retail channels</div>
        </div>

        <div className="portal-card p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-2">
            <span>Total Royalty Earned</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{totalEarned.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">80% author net profit share</div>
        </div>

        <div className="portal-card p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-2">
            <span>Royalty Paid</span>
            <CheckCircle2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{totalPaid.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-slate-400 mt-1">Disbursed via bank transfer</div>
        </div>

        <div className="portal-card p-5 bg-gradient-to-br from-white to-amber-50/50">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-2">
            <span>Royalty Pending</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900">
            ₹{totalPending.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalPending > 0 && totalPending < 1000 ? (
              <span className="text-amber-700 font-medium">
                Under ₹1,000 threshold (Rolls over)
              </span>
            ) : totalPending >= 1000 ? (
              <span className="text-emerald-700 font-medium">
                Ready for next payout cycle
              </span>
            ) : (
              "All settled"
            )}
          </div>
        </div>
      </div>

      {/* Book Cards with Production Stepper & Financials */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900">Published &amp; Active Books</h2>

        {books.length === 0 ? (
          <div className="portal-card p-8 text-center text-slate-500">
            No books found for this author account.
          </div>
        ) : (
          books.map((book) => {
            const inProduction = book.status.startsWith("In Production");

            return (
              <div key={book.id} className="portal-card overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900">{book.title}</h3>
                        <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {book.bookCode}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          inProduction ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {book.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                        <span><strong>Genre:</strong> {book.genre}</span>
                        <span><strong>ISBN:</strong> {book.isbn || "Pending Assignment"}</span>
                        <span>
                          <strong>Publication Date:</strong>{" "}
                          {book.publicationDate ? new Date(book.publicationDate).toLocaleDateString() : "In Pipeline"}
                        </span>
                        {book.printPartner && <span><strong>Print Partner:</strong> {book.printPartner}</span>}
                      </div>
                    </div>

                    <a
                      href={`/author/tickets/new?bookId=${book.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md transition self-start lg:self-center"
                    >
                      Raise Ticket for this Book
                    </a>
                  </div>

                  {/* If In Production: Render Stepper */}
                  {inProduction && (
                    <div className="my-4">
                      <ProductionStepper currentStatus={book.status} />
                    </div>
                  )}

                  {/* Financial Metrics Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-4 border-t border-slate-100 text-xs">
                    <div>
                      <div className="text-slate-400 font-medium">Retail MRP</div>
                      <div className="text-slate-800 font-bold mt-0.5">
                        {book.mrp ? `₹${book.mrp}` : "N/A (Pre-release)"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-medium">Royalty/Copy</div>
                      <div className="text-slate-800 font-bold mt-0.5">
                        {book.authorRoyaltyPerCopy ? `₹${book.authorRoyaltyPerCopy}` : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-medium">Copies Sold</div>
                      <div className="text-slate-800 font-bold mt-0.5">
                        {book.totalCopiesSold.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-medium">Total Earned</div>
                      <div className="text-slate-800 font-bold mt-0.5">
                        ₹{book.totalRoyaltyEarned.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-medium">Royalty Paid</div>
                      <div className="text-slate-800 font-bold mt-0.5">
                        ₹{book.royaltyPaid.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-medium">Royalty Pending</div>
                      <div className="font-bold mt-0.5 text-amber-700">
                        ₹{book.royaltyPending.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  {/* Retail Distribution Channels */}
                  {book.availableOn && book.availableOn.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase">Available On:</span>
                      {book.availableOn.map((platform) => (
                        <span key={platform} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {platform}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
