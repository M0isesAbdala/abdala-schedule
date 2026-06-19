import type { Clock, TimerProvider } from "../../Schedule";
export declare class FakeClock implements Clock, TimerProvider {
    private currentTime;
    private pending;
    private nextId;
    constructor(start: Date);
    now(): Date;
    setTimeout(fn: () => void, ms: number): NodeJS.Timeout;
    clearTimeout(id: NodeJS.Timeout): void;
    advance(ms: number): void;
    reset(start: Date): void;
    pendingCount(): number;
}
