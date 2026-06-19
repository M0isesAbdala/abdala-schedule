import type {
    CreateScheduleEventCallback,
    CreateScheduleEventParameter,
    ScheduleEventOpenCloseParametersDays,
    ScheduleEventOpenCloseTimerParameter,
    ScheduleEventRepeatParameterDays,
    ScheduleEventTime,
} from "../../Schedule";

export function buildOnceEvent(
    time: ScheduleEventTime,
    cb: CreateScheduleEventCallback<'ONCE'>
): CreateScheduleEventParameter<'ONCE'> {
    return { event: { cb, type: 'ONCE', parameter: { time } } };
}

export function buildRepeatHourEvent(
    timer: ScheduleEventTime[],
    cb: CreateScheduleEventCallback<'REPEAT'>
): CreateScheduleEventParameter<'REPEAT'> {
    return {
        event: {
            cb,
            type: 'REPEAT',
            parameter: { type: 'NORMAL', indexTime: 0, timer },
        },
    };
}

export function buildRepeatDaysEvent(
    days: ScheduleEventRepeatParameterDays,
    cb: CreateScheduleEventCallback<'REPEAT'>
): CreateScheduleEventParameter<'REPEAT'> {
    return {
        event: {
            cb,
            type: 'REPEAT',
            parameter: { type: 'DAYS', indexTime: 0, timer: { indexDay: 'MON', days } },
        },
    };
}

export function buildOpenCloseEvent(
    timer: ScheduleEventOpenCloseTimerParameter,
    cb: CreateScheduleEventCallback<'OPEN_CLOSE'>
): CreateScheduleEventParameter<'OPEN_CLOSE'> {
    return {
        event: {
            cb,
            type: 'OPEN_CLOSE',
            parameter: { type: 'NORMAL', isOpen: false, timer },
        },
    };
}

export function buildOpenCloseDaysEvent(
    days: ScheduleEventOpenCloseParametersDays,
    cb: CreateScheduleEventCallback<'OPEN_CLOSE'>
): CreateScheduleEventParameter<'OPEN_CLOSE'> {
    return {
        event: {
            cb,
            type: 'OPEN_CLOSE',
            parameter: { type: 'DAYS', isOpen: false, timer: { days, indexDay: 'MON' } },
        },
    };
}
