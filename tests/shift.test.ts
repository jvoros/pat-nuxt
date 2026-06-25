import { describe, expect, it, expectTypeOf } from "vitest";
import type { Shift } from "../server/core/types.js";
import ShiftModule from "../server/core/shift.js";
import dummy from "./dummy.config.js";

const schedule = dummy.schedule[0];
const provider = dummy.providers[0];
const testShift = ShiftModule.make({ schedule, provider });

describe("Shift Controller", () => {
  describe("Make", () => {
    it("should make Shift objects from ScheduleItems and Providers", () => {
      expect(testShift).toBeDefined();
      expectTypeOf(testShift).toEqualTypeOf<Shift>();
    });
    it("should make Shifts with an id", () => {
      expect(testShift.id).toBeDefined();
    });
    it("should make Shifts with a shift name", () => {
      expect(testShift.name).toBeDefined();
    });
    it("should make Shifts with a provider first and last name", () => {
      expect(testShift.first).toBeDefined();
      expect(testShift.last).toBeDefined();
    });
  });

  describe("Add and Remove Patients", () => {
    it("should add and remove assigned patients", () => {
      ShiftModule.adjustCount({
        shift: testShift,
        type: "assigned",
        amount: 1,
      });
      expect(testShift.assigned).toEqual(1);
      ShiftModule.adjustCount({
        shift: testShift,
        type: "assigned",
        amount: -1,
      });
      expect(testShift.assigned).toEqual(0);
    });
    it("should add and remove supervised patients", () => {
      ShiftModule.adjustCount({
        shift: testShift,
        type: "supervised",
        amount: 1,
      });
      expect(testShift.supervised).toEqual(1);
      ShiftModule.adjustCount({
        shift: testShift,
        type: "supervised",
        amount: -1,
      });
      expect(testShift.supervised).toEqual(0);
    });
  });

  describe("Adjust Status", () => {
    it("should pause and unpause", () => {
      ShiftModule.changeStatus({ shift: testShift, status: "paused" });
      expect(testShift.status).toBe("paused");
      ShiftModule.changeStatus({ shift: testShift, status: "active" });
      expect(testShift.status).toBe("active");
    });
    it("should set and unset skip", () => {
      ShiftModule.changeStatus({ shift: testShift, status: "skip" });
      expect(testShift.status).toBe("skip");
      ShiftModule.changeStatus({ shift: testShift, status: "active" });
      expect(testShift.status).toBe("active");
    });
  });

  describe("Handle Bonus", () => {
    it("should have starting bonus", () => {
      expect(testShift.bonus).toEqual(2);
    });
    it("should not decrease bonus below 0", () => {
      ShiftModule.decrementBonus(testShift);
      expect(testShift.bonus).toEqual(1);
      ShiftModule.decrementBonus(testShift);
      ShiftModule.decrementBonus(testShift);
      ShiftModule.decrementBonus(testShift);
      expect(testShift.bonus).toEqual(0);
    });
  });
});
