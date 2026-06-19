import { describe, it, expect } from "bun:test";
import { createSchedule } from "../builderSchedule";
import { FakeClock } from "./helpers/FakeClock";
import { buildOpenCloseEvent } from "./helpers/builders";
import { dateAt } from "./helpers/dateAt";
import { makeCounter } from "./helpers/counter";

const TIMER = { timeOpen: { hh: 9, mm: 0, ss: 0 }, timeClose: { hh: 18, mm: 0, ss: 0 } };

describe("OPEN_CLOSE/NORMAL events", () => {
    it("fires open callback immediately when scheduler starts inside the open window", () => {
        const clock = new FakeClock(dateAt(2025, 3, 15, 11, 0, 0)); // 11:00 between 09 and 18
        const scheduler = createSchedule({ clock, timer: clock });
        const c = makeCounter();
        scheduler.addService(buildOpenCloseEvent(TIMER, c.cb));
        expect(c.count).toBe(1);
    });

    it("isOpen is true on the immediate open callback", () => {
        const clock = new FakeClock(dateAt(2025, 3, 15, 11, 0, 0));
        const scheduler = createSchedule({ clock, timer: clock });
        const states: boolean[] = [];
        const cb = (evt: any) => states.push(evt.parameter.isOpen);
        scheduler.addService(buildOpenCloseEvent(TIMER, cb));
        expect(states[0]).toBe(true);
    });

    it("fires close callback at the close time with isOpen=false", () => {
        const clock = new FakeClock(dateAt(2025, 3, 15, 11, 0, 0));
        const scheduler = createSchedule({ clock, timer: clock });
        const states: boolean[] = [];
        const cb = (evt: any) => states.push(evt.parameter.isOpen);
        scheduler.addService(buildOpenCloseEvent(TIMER, cb));
        expect(states.length).toBe(1); // open
        clock.advance(25_200_000); // 7h to 18:00
        expect(states.length).toBe(2);
        expect(states[1]).toBe(false);
    });

    it("schedules open first when started before open time", () => {
        const clock = new FakeClock(dateAt(2025, 3, 15, 7, 0, 0)); // before 09:00
        const scheduler = createSchedule({ clock, timer: clock });
        const c = makeCounter();
        scheduler.addService(buildOpenCloseEvent(TIMER, c.cb));
        expect(c.count).toBe(0);
        expect(clock.pendingCount()).toBe(1);
        clock.advance(7_200_000); // 2h to 09:00
        expect(c.count).toBe(1);
    });

    it("completes a full open→close→open cycle", () => {
        const clock = new FakeClock(dateAt(2025, 3, 15, 7, 0, 0));
        const scheduler = createSchedule({ clock, timer: clock });
        const c = makeCounter();
        scheduler.addService(buildOpenCloseEvent(TIMER, c.cb));
        clock.advance(7_200_000);  // open at 09:00
        expect(c.count).toBe(1);
        clock.advance(32_400_000); // close at 18:00
        expect(c.count).toBe(2);
        clock.advance(54_000_000); // next-day open at 09:00 (15h later)
        expect(c.count).toBe(3);
    });

    it("schedules next-day open when started after the close time", () => {
        const clock = new FakeClock(dateAt(2025, 3, 15, 20, 0, 0)); // 20:00, past 18:00
        const scheduler = createSchedule({ clock, timer: clock });
        const c = makeCounter();
        scheduler.addService(buildOpenCloseEvent(TIMER, c.cb));
        expect(c.count).toBe(0);
        clock.advance(46_800_000); // 13h to next-day 09:00
        expect(c.count).toBe(1);
    });

    it("removeService while open triggers close callback", () => {
        const clock = new FakeClock(dateAt(2025, 3, 15, 11, 0, 0));
        const scheduler = createSchedule({ clock, timer: clock });
        const states: boolean[] = [];
        const cb = (evt: any) => states.push(evt.parameter.isOpen);
        const added = scheduler.addService(buildOpenCloseEvent(TIMER, cb));
        expect(states[0]).toBe(true); // open fired during addService
        scheduler.removeService(added!.id);
        expect(states[1]).toBe(false); // close triggered by removeService
        expect(clock.pendingCount()).toBe(0);
    });

    it("removeService before open does not fire any callback", () => {
        const clock = new FakeClock(dateAt(2025, 3, 15, 7, 0, 0));
        const scheduler = createSchedule({ clock, timer: clock });
        const c = makeCounter();
        const added = scheduler.addService(buildOpenCloseEvent(TIMER, c.cb));
        expect(c.count).toBe(0);
        scheduler.removeService(added!.id);
        expect(c.count).toBe(0);
        expect(clock.pendingCount()).toBe(0);
    });

    it("gracefulShutdown closes all currently open events", () => {
        const clock = new FakeClock(dateAt(2025, 3, 15, 11, 0, 0));
        const scheduler = createSchedule({ clock, timer: clock });
        const timerA = { timeOpen: { hh: 9, mm: 0, ss: 0 }, timeClose: { hh: 18, mm: 0, ss: 0 } };
        const timerB = { timeOpen: { hh: 10, mm: 0, ss: 0 }, timeClose: { hh: 20, mm: 0, ss: 0 } };
        const a = makeCounter();
        const b = makeCounter();
        scheduler.addService(buildOpenCloseEvent(timerA, a.cb));
        scheduler.addService(buildOpenCloseEvent(timerB, b.cb));
        expect(a.count).toBe(1); // both opened synchronously
        expect(b.count).toBe(1);
        scheduler.gracefulShutdown();
        expect(a.count).toBe(2); // close callback fired
        expect(b.count).toBe(2);
        expect(clock.pendingCount()).toBe(0);
        expect(scheduler.listEvents()).toEqual([]);
    });
});
