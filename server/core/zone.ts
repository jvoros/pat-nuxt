import ShiftModule from "./shift.js";
import type {
  Zone,
  Shift,
  ZonePointer,
  ZoneVariant,
  ZoneMakeParams,
  IndexShift,
} from "./types.js";

// which zone types have which rotations
// key is pointer, value is zone types that have that pointer
const POINTERS_AND_ZONE_TYPES: Record<ZonePointer, ZoneVariant[]> = {
  next: ["rotation", "dual"],
  super: ["dual"],
};

const zoneRotatesPointer = (which: ZonePointer, zone: Zone): boolean => {
  return POINTERS_AND_ZONE_TYPES[which].includes(zone.type);
};

// MAKE
const make = (params: ZoneMakeParams): Zone => {
  return {
    ...params,
    triggerSkip: params.triggerSkip ?? false,
    next: null,
    super: null,
    shifts: [],
  };
};

// JOIN ZONE

const joinZone = ({ zone, shift }: { zone: Zone; shift: Shift }): void => {
  // Don't add more than once
  if (zone.shifts.includes(shift.id)) return;

  // Ensure zone.next is initialized
  zone.next = zone.next ?? 0;

  // Insert shift ID based on zone type
  switch (zone.type) {
    case "dual":
      zone.shifts.splice(zone.next, 0, shift.id);
      // If first physician shift, set super pointer
      if (shift.role === "physician" && zone.super === null) {
        zone.super = zone.next;
        break;
      }
      // If super already set, and past shift insert point, increment super
      if (zone.super !== null && zone.super >= zone.next) {
        zone.super++;
        break;
      }
      break;

    case "rotation":
      zone.shifts.splice(zone.next, 0, shift.id);
      break;

    case "simple":
      zone.shifts.unshift(shift.id);
      break;

    case "list":
      zone.shifts.push(shift.id);
      break;
  }
};

// LEAVE ZONE

const leaveZone = ({
  leaveShiftId,
  zone,
  shifts,
}: {
  leaveShiftId: Shift["id"];
  zone: Zone;
  shifts: IndexShift;
}): void => {
  const index = zone.shifts.findIndex((s) => s === leaveShiftId);
  // Shift not in zone
  if (index === -1) return;

  // Handle pointers
  const pointerKeys: ZonePointer[] = ["next", "super"];
  pointerKeys.forEach((key) => {
    if (!zoneRotatesPointer(key, zone)) return;

    // Check if the current shift is the pointer
    if (index === zone[key]) {
      movePointer({ zone, shifts, which: key, offset: 1 });
    }

    // If current shift is *still* pointer than it is last one left, need to null pointer
    if (index === zone[key]) {
      zone[key] = null;
    }

    // If leaving shift index is less than pointer, need to decrement pointer
    if (zone[key] !== null && index < zone[key]) {
      zone[key]--;
    }
  });

  // Remove shift
  zone.shifts.splice(index, 1);
};

// MOVE POINTERS

const movePointer = (params: {
  zone: Zone;
  shifts: IndexShift;
  which: ZonePointer;
  offset: number;
}): void => {
  // don't move pointer if no pointer to move
  if (!zoneRotatesPointer(params.which, params.zone)) {
    throw Error("zone does not rotate pointer");
  }

  const { zone, shifts, which } = params;
  const direction = params.offset < 0 ? -1 : 1;
  let steps = 0;

  while (Math.abs(steps) <= zone.shifts.length) {
    steps += direction;
    const nextIndex = getNextIndex({ zone, which, offset: steps });
    const nextShift = shifts[zone.shifts[nextIndex]!]!;
    if (which === "super" && nextShift.role !== "physician") continue;
    if (nextShift.status === "paused") continue;
    if (nextShift.status === "skip") {
      ShiftModule.changeStatus({ shift: nextShift, status: "active" });
      continue;
    }
    zone[which] = nextIndex;
    return;
  }
};

type getNextIndexParams = {
  zone: Zone;
  which: ZonePointer;
  offset: number;
};

const getNextIndex = (params: getNextIndexParams): number => {
  const { zone, which, offset } = params;
  const current = zone[which] ?? 0;
  const arrayLength = zone.shifts.length;
  if (arrayLength === 0) return -1;
  return (current + offset + arrayLength) % arrayLength;
};

// PROVIDE SUPER

const provideSuper = (params: {
  zone: Zone;
  shifts: IndexShift;
}): Shift["id"] => {
  const { zone, shifts } = params;
  if (zone.super === null) {
    throw Error(`No zone.super set for zone: ${zone.slug}`);
  }
  const supervisorId = zone.shifts[zone.super]!;
  movePointer({ zone, shifts, which: "super", offset: 1 });
  return supervisorId;
};

export default {
  make,
  joinZone,
  leaveZone,
  movePointer,
  provideSuper,
};
