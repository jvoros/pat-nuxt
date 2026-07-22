import Core from "../core/index";
import {
  getSite,
  updateBoard,
  addUndo,
  getUndo,
  clearUndos,
} from "../db/queries";
import type { Board } from "../core/types";

export type ActionMessage = {
  action: Exclude<keyof typeof Core, "build">;
  payload?: unknown;
};

export type DispatchResult =
  | { ok: true; board: Board }
  | { ok: false; error: string };

// Executes a board action by name, persists the result, and returns the new
// board state. The caller is responsible for broadcasting to connected peers.
export const dispatch = async (
  slug: string,
  message: ActionMessage,
): Promise<DispatchResult> => {
  const { action, payload } = message;

  const site = await getSite(slug);
  if (!site) return { ok: false, error: "Site not found" };

  // If no board exists yet this is the first sign-in of the day.
  // Build a fresh board so signIn has something to work with.
  const board: Board =
    site.board ?? Core.build({ slug, siteConfig: site.config });

  const fn = Core[action] as (
    board: Board,
    payload: unknown,
  ) => ReturnType<(typeof Core)[typeof action]>;

  if (typeof fn !== "function") {
    return { ok: false, error: `Unknown action: ${action}` };
  }

  const result = fn(
    board,
    action === "signIn"
      ? {
          ...(payload as Parameters<typeof Core.signIn>[1]),
          siteConfig: site.config,
        }
      : payload,
  );
  if (result.error) return { ok: false, error: String(result.error) };

  const undoId = await addUndo(result.oldboard);
  const boardToSave = { ...result.board, undo: undoId };
  await updateBoard(slug, boardToSave);

  // Prune stale undo rows when the board resets (first sign-in of the day).
  if (result.reset) await clearUndos(slug);

  return { ok: true, board: boardToSave };
};

// Applies the undo: reads the board stored at board.undo, saves it as the
// current board, and returns it. The previous board becomes the new undo target.
export const dispatchUndo = async (slug: string): Promise<DispatchResult> => {
  const site = await getSite(slug);
  if (!site?.board) return { ok: false, error: "No board to undo" };

  const { board } = site;
  if (!board.undo) return { ok: false, error: "Nothing to undo" };

  const undoRow = await getUndo(board.undo);
  if (!undoRow) return { ok: false, error: "Undo record not found" };

  // The board being restored may itself point to a further undo — keep the chain intact
  await updateBoard(slug, undoRow.board);
  return { ok: true, board: undoRow.board };
};
