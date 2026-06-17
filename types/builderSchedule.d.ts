import type { CreateSchedule, Schedule, ScheduleDays, ScheduleEventsUnion, ScheduleEventTime } from "./Schedule";
export declare const DAYS_OF_WEEK: ScheduleDays[];
export type CreateEvent = {
    time: ScheduleEventTime;
    events: ScheduleEventsUnion[];
    timeoutEvent: NodeJS.Timeout;
};
export type NextWeekDay = {
    time: number;
    newDay: ScheduleDays;
};
export type ScheduleCache = Map<Date, Schedule>;
export declare function createSchedule(): CreateSchedule;
export declare function createEvent(now: Date, time: Date, schedule: ScheduleCache, event: ScheduleEventsUnion): void;
export declare function dateToScheduleEventTime(time: Date): ScheduleEventTime;
export declare function scheduleEventTimeToDate(now: Date, time: ScheduleEventTime): Date;
export declare function getFirstDayWeek(currentDay: ScheduleDays, parameters: ScheduleDays[]): NextWeekDay;
