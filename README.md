# Client Work Monitor

Internal tool for monitoring accounting + liaison work across all clients.
No signup/email flow — employees pick their name and enter a PIN. The Boss
adds employees from the **Employees** page.

## Roles

- **BOSS** — sees everything, adds employees, full team overview
- **ADMIN** — accounting manager, creates/assigns work, monitors deadlines
- **ACCOUNTING** — sees their own work + connected liaison updates on the same clients
- **LIAISON** — simplified dashboard (due today, overdue, waiting on client/docs, government follow-ups)

## 1. Local setup

```bash
npm install
cp .env.example .env       # then fill in DATABASE_URL and SESSION_SECRET
npx prisma db push          # creates tables from prisma/schema.prisma
npm run seed                 # creates a Boss + 2 sample employees + sample client
npm run dev
```

Open http://localhost:3000 — sign in as:

| Name  | Role       | PIN  |
|-------|------------|------|
| Boss  | BOSS       | 1234 |
| Maria | ACCOUNTING | 1111 |
| Carlo | LIAISON    | 2222 |

Change these PINs (or delete the seed employees and add your real team from
the Employees page) before giving anyone real access.

## 2. Get a free Postgres database

Any of these work — they all give you a `DATABASE_URL`:

- **Neon** (neon.tech) — easiest, has a native Vercel integration
- **Vercel Postgres** — set up directly from your Vercel project's Storage tab
- **Supabase** — also fine, just use the "connection pooling" URL

## 3. Deploy to Vercel

```bash
npm install -g vercel   # if you don't have it
vercel
```

Or push this folder to a GitHub repo and import it at vercel.com/new.

In the Vercel project settings → **Environment Variables**, add:

- `DATABASE_URL` — from step 2
- `SESSION_SECRET` — any long random string (`openssl rand -base64 32`)

Then, once deployed, run the schema push and seed once against the live
database (from your machine, with `.env` pointing at the production
`DATABASE_URL`):

```bash
npx prisma db push
npm run seed
```

After that, add your real employees from the **Employees** page in the app
— no redeploy needed.

## 4. Everyday use

- **Boss/Admin** creates clients (Clients → "+ New client") and tasks (via
  the Excel import, or you can add a "+ New task" form later the same way
  the client form is built).
- Everyone updates their own tasks' status/progress/notes inline in their
  dashboard.
- **Export to Excel** any time from the Team Overview page — pulls every
  task into a spreadsheet in the format your team already uses.
- **Import from Excel** on the same page: upload a file with columns
  `Client | Task Title | Work Role | Assigned To | Status | Due Date |
  Progress % | Notes`. Matching rows (same Client + Task Title) get
  updated in place; new ones get created. This is how you can keep
  batch-updating work the way you do today, while it still shows up live
  in everyone's dashboard.

## Notes on the "simple no auth" choice

There's still a login (name + PIN) so the Boss can tell whose work is
whose — but there's no email verification, password reset, or third-party
sign-in. PINs are stored hashed (bcrypt), and the session is a signed
cookie, so it's not wide open, just intentionally low-friction for a
~20-person internal tool. If you ever need real accounts (e.g. clients
logging in themselves), swap in NextAuth later — the roles/data model
don't need to change.
