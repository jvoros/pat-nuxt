import uid from "./uid.js";
import type {
  Shift,
  Provider,
  ScheduleItem,
  ShiftStatus,
  PatientCounts,
} from "./types.js";

type shiftMakeParams = { schedule: ScheduleItem; provider: Provider };

const make = (params: shiftMakeParams): Shift => {
  return {
    id: uid(),
    name: params.schedule.name,
    bonus: params.schedule.bonus,
    status: "active",
    assigned: 0,
    supervised: 0,
    triaged: 0,
    last: params.provider.last,
    first: params.provider.first,
    role: params.provider.role,
  };
};

const adjustCount = (params: {
  shift: Shift;
  amount: number;
  type: PatientCounts;
}): void => {
  const { shift, type, amount } = params;
  shift[type] = Math.max(0, shift[type] + amount);
  return;
};

const changeStatus = (params: { shift: Shift; status: ShiftStatus }): void => {
  params.shift.status = params.status;
};

const decrementBonus = (shift: Shift): void => {
  shift.bonus = Math.max(shift.bonus - 1, 0);
};

export default {
  make,
  adjustCount,
  changeStatus,
  decrementBonus,
};
