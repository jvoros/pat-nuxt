import ZoneModule from "./zone.js";
import ShiftModule from "./shift.js";
import EventModule from "./event.js";
import type {
  SiteConfig,
  Board,
  Zone,
  Shift,
  Provider,
  ScheduleItem,
  EventMakeParams,
  LogItem,
  ZonePointer,
  IndexZone,
  ZoneMakeParams,
} from "./types.js";

const EVENT_LIMIT = 25;

// missing from original core
//   changePosition,

// MAKE

const make = (params: { slug: string; siteConfig: SiteConfig }): Board => {
  const { slug, siteConfig } = params;

  const board: Board = {
    slug: slug,
    date: Date.now(),
    zoneOrder: [],
    timeline: [],
    zones: {},
    shifts: {},
    events: {},
  };
  const zoneConfig = siteConfig.zoneOrder.map(
    (slug: string) => siteConfig.zones[slug],
  );
  zoneConfig.forEach((z) => {
    if (!z) return;
    const zone = ZoneModule.make(z);
    board.zoneOrder.push(zone.slug);
    board.zones[zone.slug] = zone;
  });

  return board;
};

// RESET

const reset = (board: Board): Board => {
  const oldDate = board.date;

  const newBoard: Board = {
    slug: board.slug,
    date: Date.now(),
    zoneOrder: [...board.zoneOrder],
    timeline: [],
    zones: {},
    shifts: {},
    events: {},
  };

  // Rebuild each zone in its empty initial state from the existing zone definitions
  board.zoneOrder.forEach((slug) => {
    const zone = board.zones[slug]!;
    const params: ZoneMakeParams = {
      slug: zone.slug,
      name: zone.name,
      type: zone.type,
      superZone: zone.superZone,
      triggerSkip: zone.triggerSkip,
      pitZone: zone.pitZone,
    };
    newBoard.zones[slug] = ZoneModule.make(params);
  });

  // event
  const eventParams = {
    message: "Board reset",
    note: `${oldDate}`, // keep previous date for undo; need to delete logs if undoing reset
  };
  addEvent(newBoard, eventParams);

  return newBoard;
};

// SIGN IN

const signIn = (
  board: Board,
  params: { provider: Provider; schedule: ScheduleItem },
): void => {
  const { provider, schedule } = params;
  const zone = getZone(schedule.joins, board);
  const shift = ShiftModule.make({ schedule, provider });
  board.shifts[shift.id] = shift;
  ZoneModule.joinZone({ shift, zone });
  const eventParams = {
    message: `${shift.first} ${shift.last} joined ${zone.name}`,
  };
  addEvent(board, eventParams);
};

// SIGN OUT

const signOut = (board: Board, params: { shiftId: Shift["id"] }): void => {
  const { shiftId } = params;
  const shift = getShift(shiftId, board);
  const offZone = getZone("off", board);

  // leave all zones
  const inZones = zonesWithShift(shiftId, board.zones);
  inZones.forEach((slug) => {
    ZoneModule.leaveZone({
      leaveShiftId: shiftId,
      zone: getZone(slug, board),
      shifts: board.shifts,
    });
  });

  // join off zone
  ZoneModule.joinZone({ zone: offZone, shift });

  // event
  const eventParams = {
    message: `${shift.first} ${shift.last} signed out`,
  };
  addEvent(board, eventParams);
};

// JOIN

const joinZone = (
  board: Board,
  params: { shiftId: Shift["id"]; zoneSlug: Zone["slug"] },
): void => {
  const { shiftId, zoneSlug } = params;
  const zone = getZone(zoneSlug, board);
  const shift = getShift(shiftId, board);

  // don't add more than once
  if (zone.shifts.includes(shiftId)) return;
  ZoneModule.joinZone({ zone, shift });

  // event
  const eventMessage = `${shift.first} ${shift.last} joined ${zone.name}`;
  addEventMessage(board, eventMessage);
};

// LEAVE

const leaveZone = (
  board: Board,
  params: { shiftId: Shift["id"]; zoneSlug: Zone["slug"] },
): void => {
  const { shiftId, zoneSlug } = params;

  // error if leaving last zone
  const inZones = zonesWithShift(shiftId, board.zones);
  if (inZones.length === 1 && inZones[0] === zoneSlug) {
    throw Error("Cannot leave last zone with shift");
  }

  // leave zone
  const leaveZone = getZone(zoneSlug, board);
  ZoneModule.leaveZone({
    leaveShiftId: shiftId,
    zone: leaveZone,
    shifts: board.shifts,
  });

  // event
  const shift = getShift(shiftId, board);
  const eventMessage = `${shift.first} ${shift.last} left ${leaveZone.name}`;
  addEventMessage(board, eventMessage);
};

// SWITCH

const switchZone = (
  board: Board,
  params: {
    shiftId: Shift["id"];
    leaveZoneSlug: Zone["slug"];
    joinZoneSlug: Zone["slug"];
  },
): void => {
  const { shiftId, leaveZoneSlug, joinZoneSlug } = params;
  const shift = getShift(shiftId, board);
  const joiningZone = getZone(joinZoneSlug, board);
  const leavingZone = getZone(leaveZoneSlug, board);

  ZoneModule.joinZone({ zone: joiningZone, shift: shift });
  ZoneModule.leaveZone({
    leaveShiftId: shiftId,
    zone: leavingZone,
    shifts: board.shifts,
  });

  // event
  const eventMessage = `${shift.first} ${shift.last} switched from ${leavingZone.name} to ${joiningZone.name}`;
  addEventMessage(board, eventMessage);
};

// DELETE

const deleteShift = (board: Board, params: { shiftId: Shift["id"] }): void => {
  const { shiftId } = params;
  const shift = getShift(shiftId, board);

  if (shift.assigned > 0 || shift.supervised > 0) {
    throw Error("Cannot delete shift with patients assigned");
  }

  // leave all zones
  const inZones = zonesWithShift(shiftId, board.zones);
  inZones.forEach((slug) => {
    ZoneModule.leaveZone({
      leaveShiftId: shiftId,
      zone: getZone(slug, board),
      shifts: board.shifts,
    });
  });
  // delete from index
  delete board.shifts[shiftId];

  // event
  const eventMessage = `Deleted ${shift.first} ${shift.last} (${shift.name}) from board`;
  addEventMessage(board, eventMessage);
};

// ADJUST ROTATION

const adjustRotation = (
  board: Board,
  params: {
    zoneSlug: Zone["slug"];
    which: ZonePointer;
    offset: number;
  },
): void => {
  const { zoneSlug, which, offset } = params;
  const zone = getZone(zoneSlug, board);
  if (zone[which] === null) {
    throw Error(`No zone.${which} set for zone: ${zone.slug}`);
  }

  ZoneModule.movePointer({ zone, shifts: board.shifts, which, offset });

  // event
  const shiftId = zone.shifts[zone[which]!];
  if (!shiftId)
    throw Error(`No shift at pointer ${which} for zone ${zone.slug}`);
  const shift = getShift(shiftId, board);
  const superFlag = which === "super" ? "supervisor" : "";
  const dirFlag = offset > 0 ? "forward" : "back";
  const eventMessage = `Moved ${zone.name} ${superFlag} ${dirFlag} to ${shift.first} ${shift.last}`;
  addEventMessage(board, eventMessage);
};

// PAUSE

const togglePause = (board: Board, params: { shiftId: Shift["id"] }): void => {
  const { shiftId } = params;
  const shift = getShift(shiftId, board);
  shift.status = shift.status === "paused" ? "active" : "paused";
  const eventMessage = `${shift.status === "paused" ? "Paused" : "Unpaused"} ${shift.first} ${
    shift.last
  }`;
  addEventMessage(board, eventMessage);
};

// TRIAGE

const addTriage = (board: Board, params: { shiftId: Shift["id"] }): void => {
  const { shiftId } = params;
  const shift = getShift(shiftId, board);
  ShiftModule.adjustCount({ shift: shift, amount: 1, type: "triaged" });
  const eventMessage = `${shift.first} ${shift.last} triaged a patient.`;
  addEventMessage(board, eventMessage);
};

// LOGS

const buildLogs = (site: string, board: Board): LogItem[] => {
  const logs = [];
  for (const shiftId in board.shifts) {
    const shift = board.shifts[shiftId];
    if (!shift) continue;
    const log: LogItem = {
      date: board.date,
      site,
      shift: shift.name,
      provider: `${shift.first} ${shift.last}`,
      assigned: shift.assigned,
      supervised: shift.supervised,
      triaged: shift.triaged,
    };
    logs.push(log);
  }
  return logs;
};

// HELPERS

const addEvent = (board: Board, eventParams: EventMakeParams): void => {
  const event = EventModule.make(eventParams);
  board.events[event.id] = event;
  board.timeline = [event.id, ...board.timeline.slice(0, EVENT_LIMIT - 1)];
  // filter events to just those on timeline
  for (const id in board.events) {
    if (!board.timeline.includes(id)) {
      delete board.events[id];
    }
  }
};

const addEventMessage = (board: Board, eventMessage: string): void => {
  const eventParams = { message: eventMessage };
  addEvent(board, eventParams);
};

const getShift = (id: Shift["id"], board: Board): Shift => board.shifts[id]!;

const getZone = (slug: Zone["slug"], board: Board): Zone => board.zones[slug]!;

const zonesWithShift = (id: Shift["id"], zones: IndexZone): Zone["slug"][] =>
  Object.keys(zones).filter((slug) => zones[slug]?.shifts.includes(id));

// EXPORT

export default {
  make,
  reset,
  buildLogs,
  signIn,
  signOut,
  joinZone,
  leaveZone,
  switchZone,
  deleteShift,
  adjustRotation,
  togglePause,
  addTriage,
  //utils
  addEvent,
  getShift,
  getZone,
};
