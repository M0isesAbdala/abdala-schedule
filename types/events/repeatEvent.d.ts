import type { Clock, CreateScheduleEvent, ScheduleEventRepeatParameterDays, ScheduleEvents, ScheduleEventTime, TimerProvider } from "../Schedule";
import { type ScheduleCache } from "../builderSchedule";
export default function handleRepeatEvent(schedule: ScheduleCache, event: ScheduleEvents<'REPEAT'>, clock: Clock, timer: TimerProvider): ScheduleEvents<"REPEAT">;
export declare const createRepeatDaysEvent: CreateScheduleEvent<'REPEAT', ScheduleEventRepeatParameterDays>;
export declare const createRepeatHourEvent: CreateScheduleEvent<'REPEAT', ScheduleEventTime[]>;
