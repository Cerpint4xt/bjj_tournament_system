# BJJ Tournament System — Implementation Plan

> Last updated: 2026-05-09
> Status: Stage 1 Module 1 complete. Planning Stage 1 Module 2 (Admin Dashboard + Bracket).

---

## Strategy Overview

Build in two major stages:
1. **Stage 1 — Local-First** — SQLite database, no cloud required, fully offline. Get all workflows validated before touching cloud infrastructure.
2. **Stage 2 — Cloud Migration** — Swap SQLite for Supabase (PostgreSQL), add real-time sync, deploy to Vercel.

Migration path is intentionally frictionless: Drizzle ORM runs the same schema against both SQLite and PostgreSQL — only the `DATABASE_URL` env var changes.

---

## Core Decisions (Locked)

| Decision | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | Already in use |
| ORM | Drizzle ORM | SQLite locally, PostgreSQL on Supabase |
| DB local | SQLite (`better-sqlite3`) | File-based, fully offline |
| DB cloud | Supabase (PostgreSQL) | Drop-in swap via Drizzle |
| Auth | Auth.js v5 (NextAuth) | JWT, role-based |
| File storage | Supabase Storage | Athlete photos, QR uploads |
| Real-time | Supabase Realtime | Live scoring sync operator → audience |
| i18n | next-intl | Bilingual ES (primary) + EN |
| Deployment | Vercel | Native Next.js support |
| Bracket format | Single elimination | Only format for now |
| Age divisions | IBJJF standard | See table below |
| Weight classes | Numbers only (kg) | Admin normalizes messy input at import |
| Languages | Spanish + English | Bolivia-based users, forms in Spanish |
| Styling | Tailwind CSS | Already in use |

---

## Language / i18n

- **Spanish (es)** is the primary language — all forms, registration, and operator UI
- **English (en)** full translation maintained in parallel
- Locale files: `/messages/es.json` and `/messages/en.json`
- URL-based routing: `/es/...` and `/en/...`
- Every UI string must go through `next-intl` — no hardcoded text

---

## IBJJF Age Divisions

| Division | Age Range |
|---|---|
| Kids 1 | 4–5 years |
| Kids 2 | 6–7 years |
| Kids 3 | 8–9 years |
| Kids 4 | 10–11 years |
| Kids 5 | 12–13 years |
| Juvenile 1 | 14–15 years |
| Juvenile 2 | 16–17 years |
| Adult | 18–29 years |
| Master 1 | 30–35 years |
| Master 2 | 36–40 years |
| Master 3 | 41–45 years |
| Master 4 | 46–50 years |
| Master 5 | 51–55 years |
| Master 6 | 56+ years |

Age division is **auto-derived from date of birth** but admin can override per athlete.

---

## Belt System

**Kids (under 16):** White / Grey (Ploma) / Yellow (Amarilla) / Orange (Naranja) / Green (Verde)
**Adults (16+):** White (Blanca) / Blue (Azul) / Purple (Morada) / Brown (Café) / Black (Negra)

---

## Registration Data (Current CSV Fields)

Source: Google Forms export — `CAMPEONATO 17 DE MAYO 2026 (Responses) - Form Responses 1.csv`

| CSV Field | Status | Action |
|---|---|---|
| Timestamp | ✅ Clean | Use as registration date |
| Nombre | ✅ Good | Map to `name` |
| Edad | ⚠️ Messy | Normalize to integer, derive division |
| Cinturon | ⚠️ Messy | Normalize to belt enum |
| Peso (con Kimono) | ⚠️ Messy | Strip units → number (kg) |
| QR | Optional | Store as Google Drive URL |
| QR de inscripción | Optional | Store as Google Drive URL |
| **Gender** | ❌ Missing | Add to new form / admin assigns |
| **Academia** | ❌ Missing | Add to new form / admin assigns |
| **Fecha nacimiento** | ❌ Missing | Add to new form (replaces age) |

---

## Database Schema (Drizzle)

```
users           id, email, passwordHash, role, locale, createdAt
athletes        id, userId, name, belt, gender, dobYear, academyId, photoUrl
academies       id, name, country
tournaments     id, name, date, location, status, createdBy, locale
categories      id, tournamentId, belt, weightMin, weightMax, ageDivision, gender
registrations   id, athleteId, tournamentId, categoryId, weight, status, bracketPosition
matches         id, categoryId, round, position, athleteAId, athleteBId, status, matId
match_results   id, matchId, winnerId, scoreA, scoreB, advA, advB, penA, penB, duration
operators       id, userId, tournamentId, matId
audit_logs      id, userId, action, entity, entityId, before, after, timestamp
```

---

## STAGE 1 — LOCAL-FIRST

All data stored in SQLite. No cloud required. Works fully offline.

---

### ✅ Module 1 — Scoreboard + Operator Console

**Status: COMPLETE**

Combined full-screen scoreboard and operator UI:
- 3×2 score grid (+4/+3/+2 top, +1/Undo bottom)
- Undo last score action per athlete
- ADV/PEN mini-cards (green number / red number)
- Countdown timer with click-to-edit
- Inline editable athlete name and academy
- 5 color palettes (palette picker)
- Dark / light mode toggle
- Fullscreen toggle
- localStorage persistence (`bjj:current_match`)

---

### Module 2 — Database + CSV Import

**Goal:** Set up Drizzle + SQLite and build the CSV importer so real tournament data can be loaded.

**Steps:**
1. Install Drizzle ORM + `better-sqlite3`
2. Define schema (see Database Schema above)
3. Run migrations
4. Build CSV import page (`/admin/import`):
   - Upload Google Forms CSV
   - Preview parsed rows with warnings for messy fields
   - Normalize weight (strip "kg", "kilos", etc. → number)
   - Normalize belt (map Spanish variants → enum)
   - Normalize age → integer, derive IBJJF division
   - Flag missing fields (gender, academy, birth year)
   - Confirm → insert into `registrations` table

**Deliverables:**
- [ ] Drizzle schema + SQLite migration
- [ ] CSV parser + normalizer (weight, belt, age)
- [ ] Import preview UI (show errors/warnings per row)
- [ ] Bulk insert with conflict handling
- [ ] Admin can manually fill missing fields inline before confirming import

---

### Module 3 — Admin Dashboard

**Goal:** Admin reviews registrations, completes missing data, manages tournament setup.

**Screens:**
- `/admin` — Overview: tournament stats, pending actions
- `/admin/athletes` — Full athlete list with filters (belt, division, gender, status)
- `/admin/athletes/[id]` — Edit athlete: assign gender, academy, fix weight, override division
- `/admin/tournaments/new` — Create tournament
- `/admin/tournaments/[id]` — Tournament detail
- `/admin/tournaments/[id]/registrations` — Review + approve/reject registrations
- `/admin/tournaments/[id]/bracket` — Bracket management
- `/admin/tournaments/[id]/mats` — Mat assignment
- `/admin/tournaments/[id]/operators` — Operator management

**Key workflows:**
1. Create tournament (name, date, location, categories)
2. Import CSV → review → fill missing fields → approve
3. Generate bracket (group by belt × weight class × age division × gender)
4. Assign mats per category bracket
5. Add/invite operators
6. Publish tournament

**Deliverables:**
- [ ] Tournament creation form (bilingual)
- [ ] Registration review table (filter, sort, bulk approve/reject)
- [ ] Athlete edit form (fill missing fields: gender, academy, weight class, division)
- [ ] Bracket generator (single-elimination algorithm)
- [ ] Bracket editor (manual override of pairings)
- [ ] Mat assignment UI
- [ ] Operator list manager
- [ ] Publish/unpublish toggle

---

### Module 4 — Bracket + Live Match Flow

**Goal:** Connect the scoreboard to real match data from the database.

**Steps:**
1. Operator selects active tournament + mat
2. System loads next pending match from bracket
3. Scoreboard pre-fills athlete names from DB
4. Operator scores match → state saved to `match_results`
5. Admin clicks "End Match" → bracket advances (winner moves to next round)
6. Next match auto-loads

**Deliverables:**
- [ ] Match queue view (next match in bracket)
- [ ] Load match into scoreboard from DB
- [ ] Save match result to DB on end
- [ ] Bracket auto-advance (winner to next round)
- [ ] Bracket visual (single-elim tree, color-coded status)

---

### Module 5 — Auth + Roles (Local)

**Goal:** Basic login to protect admin and operator screens. No email required locally.

**Roles:**
- **Admin** — full access
- **Operator** — scoreboard + match queue only
- **Public** — read-only bracket and live scoreboard

**Deliverables:**
- [ ] Login page (email + password)
- [ ] Auth.js v5 with credentials provider
- [ ] Role-based middleware (route protection)
- [ ] Session management (JWT)

---

### Module 6 — Public Views

**Goal:** No-login spectator pages.

**Screens:**
- `/[locale]/tournament/[id]/live` — Live scoreboard (read-only)
- `/[locale]/tournament/[id]/bracket` — Full bracket with results
- `/[locale]/tournament/[id]/search` — Search competitor by name
- `/[locale]/tournament/[id]/results` — Leaderboard / results

**Deliverables:**
- [ ] Public bracket viewer (filter by category)
- [ ] Competitor search
- [ ] Results leaderboard
- [ ] Live scoreboard mirror (polls DB every 1–2s)

---

## STAGE 2 — CLOUD MIGRATION

Swap SQLite for Supabase. Add real-time sync. Deploy to Vercel.

**Steps:**
1. Create Supabase project
2. Update `DATABASE_URL` env var to Supabase PostgreSQL connection string
3. Run `drizzle-kit push` → schema migrates automatically
4. Enable Supabase Realtime on `matches` and `match_results` tables
5. Replace DB polling with Supabase Realtime subscriptions
6. Configure Auth.js with Supabase adapter
7. Move athlete photos to Supabase Storage
8. Deploy to Vercel — set env vars

**Additional Stage 2 features:**
- [ ] Operator invite via email (Resend or SendGrid)
- [ ] Athlete email verification
- [ ] Admin audit log viewer
- [ ] PDF bracket export
- [ ] CSV results export
- [ ] Tournament archive

---

## Build Order Summary

```
STAGE 1 (Local SQLite)
├── ✅ Module 1: Scoreboard + Operator Console
├── Module 2: Database + CSV Import        ← NEXT
├── Module 3: Admin Dashboard
├── Module 4: Bracket + Live Match Flow
├── Module 5: Auth + Roles
└── Module 6: Public Views

STAGE 2 (Supabase + Vercel)
├── Swap DB → Supabase PostgreSQL
├── Real-time via Supabase Realtime
├── Deploy to Vercel
├── Operator email invites
├── PDF + CSV exports
└── Tournament archive
```

---

## Open Questions / Things to Decide

- [ ] **Weight class ranges** — Define kg brackets per age division (or use IBJJF defaults?)
- [ ] **New Google Form fields** — Confirm adding: gender, academy, date of birth
- [ ] **Locale default** — Should the app default to `es` or ask on first visit?
- [ ] **Multi-mat** — How many mats per tournament maximum?
- [ ] **Walkover / DQ / Draw** — Should operator be able to mark these in Stage 1?
- [ ] **Photo requirement** — Is athlete photo mandatory or optional at registration?

---

## Key Constraints

- Stage 1 must work fully offline — no cloud calls
- Migration to Stage 2 requires zero UI changes — only data layer swaps
- All UI strings through `next-intl` — no hardcoded text anywhere
- Weight data from CSV must be normalized before bracket generation
- Admin can override any auto-derived field (division, weight class, belt)
