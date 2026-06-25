import { useDb } from "./client";
import type { Board, SiteConfig } from "../core/types";

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

// ---- Helpers --------------------------------------------------------------

// Builds log rows from the current board state. Called on every board save
// so logs are always current and never need special end-of-day handling.
const buildLogArgs = (board: Board) =>
  Object.values(board.shifts).map((shift) => [
    board.date,
    board.slug,
    shift.name,
    `${shift.first} ${shift.last}`,
    shift.assigned,
    shift.supervised,
    shift.triaged, // stored in the 'bounty' column
  ]);

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

// Saves the board state and rewrites the log rows for this board in one
// atomic batch. Works identically for normal actions and undos.
export const updateBoard = async (
  slug: string,
  board: Board,
): Promise<void> => {
  const db = useDb();
  const logRows = buildLogArgs(board);
  await db.batch(
    [
      {
        sql: "UPDATE sites SET board = ? WHERE slug = ?",
        args: [JSON.stringify(board), slug],
      },
      ...logRows.map((args) => ({
        sql: `INSERT OR REPLACE INTO logs (date, site, shift, provider, assigned, supervised, bounty)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args,
      })),
    ],
    "write",
  );
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

// Removes undo rows older than 48 hours for a given site. Called on board reset.
// Keeping 48 hours of history allows recovery if a board is accidentally reset.
export const clearUndos = async (slug: string): Promise<void> => {
  const db = useDb();
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  await db.execute({
    sql: "DELETE FROM undos WHERE site = ? AND date < ?",
    args: [slug, cutoff],
  });
};
