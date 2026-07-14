import type {
  Board,
  Provider,
  ScheduleItem,
  SiteConfig,
  Zone,
  Shift,
  Patient,
  BoardEvent,
  PatientModes,
} from "./types.js";
import BoardModule from "./board.js";
import Assign from "./assign.js";

export type CoreResponse = {
  board: Board;
  oldboard: Board;
  error?: unknown;
  reset?: boolean;
};

type BoardFn<T> = (board: Board, params: T) => void;

// withUndo clones the board before mutating so callers always get both
// the new state (board) and the prior state (oldboard) for undo storage
const withUndo = <T>(fn: BoardFn<T>) => {
  return (board: Board, params: T): CoreResponse => {
    const oldboard = structuredClone(board);
    try {
      fn(board, params);
      return { board, oldboard };
    } catch (error: unknown) {
      return { board: oldboard, oldboard, error };
    }
  };
};

const signInCheckReset = (
  board: Board,
  params: {
    provider: Provider;
    schedule: ScheduleItem;
  },
): CoreResponse => {
  if (params.schedule.reset) {
    const resetBoard = BoardModule.reset(board);

    // signIn withUndo() returns the signed-in board, but its 'oldboard' is just
    // the empty reset board — an intermediate state we don't want to expose.
    // Override with the original board so undo reverts to pre-reset state.
    const { board: signedInBoard, error } = withUndo(BoardModule.signIn)(
      resetBoard,
      params,
    );

    return { board: signedInBoard!, oldboard: board, error, reset: true };
  }
  return withUndo(BoardModule.signIn)(board, params);
};

export type Core = {
  build: (params: { slug: string; siteConfig: SiteConfig }) => Board;
  signIn: (
    board: Board,
    params: {
      provider: Provider;
      schedule: ScheduleItem;
    },
  ) => CoreResponse;
  signOut: (board: Board, params: { shiftId: Shift["id"] }) => CoreResponse;
  joinZone: (
    board: Board,
    params: { shiftId: Shift["id"]; zoneSlug: Zone["slug"] },
  ) => CoreResponse;
  leaveZone: (
    board: Board,
    params: { shiftId: Shift["id"]; zoneSlug: Zone["slug"] },
  ) => CoreResponse;
  switchZone: (
    board: Board,
    params: {
      shiftId: Shift["id"];
      leaveZoneSlug: Zone["slug"];
      joinZoneSlug: Zone["slug"];
    },
  ) => CoreResponse;
  deleteShift: (board: Board, params: { shiftId: Shift["id"] }) => CoreResponse;
  adjustRotation: (
    board: Board,
    params: { zoneSlug: Zone["slug"]; which: "next" | "super"; offset: number },
  ) => CoreResponse;
  togglePause: (board: Board, params: { shiftId: Shift["id"] }) => CoreResponse;
  addTriage: (board: Board, params: { shiftId: Shift["id"] }) => CoreResponse;
  assignToShift: (
    board: Board,
    params: {
      shiftId: Shift["id"];
      zoneSlug: Zone["slug"];
      mode: PatientModes;
      room: string;
    },
  ) => CoreResponse;
  assignToZone: (
    board: Board,
    params: { zoneSlug: Zone["slug"]; mode: PatientModes; room: string },
  ) => CoreResponse;
  reassign: (
    board: Board,
    params: { eventId: BoardEvent["id"]; newShiftId: Shift["id"] },
  ) => CoreResponse;
  changeRoom: (
    board: Board,
    params: { eventId: BoardEvent["id"]; newRoom: string },
  ) => CoreResponse;
  updateNote: (
    board: Board,
    params: { eventId: BoardEvent["id"]; note: string },
  ) => CoreResponse;
};

const Core: Core = {
  build: BoardModule.make,
  signIn: signInCheckReset,
  signOut: withUndo(BoardModule.signOut),
  joinZone: withUndo(BoardModule.joinZone),
  leaveZone: withUndo(BoardModule.leaveZone),
  switchZone: withUndo(BoardModule.switchZone),
  deleteShift: withUndo(BoardModule.deleteShift),
  adjustRotation: withUndo(BoardModule.adjustRotation),
  togglePause: withUndo(BoardModule.togglePause),
  addTriage: withUndo(BoardModule.addTriage),
  assignToShift: withUndo(Assign.toShift),
  assignToZone: withUndo(Assign.toZone),
  reassign: withUndo(Assign.reassign),
  changeRoom: withUndo(Assign.changeRoom),
  updateNote: withUndo(Assign.updateNote),
};

export default Core;
