import { useDb } from "./client";
import type { Board, LogItem, SiteConfig } from "../core/types";

// ---- Types ----------------------------------------------------------------

export type SiteRow = {
  slug: string;
  config: SiteConfig;
  board: Board | null;
};

export type UndoRow = {
  id: number;
  board: Board;
  site: string;
  date: number;
};

// ---- Sites ----------------------------------------------------------------

export const getSite = async (slug: string): Promise<SiteRow | null> => {
  const db = useDb();
  const result = await db.execute({
    sql: "SELECT slug, site, board FROM sites WHERE slug = ?",
    args: [slug],
  });
  const row = result.rows[0];
  if (!row) return null;
  return {
    slug: row.slug as string,
    config: JSON.parse(row.site as string) as SiteConfig,
    board: row.board ? (JSON.parse(row.board as string) as Board) : null,
  };
};

export const updateBoard = async (
  slug: string,
  board: Board,
): Promise<void> => {
  const db = useDb();
  await db.execute({
    sql: "UPDATE sites SET board = ? WHERE slug = ?",
    args: [JSON.stringify(board), slug],
  });
};

// ---- Undos ----------------------------------------------------------------

export const addUndo = async (board: Board): Promise<number> => {
  const db = useDb();
  const result = await db.execute({
    sql: "INSERT INTO undos (board, site, date) VALUES (?, ?, ?)",
    args: [JSON.stringify(board), board.slug, board.date],
  });
  return Number(result.lastInsertRowid);
};

export const getUndo = async (id: number): Promise<UndoRow | null> => {
  const db = useDb();
  const result = await db.execute({
    sql: "SELECT id, board, site, date FROM undos WHERE id = ?",
    args: [id],
  });
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id as number,
    board: JSON.parse(row.board as string) as Board,
    site: row.site as string,
    date: row.date as number,
  };
};

export const clearUndos = async (slug: string, date: number): Promise<void> => {
  const db = useDb();
  await db.execute({
    sql: "DELETE FROM undos WHERE site = ? AND date = ?",
    args: [slug, date],
  });
};

// ---- Logs -----------------------------------------------------------------

export const saveLogs = async (logs: LogItem[]): Promise<void> => {
  if (logs.length === 0) return;
  const db = useDb();
  await db.batch(
    logs.map((log) => ({
      sql: `INSERT OR REPLACE INTO logs (date, site, shift, provider, assigned, supervised, bounty)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        log.date,
        log.site,
        log.shift,
        log.provider,
        log.assigned,
        log.supervised,
        log.triaged, // stored in the 'bounty' column
      ],
    })),
    "write",
  );
};
