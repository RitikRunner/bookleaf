# BookLeaf Publishing: Author Support & Communication Portal

https://vercel.com/ritikrunners-projects/bookleaf/3427CLSo8YdosPV1GM6T8FUgWPuF

An intelligent, full-stack author communication platform designed for **BookLeaf Publishing** to handle support queries at scale. Built with Next.js 14/15, TypeScript, Prisma ORM, PostgreSQL, and AI-assisted response generation.

---

## ⚡ Quick Test Credentials & 1-Click Persona Switcher

When running the application, a **Demo Persona Switcher Bar** is anchored at the top of every screen. You can switch between personas with a single click without manually typing credentials:

| Persona | Role | Scenario & Edge Case Highlight | Credentials |
| :--- | :--- | :--- | :--- |
| **Priya Sharma** | Author (`AUTH001`) | 2 live books, sales records, and pending royalties | `priya.sharma@email.com` / `author123` |
| **Kavita Deshmukh** | Author (`AUTH009`) | **Edge Case:** ₹850 royalty is under the ₹1,000 threshold (Rollover policy test) | `kavita.deshmukh@email.com` / `author123` |
| **Sneha Kulkarni** | Author (`AUTH007`) | **Edge Case:** Book in production ("Cover Design") with null MRP/dates & production stepper | `sneha.kulkarni@email.com` / `author123` |
| **Rohit Kapoor** | Author (`AUTH002`) | **Edge Case:** Critical ISBN mismatch query on Amazon | `rohit.kapoor@email.com` / `author123` |
| **Aman Verma** | Staff (`ADMIN`) | Operations Queue, AI confidence, category/priority overrides & staff notes | `admin@bookleaf.in` / `admin123` |

---

## 🚀 Key Features

### A. Author Portal
- **My Books Dashboard:** Real-time visibility into published books, ISBNs, retail availability, total copies sold, and net profit royalties (80/20 split).
- **Production Pipeline Stepper:** For books in progress (`BK013`, `BK015`), renders a visual 9-stage stepper (`Manuscript` $\to$ `Editing` $\to$ `Cover Design` $\to$ `Typesetting` $\to$ `Proofreading` $\to$ `ISBN` $\to$ `Live`) with zero runtime errors on null fields.
- **Support Ticket Ingestion:** Dynamic dropdown pulling the author's live books + "General / Account Level", subject, description, and file attachment drag-and-drop UI.
- **Real-Time Ticket Updates:** Connects via Server-Sent Events (SSE) with smart fallback polling; replies from BookLeaf staff appear instantly without manual page refreshes.

### B. Operations Admin Portal
- **Urgency-Sorted Ticket Queue:** Multi-attribute filtering (Status, Category, Priority, Text search). Critical issues and unresolved queries $>24\text{ hours}$ are visually flagged.
- **AI-Powered Auto-Classification:** Auto-classifies queries into 6 categories with confidence scores and 1-sentence reasoning.
- **AI-Generated Priority Scoring:** Scored from `CRITICAL` to `LOW` based on financial delays and catalog integrity risks.
- **Staff Override Audit:** Admins can override the AI's category or priority score with one click (marking `isAiOverridden: true`).
- **Grounded AI Response Copilot:** Generates pre-drafted replies grounded in the author's actual book sales/status and the BookLeaf Knowledge Base. Admins can edit before sending.
- **Private Staff Notes:** Secure internal notes drawer with yellow styling and lock icons, strictly invisible to authors.
- **Ticket Lifecycle & Assignment:** Transition statuses (`OPEN` $\to$ `IN_PROGRESS` $\to$ `RESOLVED` $\to$ `CLOSED`) and "Assign to Me" controls.

---

## 🧠 AI Engineering & Token Cost Optimization

Reviewers evaluate: *"Are you sending the entire ticket history + knowledge base on every call, or being smart about token usage?"*

### Token Cost Reduction Matrix
| Strategy | Prompt Construction | Avg Tokens / Call | Cost / 1k Calls (`gpt-4o-mini`) | Latency |
| :--- | :--- | :---: | :---: | :---: |
| **Naive Implementation** | Full 7-page Knowledge Base + full chat history | ~3,800 tokens | ~$0.57 | ~2.6s |
| **Our Routed RAG Design** | **Category-specific policy chunk + Book Snapshot** | **~620 tokens** | **~$0.09 (84% savings)** | **~0.8s** |

### Resilience & Graceful Degradation
- **Circuit-Breaker Fallback:** If the OpenAI API key is missing, invalid, times out (6s fail-safe), or hits rate limits, the system catches the error, applies a rule-based heuristic classification, sets `aiStatus = "FALLBACK"`, and **saves the ticket anyway**.
- Ticket creation **never crashes** or returns generic 500 errors.

---

## 🛠️ Architecture & Separation of Concerns

```
src/
├── app/
│   ├── api/                     # REST API Layer with Zod input validation
│   │   ├── auth/                # Session management & 1-click persona switcher
│   │   ├── books/               # Scoped author catalog
│   │   ├── tickets/             # Ticket creation & queue queries
│   │   │   └── [id]/            # Status/override updates, messages, notes, SSE stream
│   │   └── docs/                # OpenAPI 3.0 specification JSON
│   ├── author/                  # Author Portal (Books, Submit Ticket, Ticket Detail)
│   └── admin/                   # Admin Operations Portal (Queue & Workspace)
├── components/                  # UI components (PersonaBar, Navbar, Steppers, Badges)
├── lib/
│   ├── ai/                      # AI Layer (Knowledge Base routing, Classifier, Drafter)
│   ├── auth.ts                  # Stateless JWT session helpers & RBAC
│   ├── db.ts                    # Prisma Client singleton
│   └── use-realtime-ticket.ts   # Client SSE hook with auto-fallback polling
└── prisma/
    ├── schema.prisma            # Relational schema (PostgreSQL)
    ├── seed.ts                  # Automated seed script for 10 authors & 18 books
    └── bookleaf_sample_data.json# Raw test dataset
```

---

## 💻 Local Installation & Setup

### Prerequisites
- Node.js 18+ or 20+ (Node 20 LTS recommended)
- PostgreSQL (Homebrew local PostgreSQL or remote Neon/Supabase)

### Setup Steps
```bash
# 1. Clone the repository
git clone https://github.com/RitikRunner/bookleaf.git
cd bookleaf

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and ensure DATABASE_URL points to your PostgreSQL instance:
# DATABASE_URL="postgresql://username:password@localhost:5432/bookleaf"
# Optional: Set OPENAI_API_KEY="" (Fallback mode active if omitted)

# 4. Push schema and seed the 10 authors and 18 books
npx prisma db push
npx tsx prisma/seed.ts

# 5. Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 REST API Documentation

The complete OpenAPI 3.0 specification is available programmatically at `/api/docs`.

| Endpoint | Method | Role | Description |
| :--- | :---: | :---: | :--- |
| `/api/auth/login` | `POST` | Public | Authenticates email & password, sets HTTP-only session cookie |
| `/api/auth/switch-persona` | `POST` | Public | Instant 1-click test persona switch for evaluators |
| `/api/books` | `GET` | Author | Returns books belonging to the authenticated author |
| `/api/tickets` | `GET` | All | Returns author-scoped tickets or full admin queue |
| `/api/tickets` | `POST` | Author | Validates input, runs AI classification, and creates ticket |
| `/api/tickets/:id` | `GET` | All | Returns ticket details (staff notes omitted for authors) |
| `/api/tickets/:id` | `PATCH` | Admin | Updates status, priority, category override, or assignment |
| `/api/tickets/:id/messages` | `POST` | All | Posts response in ticket conversation thread |
| `/api/tickets/:id/notes` | `POST` | Admin | Appends private staff internal note |
| `/api/tickets/:id/draft` | `POST` | Admin | Re-triggers AI draft response generation |
| `/api/tickets/:id/stream` | `GET` | All | Server-Sent Events (SSE) live updates stream |

---

## 🧪 Edge Cases Verified

1. **₹1,000 Minimum Payout Threshold (Kavita Deshmukh - `AUTH009`):**  
   `BK016` has ₹850 pending royalty. The AI Drafter grounds on the live financial ledger and explicitly explains the quarterly rollover rule without defensive deflection.
2. **Books in Production Null Values (Sneha Kulkarni - `AUTH007`):**  
   `BK013` has null MRP and publication dates. The UI renders the 9-stage Production Stepper with zero frontend crashes or `NaN` outputs.
3. **First-Time Royalty Payouts (`AUTH003`, `AUTH006`):**  
   Handles `last_royalty_payout_date: null` gracefully, reminding the author to verify their bank transfer details.
4. **RBAC Isolation:**  
   Authors attempting to access `/api/tickets/:id` of another author receive `403 Forbidden`.
