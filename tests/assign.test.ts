import { beforeEach, describe, expect, it } from "vitest";
import type { Board, BoardEvent, Shift } from "../server/core/types.js";
import AssignModule from "../server/core/assign.js";
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

describe("Assign Controller", () => {
  describe("Assign to Shift", () => {
    beforeEach<Context>((c) => {
      c.board = makeBoard();
      // Sign in an APP so supervisor assignment is exercised
      BoardModule.signIn(c.board, {
        schedule: dummy.schedule[1],
        provider: dummy.providers[1],
      });
      c.shiftId = c.board.zones.main.shifts[0];
      AssignModule.toShift(c.board, {
        shiftId: c.shiftId,
        zoneSlug: "main",
        mode: "ft",
        room: "1",
      });
    });
    it<Context>("should increment assigned count on the shift", (c) => {
      expect(c.board.shifts[c.shiftId].assigned).toEqual(1);
    });
    it<Context>("should create an event with the shift id", (c) => {
      expect(lastEvent(c.board).assign).toEqual(c.shiftId);
    });
    it<Context>("should assign a supervisor for APP shifts and increment their supervised count", (c) => {
      const superId = lastEvent(c.board).super;
      expect(superId).toBeDefined();
      expect(c.board.shifts[superId!].supervised).toEqual(1);
    });
    it("should not advance the rotation pointer", () => {
      const board = makeBoard();
      BoardModule.signIn(board, {
        schedule: dummy.schedule[1],
        provider: dummy.providers[1],
      });
      const shiftId = board.zones.main.shifts[1]; // non-pointer shift
      AssignModule.toShift(board, {
        shiftId,
        zoneSlug: "main",
        mode: "ft",
        room: "1",
      });
      expect(board.zones.main.next).toEqual(0);
    });
    it.todo("should add patient arrival time to patient index");
  });

  describe("Assign to Zone", () => {
    beforeEach<Context>((c) => {
      c.board = makeBoard();
      // Sign in APP — they become next in rotation
      BoardModule.signIn(c.board, {
        schedule: dummy.schedule[1],
        provider: dummy.providers[1],
      });
      // Manually credit the pointer shift with enough patients to exhaust its bonus
      c.board.shifts[c.board.zones.main.shifts[0]].assigned = 1;
      const zone = c.board.zones.main;
      c.shiftId = zone.shifts[zone.next!]; // capture the shift that is currently up
      AssignModule.toZone(c.board, { zoneSlug: "main", mode: "ft", room: "1" });
    });
    it<Context>("should assign a patient to the shift at the next pointer", (c) => {
      expect(BoardModule.getShift(c.shiftId, c.board).assigned).toEqual(2);
    });
    it<Context>("should advance the next pointer after assignment", (c) => {
      expect(c.board.zones.main.next).toEqual(1);
    });
    it<Context>("should trigger skip status on APP shifts in triggerSkip zones", (c) => {
      BoardModule.joinZone(c.board, { shiftId: c.shiftId, zoneSlug: "ft" });
      AssignModule.toZone(c.board, { zoneSlug: "ft", mode: "ft", room: "4" });
      const shift = BoardModule.getShift(c.shiftId, c.board);
      expect(shift.status).toEqual("skip");
    });
  });

  describe("Reassign", () => {
    // Board helper: one doc (providers[0]) + one app (providers[1]) signed in,
    // then one patient assigned to the doc via toShift.
    // In a dual zone each new shift inserts at zone.next (starts at 0), so the
    // last shift to join lands at index 0: after doc then app, order is [app, doc].
    // Returns the board, the original assignment event id, and the two shift ids.
    const makeReassignBoard = () => {
      const board = makeBoard(); // doc signed in
      BoardModule.signIn(board, {
        schedule: dummy.schedule[1],
        provider: dummy.providers[1],
      }); // app
      // dual zone inserts at next=0 each time → [app, doc]
      const appId = board.zones.main.shifts[0];
      const docId = board.zones.main.shifts[1];
      AssignModule.toShift(board, {
        shiftId: docId,
        zoneSlug: "main",
        mode: "walkin",
        room: "5",
      });
      const originalEventId = board.timeline[0];
      return { board, docId, appId, originalEventId };
    };

    it("should add a note to the original event", () => {
      const { board, appId, originalEventId } = makeReassignBoard();
      AssignModule.reassign(board, {
        eventId: originalEventId,
        newShiftId: appId,
      });
      expect(board.events[originalEventId].note).toContain("Bown");
    });

    it("should create a new event", () => {
      const { board, appId, originalEventId } = makeReassignBoard();
      const timelineLengthBefore = board.timeline.length;
      AssignModule.reassign(board, {
        eventId: originalEventId,
        newShiftId: appId,
      });
      expect(board.timeline.length).toEqual(timelineLengthBefore + 1);
      expect(lastEvent(board).message).toContain("Reassigned");
    });

    it("should decrease assigned count for the original shift", () => {
      const { board, docId, appId, originalEventId } = makeReassignBoard();
      AssignModule.reassign(board, {
        eventId: originalEventId,
        newShiftId: appId,
      });
      expect(board.shifts[docId].assigned).toEqual(0);
    });

    it("should increase assigned count for the new shift", () => {
      const { board, appId, originalEventId } = makeReassignBoard();
      AssignModule.reassign(board, {
        eventId: originalEventId,
        newShiftId: appId,
      });
      expect(board.shifts[appId].assigned).toEqual(1);
    });

    it("DOC to DOC: should not change supervised counts", () => {
      const board = makeBoard();
      BoardModule.signIn(board, {
        schedule: dummy.schedule[2],
        provider: dummy.providers[2],
      }); // second doc
      // dual zone: [doc2, doc1]
      const doc2Id = board.zones.main.shifts[0];
      const doc1Id = board.zones.main.shifts[1];
      AssignModule.toShift(board, {
        shiftId: doc1Id,
        zoneSlug: "main",
        mode: "walkin",
        room: "1",
      });
      const eventId = board.timeline[0];
      AssignModule.reassign(board, { eventId, newShiftId: doc2Id });
      expect(board.shifts[doc1Id].supervised).toEqual(0);
      expect(board.shifts[doc2Id].supervised).toEqual(0);
      expect(lastEvent(board).super).toBeUndefined();
    });

    it("APP to APP: should keep the original supervisor and their supervised count unchanged", () => {
      const board = makeBoard(); // doc
      BoardModule.signIn(board, {
        schedule: dummy.schedule[1],
        provider: dummy.providers[1],
      }); // app1
      BoardModule.signIn(board, {
        schedule: dummy.schedule[5],
        provider: dummy.providers[3],
      }); // app2
      // dual zone inserts at next=0 each time → [app2, app1, doc]
      const app2Id = board.zones.main.shifts[0];
      const app1Id = board.zones.main.shifts[1];
      const docId = board.zones.main.shifts[2];
      AssignModule.toShift(board, {
        shiftId: app1Id,
        zoneSlug: "main",
        mode: "walkin",
        room: "1",
      });
      const originalEventId = board.timeline[0];
      const originalSuperId = board.events[originalEventId].super!;
      AssignModule.reassign(board, {
        eventId: originalEventId,
        newShiftId: app2Id,
      });
      // supervisor on the new event should be unchanged
      expect(lastEvent(board).super).toEqual(originalSuperId);
      // supervised count on the original supervisor should be unchanged
      expect(board.shifts[docId].supervised).toEqual(1);
    });

    it("APP to DOC: should decrement supervised count on the original supervisor", () => {
      const { board, docId, appId, originalEventId } = makeReassignBoard();
      // assign to app first so there is a supervisor
      AssignModule.toShift(board, {
        shiftId: appId,
        zoneSlug: "main",
        mode: "walkin",
        room: "2",
      });
      const appEventId = board.timeline[0];
      const supervisorId = board.events[appEventId].super!;
      const supervisedBefore = board.shifts[supervisorId].supervised;
      AssignModule.reassign(board, { eventId: appEventId, newShiftId: docId });
      expect(board.shifts[supervisorId].supervised).toEqual(
        supervisedBefore - 1,
      );
      expect(lastEvent(board).super).toBeUndefined();
    });

    it("DOC to APP: should set the original doc as supervisor and increment their supervised count", () => {
      const { board, docId, appId, originalEventId } = makeReassignBoard();
      const supervisedBefore = board.shifts[docId].supervised;
      AssignModule.reassign(board, {
        eventId: originalEventId,
        newShiftId: appId,
      });
      expect(lastEvent(board).super).toEqual(docId);
      expect(board.shifts[docId].supervised).toEqual(supervisedBefore + 1);
    });
  });

  describe("Change Room", () => {
    it("should update the room field on the original event without creating a new event", () => {
      const board = makeBoard();
      AssignModule.toShift(board, {
        shiftId: board.zones.main.shifts[0],
        zoneSlug: "main",
        mode: "walkin",
        room: "5",
      });
      const eventId = board.timeline[0];
      const timelineLengthBefore = board.timeline.length;
      AssignModule.changeRoom(board, { eventId, newRoom: "10" });
      expect(board.events[eventId].room).toEqual("10");
      expect(board.timeline.length).toEqual(timelineLengthBefore); // no new event
    });
  });
});
