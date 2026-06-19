import type { Clock, CreateScheduleEvent, CreateScheduleEventCallbackParameter, CreateScheduleEventParameter, ScheduleDays, ScheduleEventRepeatParameterDays, ScheduleEventRepeatUnion, ScheduleEvents, ScheduleEventTime, TimerProvider } from "../Schedule"
import { createEvent, DAYS_OF_WEEK, scheduleEventTimeToDate, type ScheduleCache } from "../builderSchedule";

export default function handleRepeatEvent(schedule: ScheduleCache, event: ScheduleEvents<'REPEAT'>, clock: Clock, timer: TimerProvider): ScheduleEvents<"REPEAT"> {
    const NOW: Date = clock.now();
    if (event.parameter.type === 'DAYS') {
        const WEEK_DAY = testAndFindWeekDay(NOW, event.parameter.timer.days);
        event.parameter.timer.indexDay = WEEK_DAY.day;
        createEvent(NOW, WEEK_DAY.data, schedule, event, clock, timer);
        return event;
    } else if (event.parameter.type === 'NORMAL') {
        let lessDate: Date = new Date(NOW);
        const HOURS = testDate(NOW, lessDate, event.parameter.timer);
        if (HOURS.flag) {
            event.parameter.indexTime = HOURS.index;
            createEvent(NOW, HOURS.parsedDate, schedule, event, clock, timer);
            return event;
        }

        lessDate.setDate(NOW.getDate() + 1);

        for (let index = 0; index < event.parameter.timer.length; index++) {
            const T: ScheduleEventTime | undefined = event.parameter.timer[index];
            if (T !== undefined) {
                const PARSED_DATE: Date = scheduleEventTimeToDate(lessDate, T);
                if (PARSED_DATE < lessDate) {
                    lessDate = PARSED_DATE;
                }
            }
        }

        createEvent(NOW, lessDate, schedule, event, clock, timer);
    }

    return event;
}

function testDate(now: Date, parsedDate: Date, parameters: ScheduleEventTime[]) {
    const RET: {
        index: number,
        parsedDate: Date,
        flag: boolean
    } = {
        flag: false,
        index: -1,
        parsedDate: parsedDate
    };
    for (let i = 0; i < parameters.length; i++) {
        const TIMER: ScheduleEventTime | undefined = parameters[i];
        if (TIMER !== undefined) {
            const PARSE_DATA: Date = scheduleEventTimeToDate(now, TIMER);
            if (now < PARSE_DATA && (!RET.flag || PARSE_DATA < RET.parsedDate)) {
                RET.flag = true;
                RET.index = i;
                RET.parsedDate = PARSE_DATA;
            }
        }
    }
    return RET;
}

function testAndFindWeekDay(now: Date, parameters: ScheduleEventRepeatParameterDays): { data: Date, day: ScheduleDays } {
    for (let daysAhead = 0; daysAhead < 8; daysAhead++) {
        const candidate = new Date(now);
        candidate.setDate(now.getDate() + daysAhead);
        const DAY: ScheduleDays = DAYS_OF_WEEK[candidate.getDay()] as ScheduleDays;
        const slots = parameters[DAY];
        if (slots !== undefined) {
            let minDate: Date | null = null;
            for (let i = 0; i < slots.length; i++) {
                const slot = slots[i];
                if (slot !== undefined) {
                    const slotDate = scheduleEventTimeToDate(candidate, slot);
                    if (now < slotDate && (minDate === null || slotDate < minDate)) {
                        minDate = slotDate;
                    }
                }
            }
            if (minDate !== null) {
                return { data: minDate, day: DAY };
            }
        }
    }

    const fallbackDay: ScheduleDays = (Object.keys(parameters) as ScheduleDays[])[0] ?? (DAYS_OF_WEEK[now.getDay()] as ScheduleDays);
    const fallback = new Date(now);
    fallback.setDate(now.getDate() + 7);
    return { data: fallback, day: fallbackDay };
}

export const createRepeatDaysEvent: CreateScheduleEvent<'REPEAT', ScheduleEventRepeatParameterDays> = (days: ScheduleEventRepeatParameterDays, cb: (param: CreateScheduleEventCallbackParameter<'REPEAT'>) => void): CreateScheduleEventParameter<'REPEAT'> | null => {

    if (Object.keys(days).length === 0) {
        return null;
    }

    return {
        event: {
            cb,
            type: 'REPEAT',
            parameter: {
                type: 'DAYS',
                indexTime: 0,
                timer: {
                    indexDay: "FRI",
                    days: days
                }
            },
        }
    }
}

export const createRepeatHourEvent: CreateScheduleEvent<'REPEAT', ScheduleEventTime[]> = (timer: ScheduleEventTime[], cb: (param: CreateScheduleEventCallbackParameter<'REPEAT'>) => void): CreateScheduleEventParameter<'REPEAT'> | null => {

    if (timer.length === 0) {
        return null;
    }

    return {
        event: {
            cb,
            type: 'REPEAT',
            parameter: {
                type: 'NORMAL',
                indexTime: 0,
                timer: timer
            },
        }
    }
}
