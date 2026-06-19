import { describe, it, expect } from "bun:test";
import { createSchedule } from "../builderSchedule";
import { createOpenCloseDaysEvent } from "../events/openCloseEvent";
import { FakeClock } from "./helpers/FakeClock";
import { buildOpenCloseDaysEvent } from "./helpers/builders";
import { dateAt } from "./helpers/dateAt";
import { makeCounter } from "./helpers/counter";

// 2025-03-15 is Saturday (getDay() === 6)

const SAT_WINDOW = { timeOpen: { hh: 9, mm: 0, ss: 0 }, timeClose: { hh: 18, mm: 0, ss: 0 } };

describe("OPEN_CLOSE/DAYS events", () => {
    it("fires open callback immediately when started inside the day's window", () => {
        const clock = new FakeClock(dateAt(2025, 3, 15, 11, 0, 0)); // SAT 11:00 in window
        const scheduler = createSchedule({ clock, timer: clock });
        const states: boolean[] = [];
        const cb = (evt: any) => states.push(evt.parameter.isOpen);
        scheduler.addService(buildOpenCloseDaysEvent({ SAT: SAT_WINDOW }, cb));
        expect(states[0]).toBe(true);
    });

    it("fires open callback immediately when on same weekday as window (even before open time)", () => {
        // The DAYS handler matches by getDay() not by exact time, so SAT fires open immediately
        const clock = new FakeClock(dateAt(2025, 3, 15, 8, 0, 0)); // SAT 08:00, before 09:00
        const scheduler = createSchedule({ clock, timer: clock });
        const c = makeCounter();
        scheduler.addService(buildOpenCloseDaysEvent({ SAT: SAT_WINDOW }, c.cb));
        // Open fires immediately because getDay() matches Saturday
        expect(c.count).toBe(1);
    });

    it("schedules event for a future weekday when current day is not configured", () => {
        // SAT 08:00 with only MON configured — enters else branch, schedules for MON 09:00
        const clock = new FakeClock(dateAt(2025, 3, 15, 8, 0, 0)); // SAT 08:00
        const scheduler = createSchedule({ clock, timer: clock });
        const c = makeCounter();
        const MON_WINDOW = { timeOpen: { hh: 9, mm: 0, ss: 0 }, timeClose: { hh: 18, mm: 0, ss: 0 } };
        scheduler.addService(buildOpenCloseDaysEvent({ MON: MON_WINDOW }, c.cb));
        // No immediate open (SAT ≠ MON)
        expect(c.count).toBe(0);
        // MON 09:00 is 2 days + 1h = 176 400 000 ms away; advance past it
        clock.advance(176_400_000);
        expect(c.count).toBeGreaterThanOrEqual(1);
    });

    it("createOpenCloseDaysEvent returns null for empty days object", () => {
        expect(createOpenCloseDaysEvent({}, () => {})).toBeNull();
    });

    it("removeService while open triggers close callback", () => {
        const clock = new FakeClock(dateAt(2025, 3, 15, 11, 0, 0)); // SAT in window
        const scheduler = createSchedule({ clock, timer: clock });
        const states: boolean[] = [];
        const cb = (evt: any) => states.push(evt.parameter.isOpen);
        const added = scheduler.addService(buildOpenCloseDaysEvent({ SAT: SAT_WINDOW }, cb));
        expect(states[0]).toBe(true); // open fired
        scheduler.removeService(added!.id);
        expect(states[states.length - 1]).toBe(false); // close triggered
        expect(clock.pendingCount()).toBe(0);
    });
});
