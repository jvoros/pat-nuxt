import uid from "./uid.js";
import type { BoardEvent, EventMakeParams } from "./types.js";

const make = (options: EventMakeParams): BoardEvent => {
  return { id: uid(), time: Date.now(), ...options };
};

const addReassign = (params: {
  priorEvent: BoardEvent;
  newProvider: string;
}): void => {
  const { priorEvent, newProvider } = params;
  priorEvent.note = `Reassigned to: ${newProvider}`;
};

const changeRoom = (params: { event: BoardEvent; newRoom: string }): void => {
  const { event, newRoom } = params;
  event.room = newRoom;
};

export default {
  make,
  addReassign,
  changeRoom,
};
