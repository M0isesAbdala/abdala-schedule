import { describe, it, expect, beforeEach } from "bun:test";
import { createSchedule } from "../builderSchedule";
import { createRepeatHourEvent } from "../events/repeatEvent";
import { FakeClock } from "./helpers/FakeClock";
import { buildOnceEvent } from "./helpers/builders";
import { dateAt } from "./helpers/dateAt";
import { makeCounter } from "./helpers/counter";

describe("ONCE events", () => {
    let clock: FakeClock;
    let scheduler: ReturnType<typeof createSchedule>;

    beforeEach(() => {
        clock = new FakeClock(dateAt(2025, 3, 15, 9, 0, 0));
        scheduler = createSchedule({ clock, timer: clock });
    });

    it("fires exactly once at the scheduled time", () => {
        const c = makeCounter();
        scheduler.addService(buildOnceEvent({ hh: 10, mm: 0, ss: 0 }, c.cb));
        expect(c.count).toBe(0);
        clock.advance(3_600_000);
        expect(c.count).toBe(1);
    });

    it("does not fire again after the first execution", () => {
        const c = makeCounter();
        scheduler.addService(buildOnceEvent({ hh: 10, mm: 0, ss: 0 }, c.cb));
        clock.advance(7_200_000);
        expect(c.count).toBe(1);
    });

    it("does not fire before its scheduled time", () => {
        const c = makeCounter();
        scheduler.addService(buildOnceEvent({ hh: 10, mm: 0, ss: 0 }, c.cb));
        clock.advance(3_599_999); // 1 ms before
        expect(c.count).toBe(0);
        clock.advance(1); // exactly at 10:00
        expect(c.count).toBe(1);
    });

    it("two events at different times fire independently", () => {
        const a = makeCounter();
        const b = makeCounter();
        scheduler.addService(buildOnceEvent({ hh: 10, mm: 0, ss: 0 }, a.cb));
        scheduler.addService(buildOnceEvent({ hh: 11, mm: 0, ss: 0 }, b.cb));

        clock.advance(3_600_000); // to 10:00
        expect(a.count).toBe(1);
        expect(b.count).toBe(0);

        clock.advance(3_600_000); // to 11:00
        expect(a.count).toBe(1);
        expect(b.count).toBe(1);
    });

    it("two events at the same time both fire", () => {
        const a = makeCounter();
        const b = makeCounter();
        scheduler.addService(buildOnceEvent({ hh: 10, mm: 0, ss: 0 }, a.cb));
        scheduler.addService(buildOnceEvent({ hh: 10, mm: 0, ss: 0 }, b.cb));

        clock.advance(3_600_000);
        expect(a.count).toBe(1);
        expect(b.count).toBe(1);
    });

    it("does not schedule when time has already passed", () => {
        const c = makeCounter();
        // clock at 09:00, event at 08:00 — past
        scheduler.addService(buildOnceEvent({ hh: 8, mm: 0, ss: 0 }, c.cb));
        expect(clock.pendingCount()).toBe(0);
        clock.advance(3_600_000);
        expect(c.count).toBe(0);
    });

    it("callback receives the correct event object", () => {
        let received: unknown = null;
        const cb = (arg: unknown) => { received = arg; };
        scheduler.addService(buildOnceEvent({ hh: 10, mm: 0, ss: 0 }, cb as any));
        clock.advance(3_600_000);
        const evt = received as any;
        expect(evt.type).toBe('ONCE');
        expect(typeof evt.id).toBe('number');
        expect(evt.parameter.time.hh).toBe(10);
    });
});
