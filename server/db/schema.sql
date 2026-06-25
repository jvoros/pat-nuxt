-- Patient Assignment Tool — Database Schema
-- SQLite hosted on Turso

-- One row per emergency department.
-- 'site' is a JSON blob of the full site config (zones, zoneOrder, schedule, providers, rooms).
-- 'board' is a JSON blob of the current active board state, updated on every action.
CREATE TABLE sites (
    slug TEXT PRIMARY KEY,
    site TEXT NOT NULL,   -- JSON: SiteConfig
    board TEXT            -- JSON: Board (null until first sign-in of the day)
);

-- End-of-day shift activity log. Written when the board resets in the morning.
-- 'bounty' is a legacy alias for the triaged count.
CREATE TABLE logs (
    date       INTEGER NOT NULL,
    site       TEXT    NOT NULL,
    shift      TEXT    NOT NULL,
    provider   TEXT    NOT NULL,
    assigned   INTEGER,
    supervised INTEGER,
    bounty     INTEGER,
    PRIMARY KEY (date, site, shift)
);

-- Undo history. Each row is the board state before an action was applied.
-- boards.undo references the most recent undos.id for that board.
CREATE TABLE undos (
    id    INTEGER PRIMARY KEY,
    board TEXT    NOT NULL,  -- JSON: Board state before the action
    site  TEXT    NOT NULL,
    date  INTEGER NOT NULL
);
