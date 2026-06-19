import { describe, it, expect } from "bun:test";
import { createSchedule } from "../builderSchedule";
import { FakeClock } from "./helpers/FakeClock";
import { buildOnceEvent, buildRepeatHourEvent, buildRepeatDaysEvent } from "./helpers/builders";
import { dateAt } from "./helpers/dateAt";
import { makeCounter } from "./helpers/counter";

describe("Edge cases", () => {
    it("midnight cross: ONCE event with explicit d fires 1 second after midnight", () => {
        const clock = new FakeClock(dateAt(2025, 3, 15, 23, 59, 59));
        const scheduler = createSchedule({ clock, timer: clock });
        const c = makeCounter();
        // d:16 targets March 16 00:00:00 explicitly
        scheduler.addService(buildOnceEvent({ hh: 0, mm: 0, ss: 0, d: 16 }, c.cb));
        clock.advance(1_000); // 1 second, crossing midnight
        expect(c.count).toBe(1);
    });

    it("midnight cross: REPEAT/NORMAL wraps SAT 23:59 → SUN 00:00 in 60 seconds", () => {
        const clock = new FakeClock(dateAt(2025, 3, 15, 23, 59, 0)); // SAT 23:59
        const scheduler = createSchedule({ clock, timer: clock });
        const fireDates: Date[] = [];
        const cb = () => fireDates.push(clock.now());
        scheduler.addService(buildRepeatHourEvent([{ hh: 0, mm: 0, ss: 0 }], cb));
        clock.advance(60_000); // 60 seconds to SUN 00:00
        expect(fireDates.length).toBe(1);
        expect(fireDates[0]!.getDay()).toBe(0); // Sunday
        expect(fireDates[0]!.getHours()).toBe(0);
        expect(fireDates[0]!.getMinutes()).toBe(0);
    });

    it("month-end wrap: REPEAT fires on the 1st of the next month (March → April)", () => {
        const clock = new FakeClock(dateAt(2025, 3, 31, 2, 0, 0)); // March 31 at 02:00
        const scheduler = createSchedule({ clock, timer: clock });
        const fireDates: Date[] = [];
        const cb = () => fireDates.push(clock.now());
        // timer at 01:00 — already past today, so next fire = April 1 01:00 (23h away)
        scheduler.addService(buildRepeatHourEvent([{ hh: 1, mm: 0, ss: 0 }], cb));
        clock.advance(82_800_000); // 23h
        expect(fireDates.length).toBe(1);
        expect(fireDates[0]!.getMonth()).toBe(3); // April = index 3
        expect(fireDates[0]!.getDate()).toBe(1);
    });

    it("leap year: REPEAT fires on February 29 (2024)", () => {
        const clock = new FakeClock(dateAt(2024, 2, 28, 23, 0, 0)); // Feb 28 leap year
        const scheduler = createSchedule({ clock, timer: clock });
        const fireDates: Date[] = [];
        const cb = () => fireDates.push(clock.now());
        // 00:30 is past midnight — next day (Feb 29) at 00:30 = 1.5h away
        scheduler.addService(buildRepeatHourEvent([{ hh: 0, mm: 30, ss: 0 }], cb));
        clock.advance(5_400_000); // 1h 30m
        expect(fireDates.length).toBe(1);
        expect(fireDates[0]!.getMonth()).toBe(1); // February (index 1)
        expect(fireDates[0]!.getDate()).toBe(29);
    });

    it("non-leap year: REPEAT wraps Feb 28 → March 1 (2025)", () => {
        const clock = new FakeClock(dateAt(2025, 2, 28, 23, 0, 0)); // Feb 28 non-leap
        const scheduler = createSchedule({ clock, timer: clock });
        const fireDates: Date[] = [];
        const cb = () => fireDates.push(clock.now());
        scheduler.addService(buildRepeatHourEvent([{ hh: 0, mm: 30, ss: 0 }], cb));
        clock.advance(5_400_000); // 1h 30m
        expect(fireDates.length).toBe(1);
        expect(fireDates[0]!.getMonth()).toBe(2); // March (index 2)
        expect(fireDates[0]!.getDate()).toBe(1);
    });

    it("year boundary: REPEAT fires on January 1 the following year", () => {
        const clock = new FakeClock(dateAt(2025, 12, 31, 23, 0, 0));
        const scheduler = createSchedule({ clock, timer: clock });
        const fireDates: Date[] = [];
        const cb = () => fireDates.push(clock.now());
        scheduler.addService(buildRepeatHourEvent([{ hh: 0, mm: 30, ss: 0 }], cb));
        clock.advance(5_400_000); // 1h 30m
        expect(fireDates.length).toBe(1);
        expect(fireDates[0]!.getFullYear()).toBe(2026);
        expect(fireDates[0]!.getMonth()).toBe(0); // January
        expect(fireDates[0]!.getDate()).toBe(1);
    });

    it("week boundary: REPEAT/DAYS on SAT fires at next weekly occurrence", () => {
        const clock = new FakeClock(dateAt(2025, 3, 15, 10, 0, 0)); // SAT 10:00 — 09:00 is past
        const scheduler = createSchedule({ clock, timer: clock });
        const c = makeCounter();
        // 09:00 today is past, so next fire is next SAT; advance 7 days
        scheduler.addService(buildRepeatDaysEvent({ SAT: [{ hh: 9, mm: 0, ss: 0 }] }, c.cb));
        clock.advance(604_800_000); // 7 days
        expect(c.count).toBe(1);
    });

    it("consecutive daily REPEAT cycles fire on time across a full week", () => {
        const clock = new FakeClock(dateAt(2025, 3, 15, 8, 0, 0));
        const scheduler = createSchedule({ clock, timer: clock });
        const c = makeCounter();
        scheduler.addService(buildRepeatHourEvent([{ hh: 9, mm: 0, ss: 0 }], c.cb));
        clock.advance(7 * 86_400_000); // 7 days
        expect(c.count).toBe(7);
    });

    it("two ONCE events at the exact same millisecond both fire", () => {
        const clock = new FakeClock(dateAt(2025, 3, 15, 8, 0, 0));
        const scheduler = createSchedule({ clock, timer: clock });
        const a = makeCounter();
        const b = makeCounter();
        scheduler.addService(buildOnceEvent({ hh: 9, mm: 0, ss: 0 }, a.cb));
        scheduler.addService(buildOnceEvent({ hh: 9, mm: 0, ss: 0 }, b.cb));
        clock.advance(3_600_000);
        expect(a.count).toBe(1);
        expect(b.count).toBe(1);
        expect(clock.pendingCount()).toBe(0);
    });
});
