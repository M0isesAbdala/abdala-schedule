import type { CreateScheduleEvent, ScheduleEventRepeatParameterDays, ScheduleEvents, ScheduleEventTime } from "../Schedule";
import { type ScheduleCache } from "../builderSchedule";
export default function handleRepeatEvent(schedule: ScheduleCache, event: ScheduleEvents<'REPEAT'>): ScheduleEvents<"REPEAT">;
export declare const createRepeatDaysEvent: CreateScheduleEvent<'REPEAT', ScheduleEventRepeatParameterDays>;
export declare const createRepeatHourEvent: CreateScheduleEvent<'REPEAT', ScheduleEventTime[]>;
