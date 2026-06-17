import type { CreateScheduleEvent, CreateScheduleEventParameter, Schedule, ScheduleEventOnce, ScheduleEvents, ScheduleEventTime } from "../Schedule";
import { createEvent, scheduleEventTimeToDate, type ScheduleCache } from "../builderSchedule";

export function handleOnceEvent(schedule: ScheduleCache, event: ScheduleEvents<"ONCE">): ScheduleEvents<"ONCE"> {
    const NOW: Date = new Date;
    const PARSED_DATE: Date = scheduleEventTimeToDate(NOW, event.parameter.time);

    if (NOW < PARSED_DATE) {
        createEvent(NOW, PARSED_DATE, schedule, event);
    }

    return event;
}

export const createOnceEvent: CreateScheduleEvent<'ONCE', ScheduleEventTime> = (time: ScheduleEventTime, cb: (param: ScheduleEvents<'ONCE'>) => void): CreateScheduleEventParameter<'ONCE'> | null => {
    const NOW: Date = new Date();

    const D: Date = scheduleEventTimeToDate(NOW, time);

    if (NOW > D) {
        return null;
    }

    NOW.setHours(time.hh);
    NOW.setMinutes(time.mm);
    NOW.setSeconds(time.ss);


    return {
        event: {
            cb: cb,
            type: 'ONCE',
            parameter: {
                time: time,
            }
        }
    }
}