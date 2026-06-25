-- Patient Assignment Tool — Database Schema
-- SQLite hosted on Turso

-- Site configuration. One row per emergency department.
-- 'config' stores zones, schedule, rooms, providers as JSON.
-- Site config is managed separately from the live board.
CREATE TABLE IF NOT EXISTS sites (
    slug        TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    access_code TEXT NOT NULL,
    timezone    TEXT NOT NULL,
    config      TEXT NOT NULL  -- JSON: { zones, zoneOrder, schedule, rooms }
);

-- Active board state. One row per site per calendar day.
-- 'state' is the full board JSON. 'undo_id' points to the most recent
-- entry in the undos table so the last action can be reversed.
CREATE TABLE IF NOT EXISTS boards (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    slug    TEXT    NOT NULL,
    date    INTEGER NOT NULL,  -- start-of-day timestamp for the board
    state   TEXT    NOT NULL,  -- JSON: full Board object
    undo_id INTEGER,           -- FK → undos.id (nullable: no undo available)
    UNIQUE (slug, date)
);

-- Undo history. Each row is a prior board state snapshot saved before
-- an action was applied. Chained via boards.undo_id.
CREATE TABLE IF NOT EXISTS undos (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    slug    TEXT    NOT NULL,
    date    INTEGER NOT NULL,
    state   TEXT    NOT NULL   -- JSON: Board state before the action
);

-- End-of-day activity log. One row per shift per board day.
-- Written when the board resets in the morning.
CREATE TABLE IF NOT EXISTS logs (
    date       INTEGER NOT NULL,
    slug       TEXT    NOT NULL,
    shift      TEXT    NOT NULL,
    provider   TEXT    NOT NULL,
    assigned   INTEGER NOT NULL DEFAULT 0,
    supervised INTEGER NOT NULL DEFAULT 0,
    triaged    INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (date, slug, shift)
);
