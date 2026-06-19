import type { CreateScheduleEventCallback, CreateScheduleEventParameter, ScheduleEventOpenCloseParametersDays, ScheduleEventOpenCloseTimerParameter, ScheduleEventRepeatParameterDays, ScheduleEventTime } from "../../Schedule";
export declare function buildOnceEvent(time: ScheduleEventTime, cb: CreateScheduleEventCallback<'ONCE'>): CreateScheduleEventParameter<'ONCE'>;
export declare function buildRepeatHourEvent(timer: ScheduleEventTime[], cb: CreateScheduleEventCallback<'REPEAT'>): CreateScheduleEventParameter<'REPEAT'>;
export declare function buildRepeatDaysEvent(days: ScheduleEventRepeatParameterDays, cb: CreateScheduleEventCallback<'REPEAT'>): CreateScheduleEventParameter<'REPEAT'>;
export declare function buildOpenCloseEvent(timer: ScheduleEventOpenCloseTimerParameter, cb: CreateScheduleEventCallback<'OPEN_CLOSE'>): CreateScheduleEventParameter<'OPEN_CLOSE'>;
export declare function buildOpenCloseDaysEvent(days: ScheduleEventOpenCloseParametersDays, cb: CreateScheduleEventCallback<'OPEN_CLOSE'>): CreateScheduleEventParameter<'OPEN_CLOSE'>;
