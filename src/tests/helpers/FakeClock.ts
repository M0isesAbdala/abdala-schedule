import type { Clock, TimerProvider } from "../../Schedule";

export class FakeClock implements Clock, TimerProvider {
    private currentTime: number;
    private pending: Array<{ id: number; fireAt: number; fn: () => void }> = [];
    private nextId = 1;

    constructor(start: Date) {
        this.currentTime = start.getTime();
    }

    now(): Date {
        return new Date(this.currentTime);
    }

    setTimeout(fn: () => void, ms: number): NodeJS.Timeout {
        const id = this.nextId++;
        this.pending.push({ id, fireAt: this.currentTime + ms, fn });
        this.pending.sort((a, b) => a.fireAt - b.fireAt);
        return id as unknown as NodeJS.Timeout;
    }

    clearTimeout(id: NodeJS.Timeout): void {
        this.pending = this.pending.filter(t => t.id !== (id as unknown as number));
    }

    advance(ms: number): void {
        const target = this.currentTime + ms;
        while (this.pending.length > 0 && this.pending[0]!.fireAt <= target) {
            const next = this.pending.shift()!;
            this.currentTime = next.fireAt;
            next.fn();
            this.pending.sort((a, b) => a.fireAt - b.fireAt);
        }
        this.currentTime = target;
    }

    reset(start: Date): void {
        this.currentTime = start.getTime();
        this.pending = [];
        this.nextId = 1;
    }

    pendingCount(): number {
        return this.pending.length;
    }
}
