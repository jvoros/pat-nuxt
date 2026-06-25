-- Initial DB Setup
-- Tables: sites, logs, undos
-- Rudimentary, just handles JSON config, not true relational DB, just stores config separate from app
-- Digital Ocean can reboot app, not persistent data store

-- this JSON dictates behavior of board
-- use 'zones' in reset()
-- changes take effect next day on reset()
-- 'board' is the active board updated with every action

CREATE TABLE sites (
    slug TEXT PRIMARY KEY,      -- Slug as the primary key
    site TEXT NOT NULL,         -- JSON: config data
    board TEXT,                 -- JSON: the active board
);

CREATE TABLE logs (
    date INTEGER NOT NULL,
    site TEXT NOT NULL,
    shift TEXT NOT NULL,
    provider TEXT NOT NULL,
    assigned INTEGER,
    supervised INTEGER,
    bounty INTEGER,
    PRIMARY KEY (date, site, shift)
);

CREATE TABLE undos (
    id INTEGER PRIMARY KEY,
    board TEXT,
    site TEXT NOT NULL,
    date INTEGER NOT NULL,
);
