# BJJ Tournament System — Implementation Plan

## Strategy Overview

Build in two major stages:
1. **Local-First** — Pure frontend, no server, data lives in the browser. Get the UI working and validated before touching a backend.
2. **Server Migration** — Introduce a backend, database, and real-time infrastructure once the frontend is stable.

Each stage is broken into modules. Modules within a stage can be parallelized but are ordered by dependency.

---

## STAGE 1: LOCAL-FIRST FRONTEND

All data stored in `localStorage` / `sessionStorage`. No login required to start. Mock data files drive the UI. Real-time sync between Operator Console and Audience Display handled via `BroadcastChannel` API (works across tabs on the same device) or local WebSocket on the same LAN.

### Tech Stack (Stage 1)

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| State | Zustand (persisted to localStorage) |
| Real-time (local) | BroadcastChannel API |
| Data | JSON files + localStorage |
| Mock data | Hand-crafted JSON fixtures |

---

### Module 1 — Scoreboard + Operator Console (START HERE)

**Goal:** A single full-screen page that is both the live scoreboard and the operator scoring interface. The operator interacts directly with the scoreboard by clicking the scoring areas. Timer controls sit below the timer display. Athlete names and academies are inline-editable text fields.

**Screen:** `/` (single page, fullscreen)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  CATEGORY · ROUND · MAT                             │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│  [name textbox]      │      [name textbox]          │
│  [academy textbox]   │      [academy textbox]       │
│                      │                              │
│  [ +2 ] [ +3 ] [ +4 ]│  [ +2 ] [ +3 ] [ +4 ]      │
│      SCORE:  4       │      SCORE:  2               │
│                      │                              │
│  ADV  [ + | - ]  1   │  ADV  [ + | - ]  0          │
│  PEN  [ + | - ]  0   │  PEN  [ + | - ]  1          │
│                      │                              │
├──────────────────────┴──────────────────────────────┤
│                   05:00                             │
│          [ START ]  [ PAUSE ]  [ RESET ]            │
└─────────────────────────────────────────────────────┘
```

**Scoring rules:**
- Points: clicking +2, +3, or +4 adds that value to the athlete's score. Score cannot go below 0.
- Advantages (Adv): split button — left half +1, right half −1. Cannot go below 0.
- Penalties (Pen): split button — left half +1, right half −1. Cannot go below 0.
- Timer: counts down from a configurable duration. Start begins countdown, Pause freezes it, Reset returns to starting value.

**State (localStorage key: `bjj:current_match`):**
```json
{
  "athleteA": { "name": "Silva", "academy": "Gracie Barra", "score": 0, "adv": 0, "pen": 0 },
  "athleteB": { "name": "Mendes", "academy": "Alliance", "score": 0, "adv": 0, "pen": 0 },
  "timer": 300,
  "timerRunning": false,
  "category": "Adult Black Belt Light",
  "round": "Semifinal",
  "mat": "Mat 1"
}
```

**Deliverables:**
- [ ] Full-screen two-column scoreboard layout
- [ ] Inline editable text fields for athlete name and academy (click to edit)
- [ ] Score display with +2 / +3 / +4 buttons per side
- [ ] Split Adv button (+1 left / −1 right) per side, floored at 0
- [ ] Split Pen button (+1 left / −1 right) per side, floored at 0
- [ ] Countdown timer display
- [ ] Start / Pause / Reset timer controls
- [ ] State persisted to localStorage on every change

---

### Module 3 — Athlete Registration (Frontend Only)

**Goal:** Athlete self-registration form. Data saved to localStorage. No email/auth yet — just profile creation.

**Screens:**
- `/register` — Multi-step profile creation form
- `/profile` — View own profile

**Form steps:**
1. Personal info (name, email, belt, weight class, age division, gender, academy)
2. Photo upload (optional, stored as base64 or object URL)
3. Tournament selection (from mock tournament list)
4. Category confirmation
5. Submission → "Pending approval" state

**Deliverables:**
- [ ] Multi-step form with validation
- [ ] Belt / weight / age / gender selectors (BJJ-correct options)
- [ ] Photo upload + preview
- [ ] Tournament picker (from mock data)
- [ ] Local profile store (Zustand → localStorage)
- [ ] Athlete profile view page

---

### Module 4 — Admin Dashboard (Frontend Only)

**Goal:** Admin manages tournaments, approves athletes, generates brackets, sets up mats. All local.

**Screens:**
- `/admin` — Dashboard overview
- `/admin/tournament/new` — Create tournament
- `/admin/tournament/[id]/athletes` — Review registrations
- `/admin/tournament/[id]/bracket` — Bracket management
- `/admin/tournament/[id]/operators` — Operator invite list (local, no email)

**Key workflows:**
- Create tournament (name, date, location, categories)
- View registered athletes (approve / reject)
- Auto-generate bracket from approved athletes grouped by category
- Assign mats (drag-and-drop or dropdown per match)
- Set schedule (optional time slots)
- Publish tournament (flips a flag in localStorage)

**Deliverables:**
- [ ] Tournament creation form
- [ ] Registration review table (approve/reject actions)
- [ ] Bracket generator (single-elimination algorithm from athlete list)
- [ ] Mat assignment UI
- [ ] Bracket editor (manual override of pairings)
- [ ] Publish/unpublish toggle
- [ ] Operator list manager (add names, no email yet)

---

### Module 5 — Public Views (Frontend Only)

**Goal:** No-login spectator pages.

**Screens:**
- `/tournament/[id]/live` — Live scoreboard mirror (read-only, auto-refresh)
- `/tournament/[id]/bracket` — Full bracket with results, filterable by category
- `/tournament/[id]/search` — Search competitor by name
- `/tournament/[id]/results` — Leaderboard / results summary

**Deliverables:**
- [ ] Public bracket viewer (filter by belt/weight/age/gender)
- [ ] Competitor search
- [ ] Results leaderboard
- [ ] Live match ticker (polls localStorage every 1s)

---

### Stage 1 — Local Data Architecture

```
localStorage keys:
  bjj:tournaments        → Tournament[]
  bjj:athletes           → Athlete[]
  bjj:registrations      → Registration[]
  bjj:matches:[tid]      → Match[] (per tournament)
  bjj:current_match      → Match (active match being scored)
  bjj:bracket:[tid]      → Bracket (generated tree structure)

BroadcastChannel: "bjj_operator_channel"
  → Operator Console emits on every state change
  → Audience Display listens and re-renders
```

---

## STAGE 2: SERVER MIGRATION

Introduce a backend once the frontend is fully validated. The goal is to swap localStorage + BroadcastChannel for a real API + WebSockets with minimal frontend changes.

### Tech Stack (Stage 2)

| Layer | Choice |
|---|---|
| Backend | Next.js API Routes + tRPC |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v5 (JWT, role-based) |
| Real-time | Socket.io (replaces BroadcastChannel) |
| File storage | Supabase Storage (athlete photos) |
| Hosting | Vercel (frontend) + Railway or Supabase (Postgres) |

---

### Migration Module A — Database + Auth

**Goal:** Replace localStorage with Postgres. Add real login with roles.

**Steps:**
1. Define Prisma schema (mirrors local JSON structure)
2. Implement NextAuth with 3 providers: Athlete, Operator, Admin
3. JWT with role claim → role-based route protection
4. Seed DB with tournament fixture data
5. Replace Zustand localStorage store with tRPC queries/mutations

**Prisma models:**
- `User` (id, email, passwordHash, role, createdAt)
- `Athlete` (extends User: belt, weightClass, ageDivision, gender, academy, photoUrl)
- `Tournament` (id, name, date, location, status, createdBy)
- `Category` (id, tournamentId, belt, weightClass, ageDivision, gender)
- `Registration` (athleteId, tournamentId, categoryId, status, bracketPosition)
- `Match` (id, categoryId, round, position, athleteAId, athleteBId, status, matId, scheduledAt)
- `MatchResult` (matchId, winnerId, scoreA, scoreB, advA, advB, penA, penB, duration)
- `AuditLog` (id, userId, action, entityType, entityId, before, after, timestamp)

---

### Migration Module B — Real-time (WebSocket)

**Goal:** Replace BroadcastChannel with Socket.io so operator and audience display can be on different devices/networks.

**Steps:**
1. Add Socket.io server alongside Next.js
2. Create room per tournament: `tournament:{id}:mat:{matId}`
3. Operator console emits `score_update`, `match_end`, `match_start` events
4. Audience display subscribes to room and reacts to events
5. Server stores last-known match state (Redis or Postgres) for late joiners

**Events:**
```
score_update  → { matchId, scoreA, scoreB, advA, advB, penA, penB, timer }
match_start   → { matchId }
match_end     → { matchId, result }
match_load    → { match } (next match auto-loaded)
display_mode  → "live" | "bracket" | "upcoming"
```

---

### Migration Module C — Admin API

**Goal:** Move tournament setup from localStorage to server API.

**Endpoints (via tRPC or REST):**
- `tournament.create` / `tournament.publish`
- `athlete.approve` / `athlete.reject`
- `bracket.generate` (server-side algorithm, same logic as frontend)
- `mat.assign`
- `operator.invite` (now sends real email via Resend or SendGrid)
- `auditLog.list`

---

### Migration Module D — Athlete Auth + Registration

**Goal:** Real email/password login, persistent athlete profiles across tournaments.

**Steps:**
1. Athlete signup → creates `User` + `Athlete` record
2. Email verification (optional for v1)
3. Login → JWT with `ATHLETE` role
4. Registration flow hits API instead of localStorage
5. Admin approval triggers email notification to athlete

---

### Migration Module E — Reports + Exports

**Goal:** PDF exports, results archive, leaderboard.

**Steps:**
1. PDF bracket / results (React PDF or Puppeteer)
2. CSV export of athlete results
3. Tournament archive (mark as completed, read-only)
4. Public leaderboard endpoint (no auth required)

---

## Build Order Summary

```
STAGE 1 (Local)
├── Module 1: Scoreboard          ← START HERE
├── Module 2: Operator Console
├── Module 3: Athlete Registration
├── Module 4: Admin Dashboard
└── Module 5: Public Views

STAGE 2 (Server)
├── Module A: Database + Auth
├── Module B: Real-time WebSocket
├── Module C: Admin API
├── Module D: Athlete Auth
└── Module E: Reports + Exports
```

---

## Key Constraints

- Stage 1 must work entirely offline (no network calls)
- All Stage 1 state lives in `localStorage` — no cookies, no server
- BroadcastChannel works across tabs on the same browser/device only (good for single-venue on one machine)
- Stage 2 migration should require zero UI rewrites — only data layer changes
- Real-time sync in Stage 2 must survive operator reconnect without losing unsaved score

---

## Current Status

- [x] Architecture document written
- [x] Wireframes designed (scoreboard, admin dashboard, athlete profile)
- [ ] Module 1: Scoreboard — **IN PROGRESS**
