import { describe, it, expect, beforeEach } from "bun:test";
import { createSchedule } from "../builderSchedule";
import { FakeClock } from "./helpers/FakeClock";
import { buildOnceEvent, buildOpenCloseEvent, buildRepeatHourEvent } from "./helpers/builders";
import { dateAt } from "./helpers/dateAt";
import { makeCounter } from "./helpers/counter";

describe("Scheduler integration", () => {
    let clock: FakeClock;
    let scheduler: ReturnType<typeof createSchedule>;

    beforeEach(() => {
        clock = new FakeClock(dateAt(2025, 3, 15, 9, 0, 0));
        scheduler = createSchedule({ clock, timer: clock });
    });

    it("addService(null) returns null and schedules nothing", () => {
        expect(scheduler.addService(null)).toBeNull();
        expect(scheduler.listEvents()).toEqual([]);
        expect(clock.pendingCount()).toBe(0);
    });

    it("addService assigns auto-incrementing ids starting at 1", () => {
        const a = scheduler.addService(buildOnceEvent({ hh: 10, mm: 0, ss: 0 }, () => {}));
        const b = scheduler.addService(buildOnceEvent({ hh: 11, mm: 0, ss: 0 }, () => {}));
        const c = scheduler.addService(buildOnceEvent({ hh: 12, mm: 0, ss: 0 }, () => {}));
        expect(a!.id).toBe(1);
        expect(b!.id).toBe(2);
        expect(c!.id).toBe(3);
    });

    it("listEvents returns active events with their ids", () => {
        scheduler.addService(buildOnceEvent({ hh: 10, mm: 0, ss: 0 }, () => {}));
        scheduler.addService(buildOnceEvent({ hh: 11, mm: 0, ss: 0 }, () => {}));
        const listed = scheduler.listEvents();
        expect(listed.length).toBe(2);
        const allIds = listed.flatMap(e => e.ids);
        expect(allIds).toContain(1);
        expect(allIds).toContain(2);
    });

    it("listEvents is empty after a ONCE event fires", () => {
        scheduler.addService(buildOnceEvent({ hh: 10, mm: 0, ss: 0 }, () => {}));
        clock.advance(3_600_000);
        expect(scheduler.listEvents()).toEqual([]);
    });

    it("removeService removes only the targeted event", () => {
        const a = scheduler.addService(buildOnceEvent({ hh: 10, mm: 0, ss: 0 }, () => {}));
        const b = scheduler.addService(buildOnceEvent({ hh: 11, mm: 0, ss: 0 }, () => {}));
        scheduler.removeService(a!.id);
        const allIds = scheduler.listEvents().flatMap(e => e.ids);
        expect(allIds).not.toContain(a!.id);
        expect(allIds).toContain(b!.id);
    });

    it("removeService clears the timer when the last event in a slot is removed", () => {
        const a = scheduler.addService(buildOnceEvent({ hh: 10, mm: 0, ss: 0 }, () => {}));
        expect(clock.pendingCount()).toBe(1);
        scheduler.removeService(a!.id);
        expect(clock.pendingCount()).toBe(0);
    });

    it("gracefulShutdown clears all timers and empties the schedule", () => {
        scheduler.addService(buildOnceEvent({ hh: 10, mm: 0, ss: 0 }, () => {}));
        scheduler.addService(buildRepeatHourEvent([{ hh: 11, mm: 0, ss: 0 }], () => {}));
        scheduler.gracefulShutdown();
        expect(scheduler.listEvents()).toEqual([]);
        expect(clock.pendingCount()).toBe(0);
    });

    it("two schedulers with separate clocks are fully isolated", () => {
        const clockA = new FakeClock(dateAt(2025, 3, 15, 9, 0, 0));
        const clockB = new FakeClock(dateAt(2025, 3, 15, 9, 0, 0));
        const schedA = createSchedule({ clock: clockA, timer: clockA });
        const schedB = createSchedule({ clock: clockB, timer: clockB });

        const a = makeCounter();
        const b = makeCounter();
        schedA.addService(buildOnceEvent({ hh: 10, mm: 0, ss: 0 }, a.cb));
        schedB.addService(buildOnceEvent({ hh: 10, mm: 0, ss: 0 }, b.cb));

        clockA.advance(3_600_000); // advance only A
        expect(a.count).toBe(1);
        expect(b.count).toBe(0); // B is unaffected
    });
});
