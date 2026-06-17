import type { CreateScheduleEvent, CreateScheduleEventParameter, Schedule, ScheduleDays, ScheduleEventOpenClose, ScheduleEventOpenCloseParametersDays, ScheduleEventOpenCloseTimerParameter, ScheduleEvents } from "../Schedule";
import { createEvent, DAYS_OF_WEEK, getFirstDayWeek, scheduleEventTimeToDate, type NextWeekDay, type ScheduleCache } from "../builderSchedule";

export default function handleOpenCloseEvent(schedule: ScheduleCache, event: ScheduleEvents<'OPEN_CLOSE'>): ScheduleEvents<"OPEN_CLOSE"> {
    const NOW: Date = new Date();

    if (event.parameter.isOpen) {

        if (event.parameter.type === 'DAYS') {
            const WEEK_DAY = testAndFindWeekDay(NOW, event.parameter.timer.days, 'timeClose');
            event.parameter.timer.indexDay = WEEK_DAY.day;
            createEvent(NOW, WEEK_DAY.data, schedule, event);
        } else if (event.parameter.type === 'NORMAL') {
            const PARSED_DATE: Date = scheduleEventTimeToDate(NOW, event.parameter.timer.timeClose);
            if (NOW > PARSED_DATE) {
                PARSED_DATE.setDate(PARSED_DATE.getDate() + 1);
            }
            createEvent(NOW, PARSED_DATE, schedule, event);
        }

    } else {

        if (event.parameter.type === 'DAYS') {
            const WEEK_DAY = testAndFindWeekDay(NOW, event.parameter.timer.days, 'timeOpen');
            event.parameter.timer.indexDay = WEEK_DAY.day;
            createEvent(NOW, WEEK_DAY.data, schedule, event);
        } else if (event.parameter.type === 'NORMAL') {
            const PARSED_DATE: Date = scheduleEventTimeToDate(NOW, event.parameter.timer.timeOpen);
            if (NOW > PARSED_DATE) {
                PARSED_DATE.setDate(PARSED_DATE.getDate() + 1);
            }
            createEvent(NOW, PARSED_DATE, schedule, event);
        }

    }

    event.parameter.isOpen = !event.parameter.isOpen;

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

export const createOpenCloseDaysEvent: CreateScheduleEvent<'OPEN_CLOSE', ScheduleEventOpenCloseParametersDays> = (days: ScheduleEventOpenCloseParametersDays, cb: (param: ScheduleEvents<'OPEN_CLOSE'>) => void): CreateScheduleEventParameter<'OPEN_CLOSE'> | null => {

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

export const createOpenCloseEvent: CreateScheduleEvent<'OPEN_CLOSE', ScheduleEventOpenCloseTimerParameter> = (timer: ScheduleEventOpenCloseTimerParameter, cb: (param: ScheduleEvents<'OPEN_CLOSE'>) => void): CreateScheduleEventParameter<'OPEN_CLOSE'> | null => {

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