import BoardModule from "./board.js";
import ZoneModule from "./zone.js";
import ShiftModule from "./shift.js";
import EventModule from "./event.js";
import type { Board, Zone, Shift, PatientModes, BoardEvent } from "./types.js";

const ROLES_REQUIRING_SUPERVISOR = ["app"];
const ROLES_TRIGGERING_SKIP = ["app"];
const ZONES_WITH_POINTER = ["dual", "rotation"];

const supervisorRequired = (shift: Shift): boolean =>
  ROLES_REQUIRING_SUPERVISOR.includes(shift.role);

const providerTriggersSkip = (shift: Shift): boolean =>
  ROLES_TRIGGERING_SKIP.includes(shift.role);

const hasPointer = (zone: Zone): boolean =>
  ZONES_WITH_POINTER.includes(zone.type);

// ASSIGN
const assign = (
  board: Board,
  params: {
    shiftId: Shift["id"];
    zoneSlug: Zone["slug"];
    mode: PatientModes;
    room: string;
  },
): void => {
  const { shiftId, zoneSlug, mode, room } = params;
  const shift = BoardModule.getShift(shiftId, board);
  const zone = BoardModule.getZone(zoneSlug, board);
  let superId = null;

  // assign patient
  ShiftModule.adjustCount({ shift, type: "assigned", amount: 1 });

  // assign supervisor if needed
  if (supervisorRequired(shift)) {
    if (!zone.superZone) {
      throw Error(`No superZone set for ${zone.slug}`);
    }
    const superZone = BoardModule.getZone(zone.superZone, board);
    // provideSuper advances super rotation
    superId = ZoneModule.provideSuper({
      zone: superZone,
      shifts: board.shifts,
    });
    ShiftModule.adjustCount({
      shift: board.shifts[superId]!,
      type: "supervised",
      amount: 1,
    });
  }

  // event
  const eventParams = {
    message: `Room ${room} assigned to ${shift.first} ${shift.last}`,
    mode,
    room,
    assign: shiftId,
    ...(superId && { super: superId }),
  };
  BoardModule.addEvent(board, eventParams);
};

// TO SHIFT
const toShift = (
  board: Board,
  params: {
    shiftId: Shift["id"];
    zoneSlug: Zone["slug"];
    mode: PatientModes;
    room: string;
  },
): void => {
  assign(board, params);
};

// TO ZONE
const toZone = (
  board: Board,
  params: {
    zoneSlug: Zone["slug"];
    mode: PatientModes;
    room: string;
  },
): void => {
  const zone = BoardModule.getZone(params.zoneSlug, board);
  if (zone.next === null) {
    throw Error(`No zone.next set for ${zone.slug}`);
  }
  const shiftId = zone.shifts[zone.next]!;
  const shift = BoardModule.getShift(shiftId, board);

  assign(board, { ...params, shiftId });

  // trigger skip if needed for zone
  if (zone.triggerSkip && providerTriggersSkip(shift)) {
    ShiftModule.changeStatus({ shift, status: "skip" });
  }

  if (hasPointer(zone) && shift.assigned > shift.bonus) {
    ZoneModule.movePointer({
      zone,
      shifts: board.shifts,
      which: "next",
      offset: 1,
    });
  }
};

// REASSIGN

const reassign = (
  board: Board,
  params: {
    eventId: BoardEvent["id"];
    newShiftId: Shift["id"];
  },
): void => {
  const { eventId, newShiftId } = params;
  const event = board.events[eventId];
  if (!event) throw Error(`No event found for id: ${eventId}`);
  if (event.assign === undefined) {
    throw Error(`No event.assign set for event: ${event.id}`);
  }
  const oldShift = BoardModule.getShift(event.assign, board);
  const newShift = BoardModule.getShift(newShiftId, board);
  let newSuperId: string | null = event.super ?? null; // let new super equal old super, change as needed

  EventModule.addReassign({
    priorEvent: event,
    newProvider: `${newShift.first} ${newShift.last}`,
  });
  ShiftModule.adjustCount({ shift: oldShift, amount: -1, type: "assigned" });
  ShiftModule.adjustCount({ shift: newShift, amount: 1, type: "assigned" });

  // handle supervisor
  // if APP to APP, or DOC to DOC no change in supervisor
  // app to doc
  if (supervisorRequired(oldShift) && !supervisorRequired(newShift)) {
    const oldSuper = BoardModule.getShift(event.super!, board);

    ShiftModule.adjustCount({
      shift: oldSuper,
      amount: -1,
      type: "supervised",
    });
    newSuperId = null;
  }
  // doc to app
  if (!supervisorRequired(oldShift) && supervisorRequired(newShift)) {
    ShiftModule.adjustCount({ shift: oldShift, amount: 1, type: "supervised" });
    newSuperId = oldShift.id;
  }

  // event
  const eventParams = {
    message: `Reassigned to ${newShift.first} ${newShift.last}`,
    mode: event.mode,
    room: event.room,
    assign: newShiftId,
    ...(newSuperId && { super: newSuperId }),
  };
  BoardModule.addEvent(board, eventParams);
};

const changeRoom = (
  board: Board,
  params: { eventId: BoardEvent["id"]; newRoom: string },
): void => {
  const { eventId, newRoom } = params;
  const event = board.events[eventId];
  if (!event) throw Error(`No event found for id: ${eventId}`);
  EventModule.changeRoom({ event, newRoom });
};

export default {
  toShift,
  toZone,
  reassign,
  changeRoom,
};
