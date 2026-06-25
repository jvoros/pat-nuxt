import { beforeEach, describe, expect, it, expectTypeOf } from "vitest";
import type { Board, BoardEvent, Shift } from "../server/core/types.js";
import BoardModule from "../server/core/board.js";
import dummy from "./dummy.config.js";

type Context = {
  board: Board;
  shiftId: Shift["id"];
  shiftId2: Shift["id"];
};

const makeBoard = (): Board => {
  const board = BoardModule.make({ slug: "ste", siteConfig: dummy });
  BoardModule.signIn(board, {
    provider: dummy.providers[0],
    schedule: dummy.schedule[0],
  });
  return board;
};

const lastEvent = (board: Board): BoardEvent => board.events[board.timeline[0]];

describe("Board Controller", () => {
  describe("Make", () => {
    it("should make Board from config params", () => {
      const b = BoardModule.make({ slug: "ste", siteConfig: dummy });
      expectTypeOf(b).toEqualTypeOf<Board>();
    });
  });

  describe("Sign In", () => {
    beforeEach<Context>((c) => {
      c.board = makeBoard();
    });
    it<Context>("should make a new Shift and add to shift index", (c) => {
      expect(Object.keys(c.board.shifts).length).toBe(1);
    });
    it<Context>("should add new shift to the zone specified in the schedule", (c) => {
      expect(c.board.zones["main"].shifts.length).toBe(1);
    });
    it<Context>("should add an Event for signing in", (c) => {
      expect(lastEvent(c.board).message).toEqual("Kelly Blake joined Main Rotation");
    });
  });

  describe("Join Zone", () => {
    it("should add shift to specified zone and add an Event", () => {
      const board = makeBoard();
      const shiftId = board.zones.main.shifts[0];
      BoardModule.joinZone(board, { shiftId, zoneSlug: "ft" });
      expect(board.zones.ft.shifts[0]).toEqual(shiftId);
      expect(lastEvent(board).message).toEqual("Kelly Blake joined Fast Track");
    });
    it("should not add to zone if already in that zone", () => {
      const board = makeBoard();
      const shiftId = board.zones.main.shifts[0];
      const lastEventId = board.timeline[0];
      BoardModule.joinZone(board, { shiftId, zoneSlug: "main" });
      expect(board.zones.main.shifts.length).toEqual(1);
      expect(board.timeline[0]).toEqual(lastEventId); // no new event
    });
  });

  describe("Leave Zone", () => {
    beforeEach<Context>((c) => {
      c.board = makeBoard();
      c.shiftId = c.board.zones.main.shifts[0];
      BoardModule.joinZone(c.board, { shiftId: c.shiftId, zoneSlug: "ft" });
    });
    it<Context>("should leave specified zone and add an Event", (c) => {
      BoardModule.leaveZone(c.board, { shiftId: c.shiftId, zoneSlug: "main" });
      expect(lastEvent(c.board).message).toEqual("Kelly Blake left Main Rotation");
    });
    it<Context>("should not allow a shift to leave its only remaining zone", (c) => {
      BoardModule.leaveZone(c.board, { shiftId: c.shiftId, zoneSlug: "main" });
      expect(() => {
        BoardModule.leaveZone(c.board, { shiftId: c.shiftId, zoneSlug: "ft" });
      }).toThrowError();
    });
  });

  describe("Switch Zones", () => {
    it("should leave one zone, join another, and add an Event", () => {
      const board = makeBoard();
      const shiftId = board.zones.main.shifts[0];
      BoardModule.switchZone(board, { shiftId, leaveZoneSlug: "main", joinZoneSlug: "ft" });
      expect(board.zones.main.shifts.length).toEqual(0);
      expect(board.zones.ft.shifts.length).toEqual(1);
      expect(lastEvent(board).message).toEqual(
        "Kelly Blake switched from Main Rotation to Fast Track",
      );
    });
  });

  describe("Sign Out", () => {
    beforeEach<Context>((c) => {
      c.board = makeBoard();
      c.shiftId = c.board.zones.main.shifts[0];
      BoardModule.joinZone(c.board, { shiftId: c.shiftId, zoneSlug: "ft" });
      BoardModule.signOut(c.board, { shiftId: c.shiftId });
    });
    it<Context>("should move signed-out shift to Off Zone", (c) => {
      expect(c.board.zones.off.shifts.length).toEqual(1);
    });
    it<Context>("should remove shift from all other zones", (c) => {
      expect(c.board.zones.main.shifts.length).toEqual(0);
      expect(c.board.zones.ft.shifts.length).toEqual(0);
    });
    it<Context>("should add an Event for signing out", (c) => {
      expect(lastEvent(c.board).message).toEqual("Kelly Blake signed out");
    });
  });

  describe("Delete Shift", () => {
    beforeEach<Context>((c) => {
      c.board = makeBoard();
      c.shiftId = c.board.zones.main.shifts[0];
      BoardModule.joinZone(c.board, { shiftId: c.shiftId, zoneSlug: "ft" });
    });
    it<Context>("should delete shift from shift index and all zones", (c) => {
      BoardModule.deleteShift(c.board, { shiftId: c.shiftId });
      expect(Object.keys(c.board.shifts).length).toBe(0);
      expect(c.board.shifts[c.shiftId]).toBeUndefined();
    });
    it<Context>("should add an Event for deletion", (c) => {
      BoardModule.deleteShift(c.board, { shiftId: c.shiftId });
      expect(lastEvent(c.board).message!.includes("Deleted")).toBeTruthy();
    });
    it<Context>("should throw an error if shift has patients assigned", (c) => {
      c.board.shifts[c.shiftId].assigned = 1;
      expect(() => {
        BoardModule.deleteShift(c.board, { shiftId: c.shiftId });
      }).toThrowError();
    });
  });

  describe("Adjust Rotation", () => {
    beforeEach<Context>((c) => {
      c.board = makeBoard();
      c.shiftId = c.board.zones.main.shifts[0];
      // Sign in a second physician so super pointer is meaningful
      BoardModule.signIn(c.board, { provider: dummy.providers[2], schedule: dummy.schedule[2] });
    });
    it<Context>("should move next pointer forward and add an Event", (c) => {
      BoardModule.adjustRotation(c.board, { zoneSlug: "main", which: "next", offset: 1 });
      expect(c.board.zones.main.next).toEqual(1);
      expect(lastEvent(c.board).message!.includes("forward")).toBeTruthy();
    });
    it<Context>("should move super pointer forward and add an Event", (c) => {
      expect(c.board.zones.main.super).toEqual(1); // first signed-in physician
      BoardModule.adjustRotation(c.board, { zoneSlug: "main", which: "super", offset: 1 });
      expect(c.board.zones.main.super).toEqual(0);
      expect(lastEvent(c.board).message!.includes("supervisor")).toBeTruthy();
    });
    it<Context>("should use 'back' in the event message for a backward adjustment", (c) => {
      BoardModule.adjustRotation(c.board, { zoneSlug: "main", which: "next", offset: -1 });
      expect(lastEvent(c.board).message!.includes("back")).toBeTruthy();
    });
  });

  describe("Pause / Unpause Shift", () => {
    beforeEach<Context>((c) => {
      c.board = makeBoard();
      c.shiftId = c.board.zones.main.shifts[0];
      BoardModule.togglePause(c.board, { shiftId: c.shiftId });
    });
    it<Context>("should pause a shift and add an Event", (c) => {
      expect(c.board.shifts[c.shiftId].status).toEqual("paused");
      expect(lastEvent(c.board).message!.includes("Paused")).toBeTruthy();
    });
    it<Context>("should unpause a shift and add an Event", (c) => {
      BoardModule.togglePause(c.board, { shiftId: c.shiftId });
      expect(c.board.shifts[c.shiftId].status).toEqual("active");
      expect(lastEvent(c.board).message!.includes("Unpaused")).toBeTruthy();
    });
  });

  describe("Triage", () => {
    beforeEach<Context>((c) => {
      c.board = makeBoard();
      c.shiftId = c.board.zones.main.shifts[0];
      BoardModule.addTriage(c.board, { shiftId: c.shiftId });
    });
    it<Context>("should increment triaged count on the shift", (c) => {
      expect(c.board.shifts[c.shiftId].triaged).toEqual(1);
    });
  });

  describe.todo("Reset");
});
