import type { CreateScheduleEvent, CreateScheduleEventCallbackParameter, CreateScheduleEventParameter, Schedule, ScheduleDays, ScheduleEventOpenClose, ScheduleEventOpenCloseParametersDays, ScheduleEventOpenCloseTimerParameter, ScheduleEvents } from "../Schedule";
import { createEvent, DAYS_OF_WEEK, getFirstDayWeek, scheduleEventTimeToDate, type NextWeekDay, type ScheduleCache } from "../builderSchedule";

export default function handleOpenCloseEvent(schedule: ScheduleCache, event: ScheduleEvents<'OPEN_CLOSE'>): ScheduleEvents<"OPEN_CLOSE"> {
    const NOW: Date = new Date();

    if (event.parameter.type === 'DAYS') {

        const WEEK_DAY_OPEN = testAndFindWeekDay(NOW, event.parameter.timer.days, 'timeOpen');
        const WEEK_DAY_CLOSE = testAndFindWeekDay(NOW, event.parameter.timer.days, 'timeClose');

        if (NOW.getDay() === WEEK_DAY_OPEN.data.getDay()) {
            event.parameter.isOpen = true;
            event.parameter.timer.indexDay = WEEK_DAY_CLOSE.day;
            createEvent(NOW, WEEK_DAY_CLOSE.data, schedule, event);
            event.cb(event);
        } else if (NOW.getDay() === WEEK_DAY_CLOSE.data.getDay()) {
            event.parameter.isOpen = false;
            const WEEK_DAY_OPEN = testAndFindWeekDay(NOW, event.parameter.timer.days, 'timeOpen');
            event.parameter.timer.indexDay = WEEK_DAY_OPEN.day;
            createEvent(NOW, WEEK_DAY_OPEN.data, schedule, event);
        } else {
            event.parameter.isOpen = false;
            event.parameter.timer.indexDay = WEEK_DAY_CLOSE.day;
            createEvent(NOW, WEEK_DAY_OPEN.data, schedule, event);
        }

    } else if (event.parameter.type === 'NORMAL') {
        const TIME_OPEN: Date = scheduleEventTimeToDate(NOW, event.parameter.timer.timeOpen);
        const TIME_CLOSE: Date = scheduleEventTimeToDate(NOW, event.parameter.timer.timeClose);

        if (NOW > TIME_OPEN && !event.parameter.isOpen) {
            event.parameter.isOpen = true;
            if (NOW > TIME_CLOSE) {
                TIME_CLOSE.setDate(TIME_CLOSE.getDate() + 1);
            }
            createEvent(NOW, TIME_CLOSE, schedule, event);
            event.cb(event);
        } else if (NOW > TIME_CLOSE && event.parameter.isOpen) {
            event.parameter.isOpen = false;
            if (NOW > TIME_OPEN) {
                TIME_OPEN.setDate(TIME_OPEN.getDate() + 1);
            }
            createEvent(NOW, TIME_OPEN, schedule, event);
        } else {
            event.parameter.isOpen = false;
            if (NOW > TIME_OPEN) {
                TIME_OPEN.setDate(TIME_OPEN.getDate() + 1);
            }
            createEvent(NOW, TIME_OPEN, schedule, event);
        }

    }

    return event;
}

function testAndFindWeekDay(now: Date, parameters: ScheduleEventOpenCloseParametersDays, key: 'timeOpen' | 'timeClose'): { data: Date, day: ScheduleDays } {
    let index = 0;
    let parsedDate: Date = new Date(now);
    let currentIndex: number = now.getDay();

    while (index < 8) {

        if (currentIndex === DAYS_OF_WEEK.length) {
            currentIndex = 0;
        }

        const DAY: ScheduleDays = DAYS_OF_WEEK[currentIndex] as ScheduleDays;

        if (parameters[DAY] !== undefined) {
            parsedDate = scheduleEventTimeToDate(now, parameters[DAY][key]);
            parsedDate.setDate(parsedDate.getDate() + index);
            if (now < parsedDate) {
                break;
            }
        }

        currentIndex++;
        index++;
    }

    return {
        data: parsedDate,
        day: DAYS_OF_WEEK[currentIndex] as ScheduleDays
    };
}

export const createOpenCloseDaysEvent: CreateScheduleEvent<'OPEN_CLOSE', ScheduleEventOpenCloseParametersDays> = (days: ScheduleEventOpenCloseParametersDays, cb: (param: CreateScheduleEventCallbackParameter<'OPEN_CLOSE'>) => void): CreateScheduleEventParameter<'OPEN_CLOSE'> | null => {

    if (Object.keys(days).length === 0) {
        return null;
    }

    const NOW = new Date();

    const INDEX_DAY = DAYS_OF_WEEK[NOW.getDay()];

    const CURRENT_DAY: ScheduleDays = INDEX_DAY !== undefined ? INDEX_DAY : 'SUN';

    const DAYS: ScheduleDays[] = Object.keys(days) as ScheduleDays[];

    const DAY: NextWeekDay = getFirstDayWeek(CURRENT_DAY, DAYS);

    return {
        event: {
            cb,
            type: 'OPEN_CLOSE',
            parameter: {
                type: 'DAYS',
                isOpen: false,
                timer: {
                    days: days,
                    indexDay: DAY.newDay
                }
            }
        }
    }
}

export const createOpenCloseEvent: CreateScheduleEvent<'OPEN_CLOSE', ScheduleEventOpenCloseTimerParameter> = (timer: ScheduleEventOpenCloseTimerParameter, cb: (param: CreateScheduleEventCallbackParameter<'OPEN_CLOSE'>) => void): CreateScheduleEventParameter<'OPEN_CLOSE'> | null => {

    return {
        event: {
            cb,
            type: 'OPEN_CLOSE',
            parameter: {
                type: 'NORMAL',
                isOpen: false,
                timer: timer
            }
        }
    }
}