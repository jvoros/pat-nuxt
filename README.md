# Patient Assignment Tool

A web application used by emergency department staff to assign patients to doctors and advance-practice providers (APPs) during a shift. It tracks who is up next in a rotation, records patient arrivals, and keeps a live event log of board activity.

There is no connection to any medical record system. No patient-identifying data is stored — only room number, arrival mode, and arrival time.

---

## What it does

The application is built around a **board**. Each emergency department (site) has one board per calendar day. The board tracks:

- Which providers are on shift and which zone they are working
- Who is next in each rotation to receive a patient
- A running log of events (assignments, sign-ins, sign-outs, etc.)
- The ability to undo the most recent action

When the first shift of a new day signs in, the board resets and the previous day's data is cleared.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Nuxt 4](https://nuxt.com) |
| Language | TypeScript (strict) |
| Database | SQLite via [Turso](https://turso.tech) |
| DB client | `@libsql/client` |
| Testing | Vitest via `@nuxt/test-utils` |

---

## Project structure

```
├── server/
│   ├── core/          # Business logic — pure functions, no framework dependencies
│   │   ├── types.ts   # All shared TypeScript types
│   │   ├── index.ts   # Public API: the Core object
│   │   ├── board.ts   # Board-level operations (sign in/out, zones, triage, etc.)
│   │   ├── assign.ts  # Patient assignment logic
│   │   ├── zone.ts    # Zone and rotation pointer logic
│   │   ├── shift.ts   # Shift construction and count management
│   │   ├── event.ts   # Board event construction
│   │   └── uid.ts     # ID generation (crypto.randomUUID)
│   │
│   ├── db/            # Database access — Turso/libsql
│   │   ├── client.ts  # Singleton libsql client (useDb)
│   │   ├── queries.ts # All typed query functions
│   │   └── schema.sql # Reference schema for the existing Turso database
│   │
│   └── utils/
│       └── auth.ts    # Access code hashing and verification
│
├── app/               # Vue frontend (not yet built)
│   └── app.vue
│
├── tests/             # Unit tests for server/core
│   ├── dummy.config.ts
│   ├── assign.test.ts
│   ├── board.test.ts
│   ├── event.test.ts
│   ├── shift.test.ts
│   └── zone.test.ts
│
├── nuxt.config.ts
├── vitest.config.ts
└── .env               # Local dev credentials (not committed)
```

---

## Core module (`server/core`)

This is the heart of the application. It is pure TypeScript with no framework dependencies — no Nuxt, no database, no Vue. Every function takes a `Board` and returns a new `Board`.

### The `withUndo` pattern

Every action is wrapped with `withUndo`, which:
1. Clones the board with `structuredClone` before mutation
2. Applies the mutation
3. Returns both `{ board, oldboard }`

The `oldboard` is passed to `addUndo` in the database layer so it can be restored if the user undoes the action.

### The `Core` public API

Server routes interact with `Core` exclusively. It exposes:

| Method | Description |
|---|---|
| `Core.build` | Creates a fresh empty board from a site config |
| `Core.signIn` | Adds a provider/schedule as a new shift; triggers daily reset if applicable |
| `Core.signOut` | Moves a shift to the Off Rotation zone |
| `Core.joinZone` | Adds a shift to an additional zone |
| `Core.leaveZone` | Removes a shift from a zone |
| `Core.switchZone` | Moves a shift from one zone to another |
| `Core.deleteShift` | Removes a shift with zero patients from the board |
| `Core.adjustRotation` | Manually advances or steps back a rotation pointer |
| `Core.togglePause` | Pauses or unpauses a shift in the rotation |
| `Core.addTriage` | Increments the triage count on a shift |
| `Core.assignToShift` | Assigns a patient directly to a named shift |
| `Core.assignToZone` | Assigns a patient to whoever is next in a zone's rotation |
| `Core.reassign` | Moves a patient from one shift to another, adjusting supervisor counts |
| `Core.changeRoom` | Updates the room on an existing assignment event |

### Zones

Each board has several zones. A zone's `type` determines its behaviour:

| Type | Behaviour |
|---|---|
| `dual` | Rotates both patient assignments and supervisor assignments from the same list |
| `rotation` | Rotates patient assignments only |
| `simple` | The shift at index 0 is always next; used for fast-track / pit zones |
| `list` | No rotation; used for the Off Rotation zone |

### Board state

The board is a single JSON object. Key fields:

```ts
type Board = {
  slug: string;            // site identifier
  date: number;            // timestamp for the board day
  zoneOrder: string[];     // display order of zones
  timeline: string[];      // ordered list of recent event IDs
  zones: IndexZone;        // zone state keyed by slug
  shifts: IndexShift;      // shift state keyed by id
  events: IndexBoardEvent; // event log keyed by id
}
```

---

## Database layer (`server/db`)

Connects to a Turso-hosted SQLite database. The schema has three tables:

### `sites`
One row per emergency department. Stores the site config JSON, the current active board JSON, and the hashed access code — all on the same row.

```
slug             TEXT PRIMARY KEY
site             TEXT  -- JSON: full SiteConfig (zones, schedule, providers, rooms)
board            TEXT  -- JSON: current Board state (null until first sign-in)
access_code_hash TEXT  -- HMAC-SHA256 hash of the site access code
access_code_salt TEXT  -- per-site random salt
```

### `undos`
One row per saved prior board state. Each action saves the pre-action board here before applying the mutation. The `undo` field on the board JSON holds the row ID to restore. Rows older than 48 hours are pruned on each daily reset, giving a recovery window for accidental resets.

```
id    INTEGER PRIMARY KEY
board TEXT  -- JSON: Board state before the action
site  TEXT
date  INTEGER
```

### `logs`
Running shift activity totals, rewritten on every board save. Used for end-of-day reporting. Because logs are written atomically with every `updateBoard` call, they are always current — including after an undo.

```
date, site, shift, provider  -- composite primary key
assigned, supervised, bounty -- bounty = triaged count (legacy column name)
```

### Query functions (`queries.ts`)

| Function | Description |
|---|---|
| `getSite(slug)` | Returns the site config and current board state |
| `updateBoard(slug, board)` | Saves board state and rewrites log rows in a single batch |
| `addUndo(board)` | Inserts a board snapshot into `undos`, returns the new row ID |
| `getUndo(id)` | Retrieves a prior board snapshot by ID |
| `clearUndos(slug)` | Deletes undo rows older than 48 hours for a site; called on daily reset |
| `getAccessCode(slug)` | Returns the stored hash and salt for a site |
| `setAccessCode(slug, hash, salt)` | Stores a new hashed access code for a site |

---

## Authentication (`server/utils/auth.ts`)

Sites are protected by a shared access code — one code per emergency department, known by all staff on shift. There are no per-user accounts.

Access codes are stored as **HMAC-SHA256 hashes with a per-site random salt**. The plaintext code is never stored. The salt ensures the same code produces a different hash at each site.

| Function | Description |
|---|---|
| `generateSalt()` | Generates a random 16-byte hex salt |
| `hashCode(code, salt)` | Hashes a code with a site's salt (normalises whitespace and case) |
| `verifyCode(submitted, storedHash, salt)` | Returns `true` if the submitted code matches |

### Setting an access code for a site

**Step 1** — Generate a salt and hash in Node:

```sh
node --input-type=module << 'EOF'
import { randomBytes, createHmac } from 'node:crypto';
const salt = randomBytes(16).toString('hex');
const hash = createHmac('sha256', salt).update('your-code').digest('hex');
console.log('salt:', salt);
console.log('hash:', hash);
EOF
```

**Step 2** — Paste the output into a Turso SQL statement:

```sql
UPDATE sites
SET access_code_hash = '<hash>', access_code_salt = '<salt>'
WHERE slug = 'smh';
```

### Database migration

The `access_code_hash` and `access_code_salt` columns do not exist in the original schema. Run these against the live database once:

```sql
ALTER TABLE sites ADD COLUMN access_code_hash TEXT;
ALTER TABLE sites ADD COLUMN access_code_salt TEXT;
```

---

## Environment variables

Nuxt maps `NUXT_*` env vars to `runtimeConfig` automatically.

| Variable | `runtimeConfig` key | Description |
|---|---|---|
| `NUXT_TURSO_URL` | `tursoUrl` | Turso database URL |
| `NUXT_TURSO_AUTH_TOKEN` | `tursoAuthToken` | Turso auth token |

Fill in your credentials from the [Turso dashboard](https://app.turso.tech) in `.env` — it is gitignored.

---

## Running locally

```sh
npm install
npm run dev
```

## Tests

Tests cover `server/core` only (pure logic, no database or framework).

```sh
npm test           # single run
npm run test:watch # watch mode
```

72 tests across 5 suites: `event`, `shift`, `zone`, `board`, `assign`.
