import { useDb } from "./client";
import type { Board, LogItem, SiteConfig } from "../core/types";

// ---- Types ----------------------------------------------------------------

export type SiteRow = {
  slug: string;
  name: string;
  accessCode: string;
  timezone: string;
  config: SiteConfig;
};

export type BoardRow = {
  id: number;
  slug: string;
  date: number;
  state: Board;
  undoId: number | null;
};

export type UndoRow = {
  id: number;
  slug: string;
  date: number;
  state: Board;
};

// ---- Sites ----------------------------------------------------------------

export const getSite = async (slug: string): Promise<SiteRow | null> => {
  const db = useDb();
  const result = await db.execute({
    sql: "SELECT slug, name, access_code, timezone, config FROM sites WHERE slug = ?",
    args: [slug],
  });
  const row = result.rows[0];
  if (!row) return null;
  return {
    slug: row.slug as string,
    name: row.name as string,
    accessCode: row.access_code as string,
    timezone: row.timezone as string,
    config: JSON.parse(row.config as string) as SiteConfig,
  };
};

// ---- Boards ---------------------------------------------------------------

export const getBoard = async (
  slug: string,
  date: number,
): Promise<BoardRow | null> => {
  const db = useDb();
  const result = await db.execute({
    sql: "SELECT id, slug, date, state, undo_id FROM boards WHERE slug = ? AND date = ?",
    args: [slug, date],
  });
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id as number,
    slug: row.slug as string,
    date: row.date as number,
    state: JSON.parse(row.state as string) as Board,
    undoId: row.undo_id as number | null,
  };
};

export const upsertBoard = async (
  board: Board,
  undoId: number | null,
): Promise<void> => {
  const db = useDb();
  await db.execute({
    sql: `INSERT INTO boards (slug, date, state, undo_id)
          VALUES (?, ?, ?, ?)
          ON CONFLICT (slug, date)
          DO UPDATE SET state = excluded.state, undo_id = excluded.undo_id`,
    args: [board.slug, board.date, JSON.stringify(board), undoId],
  });
};

// ---- Undos ----------------------------------------------------------------

export const addUndo = async (board: Board): Promise<number> => {
  const db = useDb();
  const result = await db.execute({
    sql: "INSERT INTO undos (slug, date, state) VALUES (?, ?, ?)",
    args: [board.slug, board.date, JSON.stringify(board)],
  });
  return Number(result.lastInsertRowid);
};

export const getUndo = async (id: number): Promise<UndoRow | null> => {
  const db = useDb();
  const result = await db.execute({
    sql: "SELECT id, slug, date, state FROM undos WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id as number,
    slug: row.slug as string,
    date: row.date as number,
    state: JSON.parse(row.state as string) as Board,
  };
};

// Removes all undo rows for a site/date. Called when the board resets
// at the start of a new day — prior undo history is no longer relevant.
export const clearUndos = async (slug: string, date: number): Promise<void> => {
  const db = useDb();
  await db.execute({
    sql: "DELETE FROM undos WHERE slug = ? AND date = ?",
    args: [slug, date],
  });
};

// ---- Logs -----------------------------------------------------------------

export const saveLogs = async (logs: LogItem[]): Promise<void> => {
  if (logs.length === 0) return;
  const db = useDb();
  await db.batch(
    logs.map((log) => ({
      sql: `INSERT OR REPLACE INTO logs (date, slug, shift, provider, assigned, supervised, triaged)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        log.date,
        log.site,
        log.shift,
        log.provider,
        log.assigned,
        log.supervised,
        log.triaged,
      ],
    })),
    "write",
  );
};
