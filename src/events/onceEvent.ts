import type { Clock, CreateScheduleEvent, CreateScheduleEventCallbackParameter, CreateScheduleEventParameter, ScheduleEvents, ScheduleEventTime, TimerProvider } from "../Schedule";
import { createEvent, scheduleEventTimeToDate, type ScheduleCache } from "../builderSchedule";

export function handleOnceEvent(schedule: ScheduleCache, event: ScheduleEvents<"ONCE">, clock: Clock, timer: TimerProvider): ScheduleEvents<"ONCE"> {
    const NOW: Date = clock.now();
    const PARSED_DATE: Date = scheduleEventTimeToDate(NOW, event.parameter.time);

    if (NOW < PARSED_DATE) {
        createEvent(NOW, PARSED_DATE, schedule, event, clock, timer);
    }

    return event;
}

export const createOnceEvent: CreateScheduleEvent<'ONCE', ScheduleEventTime> = (time: ScheduleEventTime, cb: (param: CreateScheduleEventCallbackParameter<'ONCE'>) => void): CreateScheduleEventParameter<'ONCE'> | null => {
    const NOW: Date = new Date();

    const D: Date = scheduleEventTimeToDate(NOW, time);

    if (NOW > D) {
        return null;
    }

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
