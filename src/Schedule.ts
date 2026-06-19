export type ScheduleEventTime = {
    d?: number;
    hh: number;
    mm: number;
    ss: number;
}

export type ScheduleEventOnce = {
    time: ScheduleEventTime;
};

export type ScheduleEventParameterType = 'DAYS' | 'NORMAL';

export type ScheduleEventRepeatParameterDays = {
    [K in ScheduleDays]?: ScheduleEventTime[];
}

export type ScheduleEventRepeatParametersDays = {
    indexDay: ScheduleDays;
    days: ScheduleEventRepeatParameterDays;
}

export type ScheduleEventRepeat<T extends ScheduleEventParameterType> = {
    type: T;
    timer: T extends 'DAYS' ? ScheduleEventRepeatParametersDays : ScheduleEventTime[];
    indexTime: number;
};

export type ScheduleEventRepeatUnion = ScheduleEventRepeat<'DAYS'> | ScheduleEventRepeat<'NORMAL'>;

export type ScheduleEventOpenCloseTimerParameter = {
    timeOpen: ScheduleEventTime;
    timeClose: ScheduleEventTime;
};

export type ScheduleEventOpenCloseParametersDays = {
    [K in ScheduleDays]?: ScheduleEventOpenCloseTimerParameter
};

export type ScheduleEventOpenCloseParameterDays = {
    indexDay: ScheduleDays;
    days: ScheduleEventOpenCloseParametersDays;
};

export type ScheduleEventOpenCloseParameter<T extends ScheduleEventParameterType> = {
    type: T;
    isOpen: boolean;
    timer: T extends 'DAYS' ? ScheduleEventOpenCloseParameterDays : ScheduleEventOpenCloseTimerParameter;
}

export type ScheduleEventOpenCloseParameterUnion = ScheduleEventOpenCloseParameter<'DAYS'> | ScheduleEventOpenCloseParameter<'NORMAL'>;

export type ScheduleEventOpenClose = ScheduleEventOpenCloseParameterUnion;

export type ClientScheduleEvents<T extends ScheduleEventType> = {
    type: T;
    parameter: T extends 'OPEN_CLOSE' ? ScheduleEventOpenClose : T extends 'REPEAT' ? ScheduleEventRepeatUnion : ScheduleEventOnce;
};

export type ClientScheduleEventsUnion = ClientScheduleEvents<'ONCE'> | ClientScheduleEvents<'OPEN_CLOSE'> | ClientScheduleEvents<'REPEAT'>;

export type ScheduleEvents<T extends ScheduleEventType> = ClientScheduleEvents<T> & {
    id: number;
    cb: CreateScheduleEventCallback<T>;
};

export type ScheduleEventsUnion = ScheduleEvents<'ONCE'> | ScheduleEvents<'OPEN_CLOSE'> | ScheduleEvents<'REPEAT'>;

export type ScheduleEvent = {
    time: ScheduleEventTime;
    events: ScheduleEventsUnion[];
};

export type Schedule = {
    eventTimeout: NodeJS.Timeout;
    events: ScheduleEventsUnion[];
};

export type ScheduleEventType = 'ONCE' | 'REPEAT' | 'OPEN_CLOSE';

export type ScheduleDays = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';

export type CreateScheduleEventCallbackParameter<T extends ScheduleEventType> = Omit<ScheduleEvents<T>, 'cb'>;

export type CreateScheduleEventCallback<T extends ScheduleEventType> = (args: CreateScheduleEventCallbackParameter<T>) => void;

export type CreateScheduleEventParameter<T extends ScheduleEventType> = {
    event: Omit<ScheduleEvents<T>, 'id'>;
};

export type CreateScheduleEventParameterUnion = CreateScheduleEventParameter<'ONCE'> | CreateScheduleEventParameter<'OPEN_CLOSE'> | CreateScheduleEventParameter<'REPEAT'>;

export type CreateScheduleEvent<T extends ScheduleEventType, K> = (parameter: K, cb: CreateScheduleEventCallback<T>) => CreateScheduleEventParameter<T> | null;

export type ScheduleListEvent = {
    date: ScheduleEventTime;
    ids: number[];
};

export type CreateSchedule = {
    addService: (event: CreateScheduleEventParameterUnion | null) => ScheduleEventsUnion | null;
    removeService: (id: number) => void;
    listEvents: () => ScheduleListEvent[];
    gracefulShutdown: () => void;
}

export interface Clock {
    now(): Date;
}

export interface TimerProvider {
    setTimeout(fn: () => void, ms: number): NodeJS.Timeout;
    clearTimeout(id: NodeJS.Timeout): void;
}