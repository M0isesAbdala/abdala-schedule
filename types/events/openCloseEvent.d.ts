import type { Clock, CreateScheduleEvent, ScheduleEventOpenCloseParametersDays, ScheduleEventOpenCloseTimerParameter, ScheduleEvents, TimerProvider } from "../Schedule";
import { type ScheduleCache } from "../builderSchedule";
export default function handleOpenCloseEvent(schedule: ScheduleCache, event: ScheduleEvents<'OPEN_CLOSE'>, clock: Clock, timer: TimerProvider, fromTimer?: boolean): ScheduleEvents<"OPEN_CLOSE">;
export declare const createOpenCloseDaysEvent: CreateScheduleEvent<'OPEN_CLOSE', ScheduleEventOpenCloseParametersDays>;
export declare const createOpenCloseEvent: CreateScheduleEvent<'OPEN_CLOSE', ScheduleEventOpenCloseTimerParameter>;
