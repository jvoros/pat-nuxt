import { describe, expect, it } from "vitest";
import Event from "../server/core/event.js";

const ev = Event.make({
  message: "test event message",
});

describe("Event Controller", () => {
  it("should make Events", () => {
    expect(ev.id).toBeDefined();
    expect(ev.time).toBeDefined();
    expect(ev.message).toBeDefined();
  });
  it("should add Reassign info", () => {
    Event.addReassign({ priorEvent: ev, newProvider: "Julius Irving" });
    expect(ev.note!.includes("Julius")).toBeTruthy();
  });
  it("should change rooms", () => {
    Event.changeRoom({ event: ev, newRoom: "new room" });
    expect(ev.room).toEqual("new room");
  });
  it("should update note", () => {
    Event.updateNote({ event: ev, note: "new note" });
    expect(ev.note).toEqual("new note");
  });
});
