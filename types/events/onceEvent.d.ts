import type { Clock, CreateScheduleEvent, ScheduleEvents, ScheduleEventTime, TimerProvider } from "../Schedule";
import { type ScheduleCache } from "../builderSchedule";
export declare function handleOnceEvent(schedule: ScheduleCache, event: ScheduleEvents<"ONCE">, clock: Clock, timer: TimerProvider): ScheduleEvents<"ONCE">;
export declare const createOnceEvent: CreateScheduleEvent<'ONCE', ScheduleEventTime>;
