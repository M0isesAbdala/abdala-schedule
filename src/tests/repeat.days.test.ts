import { describe, it, expect, beforeEach } from "bun:test";
import { createSchedule } from "../builderSchedule";
import { createRepeatDaysEvent } from "../events/repeatEvent";
import { FakeClock } from "./helpers/FakeClock";
import { buildRepeatDaysEvent } from "./helpers/builders";
import { dateAt } from "./helpers/dateAt";
import { makeCounter } from "./helpers/counter";

// 2025-03-15 is Saturday (getDay() === 6)

describe("REPEAT/DAYS events", () => {
    let clock: FakeClock;
    let scheduler: ReturnType<typeof createSchedule>;

    beforeEach(() => {
        clock = new FakeClock(dateAt(2025, 3, 15, 8, 0, 0)); // SAT 08:00
        scheduler = createSchedule({ clock, timer: clock });
    });

    it("fires on the correct weekday at the configured time", () => {
        const c = makeCounter();
        scheduler.addService(buildRepeatDaysEvent({ SAT: [{ hh: 9, mm: 0, ss: 0 }] }, c.cb));
        clock.advance(3_600_000); // to SAT 09:00
        expect(c.count).toBe(1);
    });

    it("skips to next week when today's slot has already passed", () => {
        clock.reset(dateAt(2025, 3, 15, 10, 0, 0)); // SAT 10:00 — 09:00 is past
        scheduler = createSchedule({ clock, timer: clock });
        const c = makeCounter();
        scheduler.addService(buildRepeatDaysEvent({ SAT: [{ hh: 9, mm: 0, ss: 0 }] }, c.cb));
        clock.advance(604_800_000); // 7 days
        expect(c.count).toBe(1);
    });

    it("finds the correct future day when current day is not in the configured set", () => {
        // SAT 08:00 → next MON = 2 days + 1h = 176 400 000 ms
        const c = makeCounter();
        scheduler.addService(buildRepeatDaysEvent({ MON: [{ hh: 9, mm: 0, ss: 0 }] }, c.cb));
        clock.advance(176_400_000);
        expect(c.count).toBe(1);
    });

    it("picks the nearest day when multiple days are configured", () => {
        // SAT 08:00: SUN is 1 day away, FRI is 6 days away
        const c = makeCounter();
        scheduler.addService(buildRepeatDaysEvent({
            SUN: [{ hh: 9, mm: 0, ss: 0 }],
            FRI: [{ hh: 9, mm: 0, ss: 0 }],
        }, c.cb));
        clock.advance(90_000_000); // 25h — reaches SUN but not FRI
        expect(c.count).toBe(1);
    });

    it("repeats weekly across two cycles", () => {
        const c = makeCounter();
        scheduler.addService(buildRepeatDaysEvent({ SAT: [{ hh: 9, mm: 0, ss: 0 }] }, c.cb));
        clock.advance(608_400_000); // 7 days + 1h
        expect(c.count).toBe(2);
    });

    it("createRepeatDaysEvent returns null for empty days object", () => {
        expect(createRepeatDaysEvent({}, () => {})).toBeNull();
        expect(clock.pendingCount()).toBe(0);
    });
});
