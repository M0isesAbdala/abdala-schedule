import type { CreateSchedule, CreateScheduleEventParameterUnion, Schedule, ScheduleDays, ScheduleEventsUnion, ScheduleEventTime, ScheduleListEvent } from "./Schedule";
import handleRepeatEvent from "./events/repeatEvent";
import { handleOnceEvent } from "./events/onceEvent";
import handleOpenCloseEvent from "./events/openCloseEvent";

export const DAYS_OF_WEEK: ScheduleDays[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export type CreateEvent = {
    time: ScheduleEventTime;
    events: ScheduleEventsUnion[];
    timeoutEvent: NodeJS.Timeout;
};

export type NextWeekDay = {
    time: number;
    newDay: ScheduleDays;
}

export type ScheduleCache = Map<Date, Schedule>;

export function createSchedule(): CreateSchedule {
    const SCHEDULE: ScheduleCache = new Map<Date, Schedule>();
    let count: number = 0;

    function addService(event: CreateScheduleEventParameterUnion | null): ScheduleEventsUnion | null {

        if (event === null) {
            return null;
        }
        count++;

        let eventWithId: ScheduleEventsUnion = {
            ...event.event,
            id: count
        }

        if (eventWithId.type === 'ONCE') {
            eventWithId = handleOnceEvent(SCHEDULE, eventWithId);
        } else if (eventWithId.type === 'OPEN_CLOSE') {
            eventWithId = handleOpenCloseEvent(SCHEDULE, eventWithId);
        } else if (eventWithId.type === 'REPEAT') {
            eventWithId = handleRepeatEvent(SCHEDULE, eventWithId);
        }

        return eventWithId;
    }

    function removeService(id: number): void {
        for (const KEY of SCHEDULE.keys()) {
            const EVENTS: Schedule | undefined = SCHEDULE.get(KEY);
            if (EVENTS !== undefined) {
                const NEW_EVENTS: ScheduleEventsUnion[] = [];
                for (let index = 0; index < EVENTS.events.length; index++) {
                    const EVENT: ScheduleEventsUnion | undefined = EVENTS.events[index];
                    if (EVENT !== undefined) {
                        if (EVENT.id === id) {
                            if (EVENT.type === 'OPEN_CLOSE') {
                                if (EVENT.parameter.isOpen) {
                                    EVENT.cb(EVENT);
                                }
                            }
                        } else {
                            NEW_EVENTS.push(EVENT);
                        }
                    }
                }

                if (NEW_EVENTS.length === 0) {
                    clearTimeout(EVENTS.eventTimeout);
                    SCHEDULE.delete(KEY);
                    return;
                }

                SCHEDULE.set(KEY, {
                    ...EVENTS,
                    events: NEW_EVENTS
                });
            }
        }
    }

    function gracefulShutdown() {
        for (const KEY of SCHEDULE.keys()) {
            const EVENTS: Schedule | undefined = SCHEDULE.get(KEY);
            if (EVENTS !== undefined) {
                for (let index = 0; index < EVENTS.events.length; index++) {
                    const EVENT: ScheduleEventsUnion | undefined = EVENTS.events[index];
                    if (EVENT !== undefined) {
                        if (EVENT.type === 'OPEN_CLOSE') {
                            if (EVENT.parameter.isOpen) {
                                EVENT.cb(EVENT);
                            }
                        }
                    }
                }
                clearTimeout(EVENTS.eventTimeout);
                SCHEDULE.delete(KEY);
            }
        }
    }

    function listEvents(): ScheduleListEvent[] {
        const RESPONSE_EVENTS: ScheduleListEvent[] = [];
        for (const KEY of SCHEDULE.keys()) {
            const EVENTS: Schedule | undefined = SCHEDULE.get(KEY);
            if (EVENTS !== undefined) {
                const E: ScheduleListEvent = {
                    date: dateToScheduleEventTime(KEY),
                    ids: []
                };
                for (let index = 0; index < EVENTS.events.length; index++) {
                    const EVENT: ScheduleEventsUnion | undefined = EVENTS.events[index];
                    if (EVENT !== undefined) {
                        E.ids.push(EVENT.id);
                    }
                }
                RESPONSE_EVENTS.push(E);
            }
        }

        return RESPONSE_EVENTS;
    }

    return {
        addService,
        removeService,
        listEvents,
        gracefulShutdown
    }
};

export function createEvent(now: Date, time: Date, schedule: ScheduleCache, event: ScheduleEventsUnion): void {

    if (schedule.has(time)) {
        schedule.get(time)?.events.push(event);
    } else {
        const EVENTS: ScheduleEventsUnion[] = [event];
        const TIMEOUT_EVENT: NodeJS.Timeout = setTimeout(() => {
            for (let index = 0; index < EVENTS.length; index++) {
                const EVENT: ScheduleEventsUnion | undefined = EVENTS[index];
                if (EVENT !== undefined) {
                    if (EVENT.type === 'OPEN_CLOSE') {
                        EVENT.cb(EVENT);
                        EVENTS[index] = handleOpenCloseEvent(schedule, EVENT);
                    } else if (EVENT.type === 'ONCE') {
                        EVENT.cb(EVENT);
                    } else if (EVENT.type === 'REPEAT') {
                        EVENT.cb(EVENT);
                        EVENTS[index] = handleRepeatEvent(schedule, EVENT);
                    }
                }
            }
            clearTimeout(TIMEOUT_EVENT);
            schedule.delete(time);
        }, convertToMillis(now, time));

        const SC: Schedule = {
            events: EVENTS,
            eventTimeout: TIMEOUT_EVENT
        };

        schedule.set(time, SC);
    }
}

function convertToMillis(now: Date, time: Date): number {
    const MILLIS = time.getTime() - now.getTime();
    return MILLIS;
};

export function dateToScheduleEventTime(time: Date): ScheduleEventTime {
    return {
        d: time.getDate(),
        hh: time.getHours(),
        mm: time.getMinutes(),
        ss: time.getSeconds()
    };
};

export function scheduleEventTimeToDate(now: Date, time: ScheduleEventTime): Date {
    const YEAR = now.getFullYear();
    const MONTH = now.getMonth();
    const D: Date = new Date(YEAR, MONTH, time.d !== undefined ? time.d : now.getDate(), time.hh, time.mm, time.ss);
    return D;
};

export function getFirstDayWeek(currentDay: ScheduleDays, parameters: ScheduleDays[]): NextWeekDay {
    let days: number = 0;
    let newDay: ScheduleDays | null = currentDay;

    for (let index = 0; index < DAYS_OF_WEEK.length; index++) {
        const D: ScheduleDays | undefined = DAYS_OF_WEEK[index];
        if (D !== undefined) {
            const FIND_DAY: ScheduleDays | undefined = parameters.find((d: ScheduleDays) => d === D);
            if (FIND_DAY !== undefined) {
                newDay = FIND_DAY;
                break;
            }
        }

    }

    days = ((DAYS_OF_WEEK.length - DAYS_OF_WEEK.indexOf(currentDay)) + DAYS_OF_WEEK.indexOf(newDay));

    return {
        newDay,
        time: days
    }
}