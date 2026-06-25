// @ts-ignore
import { turso } from "./client.js";

const query = async (sql: string, args: any) => {
  try {
    const data = await turso.execute({ sql, args });
    return {
      data: data.rows[0],
      lastInsertRowid: data.lastInsertRowid,
      error: false,
    };
  } catch (err) {
    return { error: err };
  }
};

const getBoardSql = `
  SELECT board
  FROM sites
  WHERE slug = :slug
  `;

const updateBoardSql = `
  UPDATE sites
  SET board = :newBoard
  WHERE slug = :slug
  `;

const getSiteSql = `
  SELECT site
  FROM sites
  WHERE slug = :slug
  `;

const updateLogsSql = `
  INSERT OR REPLACE INTO logs (date, site, shift, provider, assigned, supervised, bounty, triaged)
  VALUES (:date, :site, :shift, :provider, :assigned, :supervised, :bounty, :triaged)
  `;

const deleteLogsSql = `
  DELETE FROM logs
  WHERE date = :date AND site = :site
  `;

const addUndoSql = `
  INSERT INTO undos (board, site, date)
  VALUES (:oldboard, :site, :date)
  `;

const getUndoSql = `
  SELECT *
  FROM undos
  WHERE id = :id
  `;

const logQuery = async (logs: LogItem[]) => {
  const mappedParams = logs.map((log) => ({
    sql: updateLogsSql,
    args: { ...log, bounty: log.bounty ?? 0 },
  }));
  try {
    const res = await turso.batch(mappedParams, "write");
    return { data: "success", error: false };
  } catch (err) {
    return { error: err };
  }
};

export default {
  getBoard: async (slug: string) => await query(getBoardSql, { slug }),

  updateBoard: async (slug: string, newBoard: Board) => {
    return await query(updateBoardSql, {
      slug,
      newBoard: JSON.stringify(newBoard),
    });
  },

  getSite: async (slug: string) => await query(getSiteSql, { slug }),

  saveLogs: async (logs: LogItem[]) => await logQuery(logs),

  deleteLogs: async (date: number, site: string) =>
    await query(deleteLogsSql, { date, site }),

  addUndo: async (oldboard: Board) => {
    return await query(addUndoSql, {
      oldboard: JSON.stringify(oldboard),
      site: oldboard.slug,
      date: oldboard.date,
    });
  },

  getUndo: async (id: number) => {
    return await query(getUndoSql, { id });
  },
};
