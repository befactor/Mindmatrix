# MindMatrix Academy

Booking, accounts, and payment platform for an academic tutoring center
specialized in **AP Business, AP Micro/Macroeconomics, IB Business
Management, IGCSE Business Studies, BTEC Business, EST Business/Economics,
and SAT prep**.

Students browse subjects, book an available time slot on a calendar, pay via
**CliQ** (Jordan's instant bank transfer system), and get confirmed once an
admin verifies the transfer. Admins manage availability and confirm/reject
payments from a simple dashboard.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Prisma** + **PostgreSQL** (Supabase in production)
- **NextAuth.js**: email/password (credentials) for now — OAuth providers
  can be added later the same way the schema already supports them
- Deployed on **Vercel**

## Why payment is "manual CliQ" and not a live gateway

CliQ has no public self-serve API for individuals or small businesses — it
requires a merchant agreement directly with a bank. Rather than block the
whole platform on that, the booking flow uses a **verified manual flow**:

1. Student picks a subject and time slot → a booking is created as
   `PENDING_PAYMENT` and the slot is reserved for them.
2. The payment page shows the center's CliQ alias and the exact amount, with
   step-by-step instructions.
3. Student transfers via their own bank app and submits the transaction's
   reference number (and optionally the sender name) back on the site → the
   booking moves to `AWAITING_CONFIRMATION`.
4. An admin checks the transfer against the bank app/SMS and clicks
   **Confirm** (→ `CONFIRMED`) or **Reject** (→ `REJECTED`, and the slot is
   released back for booking).

This needs no merchant account and no payment-gateway integration to launch.
If/when the center gets a real payment-gateway contract (PayTabs, HyperPay,
Telr, etc.), that can replace or sit alongside this flow — the `Payment`
model already isolates all payment-specific fields from the booking
lifecycle.

## What's implemented

- Landing page: center bio, highlights, and the full subject catalog
  (seeded — see below)
- Auth: email/password registration & sign-in (`STUDENT` by default)
- Booking: subject → day → time-slot picker, race-safe slot claiming
  (`AvailabilitySlot.isBooked` is flipped inside a transaction so two
  students can't double-book the same slot)
- CliQ payment page: instructions + proof-of-payment form
- Student dashboard: booking list with live status badges
- Admin dashboard (`/admin`, `ADMIN` role only):
  - Confirm/reject pending CliQ payments (shows reference number, sender
    name, amount)
  - Add/remove availability slots per subject
- Protected content library (`/learn`, `/admin/content`) — see below

## Protected content ("preview-only" video & PDF materials)

Once a student's payment for a subject is confirmed, they unlock that
subject's materials at `/learn`. Admins upload videos (as an external link)
and PDFs (uploaded directly) at `/admin/content`.

**Read this before promising students "no screenshots":** no website (and no
native app, really) can fully stop someone from copying what's on their own
screen — Netflix, Coursera, and Udemy can't do it either. Print Screen, a
phone camera pointed at the monitor, or a second computer recording the
screen all happen outside the browser's control. What this app does instead
is what those platforms actually do:

1. **Never a downloadable file.** Videos are external, ideally
   token-protected/expiring embed links (Bunny Stream, a private Vimeo link
   — not a raw MP4 URL). PDFs are stored as bytes in the database and served
   only through an entitlement-checked API route, then rendered client-side
   page-by-page onto a `<canvas>` — so the browser's native PDF viewer (and
   its own download/print button) never appears.
2. **A watermark on every view**, tiled across the video/PDF with the
   viewing student's name, email, and a live timestamp
   (`app/components/ContentProtection.tsx`). This is the part that actually
   matters: it doesn't stop a capture, but it makes any leaked copy
   traceable back to exactly who took it — a strong deterrent on its own.
3. **Friction, best-effort:** right-click/context menu, Ctrl+S/Ctrl+P,
   dev-tools shortcuts, and (where the browser exposes it) the Print Screen
   key are intercepted; the content also blurs/hides the instant the tab
   loses focus or visibility (`document.visibilitychange`/`window blur`),
   which breaks most screen-recording tools and delayed-capture screenshot
   tools. None of this is a real security boundary — treat it as friction,
   not a guarantee.

If stronger protection is ever needed, the real next step is a native mobile
app (Android's `FLAG_SECURE` can genuinely block screenshots/screen
recording at the OS level — iOS has no equivalent, only after-the-fact
screenshot *detection*), not more JavaScript.

## Why payment is "manual CliQ" and not a live gateway

```bash
npm install
cp .env.example .env.local
# fill in DATABASE_URL, NEXTAUTH_SECRET, and the CliQ alias/bank name
npx prisma migrate dev
npm run db:seed        # populates the subject catalog
npm run dev
```

Open http://localhost:3000

### Make yourself an admin

Registration always creates a `STUDENT`. Promote an account after
registering:

```bash
npm run make-admin -- you@example.com
```

(or open `npm run db:studio` and flip the `role` field by hand)

### Environment variables

See `.env.example`. Notes:

- **DATABASE_URL** — any Postgres instance works locally.
- **NEXTAUTH_SECRET** — generate with `openssl rand -base64 32`.
- **NEXTAUTH_URL** — `http://localhost:3000` locally, the deployed URL in
  production.
- **NEXT_PUBLIC_CLIQ_ALIAS / NEXT_PUBLIC_CLIQ_BANK_NAME** — shown directly
  to students on the payment page. **Set these to the center's real,
  bank-registered CliQ alias before going live** — a wrong value here sends
  students' money to the wrong place.

### Database commands

```bash
npm run db:migrate   # prisma migrate dev — create/apply a migration locally
npm run db:studio    # prisma studio — browse the local database
npm run db:seed      # (re)populate the subject catalog from prisma/seed.ts
```

`prisma generate` runs automatically on `npm install` (via `postinstall`).

## Deploying (Vercel + Supabase)

1. **Supabase**: create a project, grab the **pooled** connection string
   (port 6543, `pgbouncer=true`) for `DATABASE_URL` in Vercel, and the
   **direct** connection (port 5432) for running migrations.
2. Run `npx prisma migrate deploy` against the direct connection, then
   `npm run db:seed` once to populate subjects.
3. **Vercel**: New Project → import `befactor/mindmatrix` → Framework
   Preset: **Next.js**.
4. Add all environment variables from `.env.example` in Vercel (Production +
   Preview). Set `NEXTAUTH_URL` to the deployed URL and the CliQ variables to
   the center's real values.
5. Deploy. `prisma generate` runs automatically via `postinstall`.

## Project structure

```
app/
  page.tsx                    # landing: bio, highlights, subject catalog
  booking/page.tsx             # subject picker
  booking/[slug]/page.tsx       # day/time-slot picker -> creates a booking
  bookings/[id]/pay/page.tsx     # CliQ instructions + proof-of-payment form
  dashboard/page.tsx              # student's own bookings + status
  admin/page.tsx                   # confirm/reject payments, manage slots
  admin/content/page.tsx            # upload/delete video & PDF content
  learn/page.tsx                     # student's unlocked subjects + content
  learn/video/[id]/page.tsx           # watermarked video player
  learn/pdf/[id]/page.tsx              # watermarked, canvas-rendered PDF viewer
  auth/{signin,register}/               # NextAuth pages
  components/
    ContentProtection.tsx                # watermark + anti-capture hook
    Nav.tsx, Footer.tsx, icons.tsx
  api/
    auth/                             # NextAuth + email/password register
    subjects/                          # subject catalog + per-subject slots
    bookings/                           # create/list/pay bookings
    content/                             # entitlement-checked content reads
    admin/                                 # admin-only management routes
lib/
  auth.ts         # NextAuth config (credentials provider, JWT sessions)
  adminAuth.ts    # requireAdmin() session guard for admin API routes
  access.ts       # hasSubjectAccess() — CONFIRMED booking gates content
  prisma.ts       # Prisma client singleton
  config.ts       # public CliQ alias/bank name (from env)
  trackStyles.ts  # color coding per curriculum track
prisma/
  schema.prisma  # User/Subject/AvailabilitySlot/Booking/Payment/ContentItem
  seed.ts        # subject catalog (AP/IB/IGCSE/BTEC/EST/SAT)
scripts/
  make-admin.ts         # promote a registered user to ADMIN by email
  copy-pdf-worker.js    # postinstall: copies pdfjs-dist's worker to public/
```

## Not yet built

- Live payment-gateway integration (see "Why payment is manual CliQ" above)
- Tutor accounts/multiple tutors per subject (currently one shared
  availability calendar per subject)
- Email/SMS/WhatsApp notifications on booking confirmation
- Recurring/bulk slot creation in the admin UI (slots are added one at a
  time for now)
- Reschedule/cancel flow for students after booking
- PDF uploads go through Vercel's request body limit (~4.5 MB) since they're
  stored as bytes in Postgres — fine for lecture notes/cheat sheets, not for
  large scanned books. Large files need external storage (same idea as the
  video URL approach) instead of the `pdfData` column.
- No expiring/signed video URLs yet — that depends entirely on whichever
  external video host is used (Bunny Stream and Vimeo both support it)

## Important notes

- Never commit real secrets (`DATABASE_URL`, `NEXTAUTH_SECRET`) — they live
  only in `.env.local` (gitignored) and in Vercel's environment variables.
- The CliQ alias/bank name are **public** values on purpose (students need
  to see them to pay) — just make sure they're correct before launch.
