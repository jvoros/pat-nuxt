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
| UI | [Nuxt UI v4](https://ui.nuxt.com) + Tailwind CSS v4 |
| Database | SQLite via [Turso](https://turso.tech) |
| DB client | `@libsql/client` |
| Sessions | `nuxt-auth-utils` (sealed cookies) |
| Real-time | WebSockets via Nitro/CrossWS |
| Testing | Vitest via `@nuxt/test-utils` |

---

## Project structure

```
├── server/
│   ├── core/              # Business logic — pure functions, no framework dependencies
│   │   ├── types.ts       # All shared TypeScript types
│   │   ├── index.ts       # Public API: the Core object
│   │   ├── board.ts       # Board-level operations (sign in/out, zones, triage, etc.)
│   │   ├── assign.ts      # Patient assignment logic
│   │   ├── zone.ts        # Zone and rotation pointer logic
│   │   ├── shift.ts       # Shift construction and count management
│   │   ├── event.ts       # Board event construction
│   │   └── uid.ts         # ID generation (crypto.randomUUID)
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.post.ts   # Verifies access code, sets session
│   │   │   └── logout.post.ts  # Clears session
│   │   └── board/
│   │       └── [slug].get.ts   # Returns current board and site config for initial page load
│   │
│   ├── routes/
│   │   └── ws/
│   │       └── [slug].ts  # WebSocket handler — one room per site, handles all board actions
│   │
│   ├── db/                # Database access — Turso/libsql
│   │   ├── client.ts      # Singleton libsql client (useDb)
│   │   ├── queries.ts     # All typed query functions
│   │   └── schema.sql     # Reference schema for the existing Turso database
│   │
│   └── utils/
│       ├── auth.ts        # Access code hashing and verification
│       └── dispatch.ts    # Executes board actions, persists state, signals reset
│
├── app/
│   ├── composables/
│   │   └── useBoard.ts    # Board state, WebSocket connection, and action sender
│   ├── middleware/
│   │   └── auth.global.ts # Route guard — redirects based on session state
│   ├── pages/
│   │   ├── login.vue      # Login form
│   │   └── board.vue      # Board page (stub)
│   └── app.vue
│
├── tests/                 # Unit tests for server/core
│   ├── dummy.config.ts
│   ├── assign.test.ts
│   ├── board.test.ts
│   ├── event.test.ts
│   ├── shift.test.ts
│   └── zone.test.ts
│
├── nuxt.config.ts
├── vitest.config.ts
└── .env                   # Local dev credentials (not committed)
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

Server routes interact with `Core` exclusively through `dispatch`. It exposes:

| Method | Description |
|---|---|
| `Core.build` | Creates a fresh empty board from a site config |
| `Core.signIn` | Adds a provider/schedule as a new shift; resets the board if the schedule's `reset` flag is set |
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

## Authentication and sessions

Sites are protected by a shared access code — one code per emergency department, known by all staff on shift. There are no per-user accounts.

### Login flow

1. User submits site slug and access code to `POST /api/auth/login`
2. Server fetches the stored hash and salt for that site via `getAccessCode(slug)`
3. The submitted code is verified with `verifyCode(submitted, hash, salt)`
4. On success, `setUserSession({ slug })` stores the site slug in an encrypted cookie
5. Client refreshes its session and navigates to `/board`

Session cookies are encrypted using `NUXT_SESSION_PASSWORD` via `nuxt-auth-utils`. The plaintext access code is never stored.

### Route protection

`app/middleware/auth.global.ts` runs on every route change:
- Unauthenticated users are redirected to `/login`
- Authenticated users visiting `/login` are redirected to `/board`

### Access codes

Access codes are stored as **HMAC-SHA256 hashes with a per-site random salt**. To set a code for a site:

**Step 1** — Generate a salt and hash in Node:

```sh
node -e "import('node:crypto').then(({randomBytes,createHmac})=>{
  const salt=randomBytes(16).toString('hex');
  const hash=createHmac('sha256',salt).update('your-code').digest('hex');
  console.log('salt:',salt);
  console.log('hash:',hash);
})"
```

**Step 2** — Paste the output into a Turso SQL statement:

```sql
UPDATE sites
SET access_code_hash = '<hash>', access_code_salt = '<salt>'
WHERE slug = 'smh';
```

---

## Real-time updates (WebSockets)

Board state is kept in sync across all connected users via WebSockets. Nitro's built-in pub/sub handles broadcasting.

### Server

Each site has its own WebSocket endpoint at `/ws/[slug]` (`server/routes/ws/[slug].ts`). On connection:

1. The `upgrade` hook reads the session cookie and rejects with 401 if the session slug doesn't match the URL slug
2. On `open`, the peer subscribes to the site's pub/sub topic
3. On `message`, the action is passed to `dispatch` which runs it through `Core`, persists the result, and returns the updated board
4. The updated board is broadcast to all connected users at that site, including the sender
5. On `close`, the peer unsubscribes

All board mutations go through the WebSocket. The client sends:

```json
{ "action": "assignToZone", "payload": { "zoneSlug": "main", "mode": "walkin", "room": "4" } }
```

The server responds to all connected clients with:

```json
{ "ok": true, "board": { ... } }
```

Errors are returned only to the sender:

```json
{ "ok": false, "error": "Cannot leave last zone with shift" }
```

Undo is also handled via the WebSocket — send `{ "action": "undo" }` with no payload.

### `dispatch` (`server/utils/dispatch.ts`)

Sits between the WebSocket handler and `Core`. For every action it:
1. Fetches the current board from the database
2. Calls `Core[action](board, payload)`
3. Saves the pre-action board to `undos` and writes the updated board via `updateBoard`
4. Calls `clearUndos` if the action triggered a daily reset (`result.reset === true`)

### Client: `app/composables/useBoard.ts`

`useBoard()` is the single point of contact between the UI and the server. It manages:

- An initial `GET /api/board/[slug]` fetch to populate board and config state before the WebSocket connects
- The WebSocket connection to `/ws/[slug]`
- Reactive `board`, `config`, and `connected` state shared across all components via `useState`
- A `send(action)` function for dispatching actions over the WebSocket

```ts
const { board, config, connected, send } = useBoard();

// Example: assign next patient in a zone
send({ action: "assignToZone", payload: { zoneSlug: "main", mode: "walkin", room: "4" } });
```

The composable is a singleton — only one WebSocket connection is opened per session regardless of how many components call `useBoard()`. Call `resetBoard()` on logout to tear it down.

---

## Client composables

### `useAuth` (`app/composables/useAuth.ts`)

Centralises all authentication logic. Wraps `nuxt-auth-utils` so pages never call `$fetch` or `useUserSession` directly.

```ts
const { loggedIn, session, login, logout } = useAuth();
```

| Return value | Description |
|---|---|
| `loggedIn` | Reactive boolean — true if a valid session cookie exists |
| `session` | Reactive session object — contains `user.slug` |
| `login(slug, code)` | Posts credentials, refreshes session, navigates to `/board` |
| `logout()` | Clears session, tears down the board connection, navigates to `/login` |

### `useBoard` (`app/composables/useBoard.ts`)

Centralises all board communication. Any page or component that needs board state or wants to dispatch an action calls `useBoard()`.

```ts
const { board, config, connected, send } = useBoard();

// Example: assign next patient in a zone
send({ action: "assignToZone", payload: { zoneSlug: "main", mode: "walkin", room: "4" } });
```

| Return value | Description |
|---|---|
| `board` | Reactive `Board \| null` — updated on every server broadcast |
| `config` | Reactive `SiteConfig \| null` — populated on initial fetch |
| `connected` | Reactive boolean — WebSocket connection status |
| `send(action)` | Sends a board action over the WebSocket |

The composable is a singleton — only one WebSocket connection is opened per session regardless of how many components call `useBoard()`. Call `resetBoard()` on logout to tear it down.

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
Running shift activity totals, rewritten on every board save via `updateBoard`. Used for end-of-day reporting. Because logs are written atomically with every board update, they are always current — including after an undo.

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

## Environment variables

Nuxt maps `NUXT_*` env vars to `runtimeConfig` automatically.

| Variable | Description |
|---|---|
| `NUXT_TURSO_URL` | Turso database URL |
| `NUXT_TURSO_AUTH_TOKEN` | Turso auth token |
| `NUXT_SESSION_PASSWORD` | Cookie encryption key — must be at least 32 characters |

Generate a session password:
```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Fill in all values in `.env` — it is gitignored.

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
