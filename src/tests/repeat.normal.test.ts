import { describe, it, expect, beforeEach } from "bun:test";
import { createSchedule } from "../builderSchedule";
import { createRepeatHourEvent } from "../events/repeatEvent";
import { FakeClock } from "./helpers/FakeClock";
import { buildRepeatHourEvent } from "./helpers/builders";
import { dateAt } from "./helpers/dateAt";
import { makeCounter } from "./helpers/counter";

// 2025-03-15 is a Saturday

describe("REPEAT/NORMAL events", () => {
    let clock: FakeClock;
    let scheduler: ReturnType<typeof createSchedule>;

    beforeEach(() => {
        clock = new FakeClock(dateAt(2025, 3, 15, 8, 0, 0)); // SAT 08:00
        scheduler = createSchedule({ clock, timer: clock });
    });

    it("fires at the first matching future time slot", () => {
        const c = makeCounter();
        scheduler.addService(buildRepeatHourEvent([{ hh: 9, mm: 0, ss: 0 }, { hh: 14, mm: 0, ss: 0 }], c.cb));
        clock.advance(3_600_000); // to 09:00
        expect(c.count).toBe(1);
    });

    it("fires at each subsequent slot in the same day", () => {
        const c = makeCounter();
        scheduler.addService(buildRepeatHourEvent([{ hh: 9, mm: 0, ss: 0 }, { hh: 14, mm: 0, ss: 0 }], c.cb));
        clock.advance(3_600_000);  // 09:00
        expect(c.count).toBe(1);
        clock.advance(18_000_000); // +5h to 14:00
        expect(c.count).toBe(2);
    });

    it("wraps to next day when all today's slots are past", () => {
        clock.reset(dateAt(2025, 3, 15, 15, 0, 0)); // SAT 15:00 — all slots past
        scheduler = createSchedule({ clock, timer: clock });
        const c = makeCounter();
        scheduler.addService(buildRepeatHourEvent([{ hh: 9, mm: 0, ss: 0 }, { hh: 14, mm: 0, ss: 0 }], c.cb));
        clock.advance(64_800_000); // 18h to SUN 09:00
        expect(c.count).toBe(1);
    });

    it("promotes to earliest slot next day when today's single slot has passed", () => {
        clock.reset(dateAt(2025, 3, 15, 14, 1, 0)); // SAT 14:01
        scheduler = createSchedule({ clock, timer: clock });
        const c = makeCounter();
        scheduler.addService(buildRepeatHourEvent([{ hh: 9, mm: 0, ss: 0 }], c.cb));
        // Next fire: SUN 09:00 = 18h 59m = 68 340 000 ms
        clock.advance(68_340_000);
        expect(c.count).toBe(1);
    });

    it("fires daily across three consecutive cycles", () => {
        const c = makeCounter();
        scheduler.addService(buildRepeatHourEvent([{ hh: 9, mm: 0, ss: 0 }], c.cb));
        clock.advance(3 * 86_400_000); // 3 days
        expect(c.count).toBe(3);
    });

    it("fires all three slots within one day in order", () => {
        const c = makeCounter();
        scheduler.addService(buildRepeatHourEvent([
            { hh: 9, mm: 0, ss: 0 },
            { hh: 10, mm: 0, ss: 0 },
            { hh: 11, mm: 0, ss: 0 },
        ], c.cb));
        clock.advance(10_800_000); // 3h
        expect(c.count).toBe(3);
    });

    it("listEvents returns the correct next fire time before first fire", () => {
        scheduler.addService(buildRepeatHourEvent([{ hh: 9, mm: 0, ss: 0 }], () => {}));
        const listed = scheduler.listEvents();
        expect(listed.length).toBeGreaterThan(0);
        expect(listed[0]!.date.hh).toBe(9);
        expect(listed[0]!.date.mm).toBe(0);
    });

    it("createRepeatHourEvent returns null for empty timer array", () => {
        expect(createRepeatHourEvent([], () => {})).toBeNull();
        expect(scheduler.addService(null)).toBeNull();
        expect(clock.pendingCount()).toBe(0);
    });
});
