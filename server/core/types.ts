// SITE

export type SiteConfig = {
  name: string;
  slug: string;
  zones: Record<string, Zone>;
  zoneOrder: Zone["slug"][];
  schedule: ScheduleItem[];
  providers: Provider[];
  rooms: string[];
};

// BOARD

export type Board = {
  slug: string; // site slug
  date: number; // datetime
  undo?: number; // db ID added by database to track back to previous state
  zoneOrder: Zone["slug"][];
  timeline: BoardEvent["id"][];
  zones: IndexZone;
  shifts: IndexShift;
  events: IndexBoardEvent;
  dev?: boolean; // set to true if dev environment
};

export type IndexShift = Record<Shift["id"], Shift>;
export type IndexZone = Record<Zone["slug"], Zone>;
export type IndexBoardEvent = Record<BoardEvent["id"], BoardEvent>;

// ZONE

export type Zone = {
  slug: string;
  name: string;
  type: ZoneVariant;
  superZone?: Zone["slug"]; // zone that provides supervisor
  pitZone?: boolean;
  triggerSkip?: boolean;
  next: number | null; // pointer
  super: number | null; // pointer
  shifts: Shift["id"][];
};

export type ZoneMakeParams = {
  slug: Zone["slug"];
  name: string;
  type: ZoneVariant;
  superZone?: Zone["slug"];
  triggerSkip?: boolean;
};

// - list: just a list, new shifts added to end
// - simple: index 0 always up next
// - rotation: rotation
// - super: rotation, but for a supervisor only
// - dual: rotates assignment and super from same list
export type ZoneVariant = "list" | "simple" | "rotation" | "dual";

export type ZonePointer = "next" | "super";

// SHIFT

export type ShiftStatus = "skip" | "paused" | "active";

export type Shift = {
  id: string;
  name: string;
  last: Provider["last"];
  first: Provider["first"];
  role: Provider["role"];
  bonus: number;
  status: ShiftStatus;
  assigned: number;
  supervised: number;
  triaged: number;
};

// PROVIDER

export type ProviderRoles = "physician" | "app" | "app-independent";

export type Provider = {
  last: string;
  first: string;
  role: ProviderRoles;
};

// SCHEDULE

export type ScheduleItem = {
  name: string;
  bonus: number;
  joins: Zone["slug"];
  reset?: boolean;
};

// PATIENT

export type PatientModes = "walkin" | "ambo" | "police" | "ft";
export type PatientCounts = "assigned" | "supervised" | "triaged";

export type Patient = {
  id: string;
  room: string;
  time: number; // datetime
  mode: PatientModes;
};

// EVENT

export type BoardEvent = EventMakeParams & {
  id: string;
  time: number;
};

export type EventMakeParams = {
  message?: string;
  note?: string;
  mode?: PatientModes;
  room?: string;
  assign?: Shift["id"];
  super?: Shift["id"];
};

// LOGS

export type LogItem = {
  date: number;
  site: string;
  shift: string;
  provider: string;
  assigned: number;
  supervised: number;
  triaged: number;
  bounty?: number;
};
