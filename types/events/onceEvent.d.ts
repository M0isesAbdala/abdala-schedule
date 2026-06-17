import type { CreateScheduleEvent, ScheduleEvents, ScheduleEventTime } from "../Schedule";
import { type ScheduleCache } from "../builderSchedule";
export declare function handleOnceEvent(schedule: ScheduleCache, event: ScheduleEvents<"ONCE">): ScheduleEvents<"ONCE">;
export declare const createOnceEvent: CreateScheduleEvent<'ONCE', ScheduleEventTime>;
