import type { CreateScheduleEvent, CreateScheduleEventParameter, Schedule, ScheduleDays, ScheduleEventRepeatParameterDays, ScheduleEventRepeatUnion, ScheduleEvents, ScheduleEventTime } from "../Schedule"
import { createEvent, DAYS_OF_WEEK, scheduleEventTimeToDate, type CreateEvent, type NextWeekDay, type ScheduleCache } from "../builderSchedule";

export default function handleRepeatEvent(schedule: ScheduleCache, event: ScheduleEvents<'REPEAT'>): ScheduleEvents<"REPEAT"> {
    const NOW: Date = new Date();
    if (event.parameter.type === 'DAYS') {
        const WEEK_DAY = testAndFindWeekDay(NOW, event.parameter.timer.days);
        event.parameter.timer.indexDay = WEEK_DAY.day;
        createEvent(NOW, WEEK_DAY.data, schedule, event);
        return event;
    } else if (event.parameter.type === 'NORMAL') {
        let lessDate: Date = new Date(NOW);
        const HOURS = testDate(NOW, lessDate, event.parameter.timer);
        if (HOURS.flag) {
            event.parameter.indexTime = HOURS.index;
            createEvent(NOW, HOURS.parsedDate, schedule, event);
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

        createEvent(NOW, lessDate, schedule, event);
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
            if (now < PARSE_DATA && PARSE_DATA < parsedDate) {
                RET.flag = true;
                RET.index = i;
                RET.parsedDate = PARSE_DATA;
            }
        }
    }
    return RET;
}

function testAndFindWeekDay(now: Date, parameters: ScheduleEventRepeatParameterDays): { data: Date, day: ScheduleDays } {
    let index = 0;
    let parsedDate: Date = new Date(now);
    let currentIndex: number = now.getDay();

    while (index < 8) {

        if (currentIndex === DAYS_OF_WEEK.length) {
            currentIndex = 0;
        }

        const DAY: ScheduleDays = DAYS_OF_WEEK[currentIndex] as ScheduleDays;
        if (parameters[DAY] !== undefined) {
            const TEST = testDate(now, parsedDate, parameters[DAY]);
            parsedDate.setDate(parsedDate.getDate() + index);
            if (TEST.flag) {
                parsedDate = TEST.parsedDate;
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

export const createRepeatDaysEvent: CreateScheduleEvent<'REPEAT', ScheduleEventRepeatParameterDays> = (days: ScheduleEventRepeatParameterDays, cb: (param: ScheduleEvents<'REPEAT'>) => void): CreateScheduleEventParameter<'REPEAT'> | null => {

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

export const createRepeatHourEvent: CreateScheduleEvent<'REPEAT', ScheduleEventTime[]> = (timer: ScheduleEventTime[], cb: (param: ScheduleEvents<'REPEAT'>) => void): CreateScheduleEventParameter<'REPEAT'> | null => {

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