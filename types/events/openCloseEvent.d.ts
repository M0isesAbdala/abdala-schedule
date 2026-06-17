import type { CreateScheduleEvent, ScheduleEventOpenCloseParametersDays, ScheduleEventOpenCloseTimerParameter, ScheduleEvents } from "../Schedule";
import { type ScheduleCache } from "../builderSchedule";
export default function handleOpenCloseEvent(schedule: ScheduleCache, event: ScheduleEvents<'OPEN_CLOSE'>): ScheduleEvents<"OPEN_CLOSE">;
export declare const createOpenCloseDaysEvent: CreateScheduleEvent<'OPEN_CLOSE', ScheduleEventOpenCloseParametersDays>;
export declare const createOpenCloseEvent: CreateScheduleEvent<'OPEN_CLOSE', ScheduleEventOpenCloseTimerParameter>;
