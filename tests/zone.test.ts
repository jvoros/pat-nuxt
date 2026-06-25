import { describe, expect, it, expectTypeOf, beforeEach } from "vitest";
import type { Zone, Shift, IndexShift } from "../server/core/types.js";
import ZoneModule from "../server/core/zone.js";
import ShiftModule from "../server/core/shift.js";
import dummy from "./dummy.config.js";

// Shifts not under test — safe to share across suites
const docShift1 = ShiftModule.make({ provider: dummy.providers[0], schedule: dummy.schedule[0] });
const docShift2 = ShiftModule.make({ provider: dummy.providers[2], schedule: dummy.schedule[2] });
const appShift1 = ShiftModule.make({ provider: dummy.providers[1], schedule: dummy.schedule[1] });

// Builds a fresh dual zone with three shifts already joined:
//   index: [doc2, app1, doc1]  next: 0  super: 2 (doc1)
const getTestZone = () => {
  const zone = ZoneModule.make(dummy.zones.main);
  // Spread to clone — preserves IDs but avoids shared mutation between tests
  const app1 = { ...appShift1 };
  const doc1 = { ...docShift1 };
  const doc2 = { ...docShift2 };
  ZoneModule.joinZone({ zone, shift: doc1 });
  ZoneModule.joinZone({ zone, shift: app1 });
  ZoneModule.joinZone({ zone, shift: doc2 });
  const shifts: IndexShift = {
    [app1.id]: app1,
    [doc1.id]: doc1,
    [doc2.id]: doc2,
  };
  return { testZone: zone, testShifts: shifts };
};

declare module "vitest" {
  interface TestContext {
    zone?: Zone;
    superId?: Shift["id"];
    shifts: IndexShift;
  }
}

describe("Zone Controller", () => {
  describe("Make Zone", () => {
    it("should make Zone objects from ZoneMakeParams", () => {
      const zone = ZoneModule.make(dummy.zones.main);
      expectTypeOf(zone).toEqualTypeOf<Zone>();
    });
    it("should carry optional config options", () => {
      const zonePIT = ZoneModule.make(dummy.zones.ft);
      expect(zonePIT.pitZone).toBeTruthy();
    });
  });

  describe("Join Zones", () => {
    it("should only add shifts once", () => {
      const zone = ZoneModule.make(dummy.zones.off);
      ZoneModule.joinZone({ zone, shift: docShift1 });
      ZoneModule.joinZone({ zone, shift: docShift1 });
      expect(zone.shifts.length).toEqual(1);
    });
    it("List Zone: should add shift at end", () => {
      const zone = ZoneModule.make(dummy.zones.off);
      ZoneModule.joinZone({ zone, shift: docShift1 });
      ZoneModule.joinZone({ zone, shift: docShift2 });
      expect(zone.shifts[1]).toEqual(docShift2.id);
    });
    it("Simple Zone: should add at start", () => {
      const zone = ZoneModule.make(dummy.zones.ft);
      ZoneModule.joinZone({ zone, shift: docShift1 });
      ZoneModule.joinZone({ zone, shift: docShift2 });
      expect(zone.shifts[0]).toEqual(docShift2.id);
    });
    it("Rotation Zone: should add at next pointer", () => {
      const zone = ZoneModule.make(dummy.zones.main);
      ZoneModule.joinZone({ zone, shift: docShift1 });
      ZoneModule.joinZone({ zone, shift: docShift2 });
      zone.next = 1; // manually advance pointer
      ZoneModule.joinZone({ zone, shift: appShift1 });
      expect(zone.shifts[1]).toEqual(appShift1.id);
      expect(zone.shifts.length).toEqual(3);
    });
    it("Dual Zone: should add at next pointer", () => {
      const zone = ZoneModule.make(dummy.zones.main);
      ZoneModule.joinZone({ zone, shift: docShift1 });
      ZoneModule.joinZone({ zone, shift: appShift1 });
      zone.next = 1; // manually advance pointer
      ZoneModule.joinZone({ zone, shift: docShift2 });
      expect(zone.shifts[1]).toEqual(docShift2.id);
    });
    it("Dual Zone: should only set super when first physician joins", () => {
      const zone = ZoneModule.make(dummy.zones.main);
      ZoneModule.joinZone({ zone, shift: appShift1 });
      expect(zone.super).toBeNull();
      ZoneModule.joinZone({ zone, shift: docShift1 });
      expect(zone.super).toEqual(0);
    });
    it("Dual Zone: should keep super on same shift when a new shift is inserted before it", () => {
      const zone = ZoneModule.make(dummy.zones.main);
      ZoneModule.joinZone({ zone, shift: docShift1 });
      ZoneModule.joinZone({ zone, shift: appShift1 });
      ZoneModule.joinZone({ zone, shift: docShift2 });
      expect(zone.super).toEqual(2);
    });
  });

  describe("Leave Zones", () => {
    it("should remove shift from zone", () => {
      const zone = ZoneModule.make(dummy.zones.ft);
      const shifts = { [docShift1.id]: docShift1 };
      ZoneModule.joinZone({ zone, shift: docShift1 });
      ZoneModule.leaveZone({ zone, leaveShiftId: docShift1.id, shifts });
      expect(zone.shifts.length).toEqual(0);
    });
    it("should not change which shift is pointed to when the leaving shift is before the pointer", () => {
      const { testZone, testShifts } = getTestZone();
      testZone.next = 2; // manually advance pointer
      ZoneModule.leaveZone({ zone: testZone, leaveShiftId: docShift2.id, shifts: testShifts });
      expect(testZone.shifts[testZone.next]).toEqual(docShift1.id);
    });
    it("should not change which shift is pointed to when the leaving shift is after the pointer", () => {
      const { testZone, testShifts } = getTestZone();
      ZoneModule.leaveZone({ zone: testZone, leaveShiftId: docShift1.id, shifts: testShifts });
      expect(testZone.shifts[testZone.next!]).toEqual(docShift2.id);
    });
    it("should advance next pointer if the leaving shift is currently next", () => {
      const { testZone, testShifts } = getTestZone();
      testZone.next = 1;
      ZoneModule.leaveZone({ zone: testZone, leaveShiftId: appShift1.id, shifts: testShifts });
      expect(testZone.shifts[testZone.next]).toEqual(docShift1.id);
    });
    it("should advance super pointer if the leaving shift is currently super", () => {
      const { testZone, testShifts } = getTestZone();
      ZoneModule.leaveZone({ zone: testZone, leaveShiftId: docShift1.id, shifts: testShifts });
      expect(testZone.shifts[testZone.super!]).toEqual(docShift2.id);
    });
    it("should set next to null if the leaving shift is the last shift", () => {
      const zone = ZoneModule.make(dummy.zones.main);
      ZoneModule.joinZone({ zone, shift: appShift1 });
      const shifts = { [appShift1.id]: appShift1 };
      ZoneModule.leaveZone({ zone, leaveShiftId: appShift1.id, shifts });
      expect(zone.shifts[zone.next!]).toBeFalsy();
    });
    it("should set super to null if the leaving shift is the last physician", () => {
      const zone = ZoneModule.make(dummy.zones.main);
      ZoneModule.joinZone({ zone, shift: docShift1 });
      ZoneModule.joinZone({ zone, shift: appShift1 });
      const shifts = { [appShift1.id]: appShift1, [docShift1.id]: docShift1 };
      ZoneModule.leaveZone({ zone, leaveShiftId: docShift1.id, shifts });
      expect(zone.shifts[zone.super!]).toBeFalsy();
    });
  });

  describe("Move Pointer", () => {
    it.todo("should only move pointer for zones that have that kind of pointer");
    it("should move pointer forward and backward, looping over ends", () => {
      const { testZone, testShifts } = getTestZone();
      ZoneModule.movePointer({ zone: testZone, shifts: testShifts, which: "next", offset: 1 });
      expect(testZone.next).toEqual(1);
      ZoneModule.movePointer({ zone: testZone, shifts: testShifts, which: "next", offset: -1 });
      expect(testZone.next).toEqual(0);
      ZoneModule.movePointer({ zone: testZone, shifts: testShifts, which: "next", offset: -1 });
      expect(testZone.next).toEqual(2);
      ZoneModule.movePointer({ zone: testZone, shifts: testShifts, which: "next", offset: 1 });
      expect(testZone.next).toEqual(0);
    });
    it("should handle skip shifts and toggle them back to active", () => {
      const { testZone, testShifts } = getTestZone();
      testShifts[appShift1.id].status = "skip";
      ZoneModule.movePointer({ zone: testZone, shifts: testShifts, which: "next", offset: 1 });
      expect(testZone.next).toEqual(2);
      expect(testShifts[appShift1.id].status).toEqual("active");
    });
    it("should skip over paused shifts without changing their status", () => {
      const { testZone, testShifts } = getTestZone();
      testShifts[appShift1.id].status = "paused";
      ZoneModule.movePointer({ zone: testZone, shifts: testShifts, which: "next", offset: 1 });
      expect(testZone.next).toEqual(2);
      expect(testShifts[appShift1.id].status).toEqual("paused");
    });
    it("should skip APPs when moving the super pointer", () => {
      const { testZone, testShifts } = getTestZone();
      testZone.super = 0;
      ZoneModule.movePointer({ zone: testZone, shifts: testShifts, which: "super", offset: 1 });
      expect(testZone.super).toEqual(2);
    });
  });

  describe("Provide Super", () => {
    beforeEach((c) => {
      const { testZone, testShifts } = getTestZone();
      const superId = ZoneModule.provideSuper({ zone: testZone, shifts: testShifts });
      c.zone = testZone;
      c.superId = superId;
      c.shifts = testShifts;
    });
    it("should yield the current super shift id", (c) => {
      expect(c.superId).toEqual(docShift1.id);
    });
    it("should advance the super pointer after providing", (c) => {
      // super started at index 2 (docShift1), after advancing it wraps to the next physician (docShift2 at index 0)
      expect(c.zone!.super).toEqual(0);
    });
  });
});
