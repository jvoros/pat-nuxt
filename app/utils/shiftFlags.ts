import type { Shift, Zone } from "../../server/core/types";

export type ShiftFlags = {
  isNext: boolean;
  isSuper: boolean;
  isRotating: boolean;
  isPaused: boolean;
  isSkipped: boolean;
  isOff: boolean;
};

export const getShiftFlags = (
  shiftId: string,
  zone: Zone,
  shift: Shift,
): ShiftFlags => {
  const isRotating = zone.type === "rotation" || zone.type === "dual";
  const isNext =
    (isRotating && zone.shifts[zone.next ?? -1] === shiftId) ||
    (zone.type === "simple" && zone.shifts[0] === shift.id);
  const isSuper =
    zone.type === "dual" && zone.shifts[zone.super ?? -1] === shiftId;
  const isPaused = isRotating && shift.status === "paused";
  const isSkipped = isRotating && shift.status === "skip";
  const isOff = zone.slug === "off";

  return { isNext, isSuper, isRotating, isPaused, isSkipped, isOff };
};
