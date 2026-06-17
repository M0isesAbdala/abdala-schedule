# abdala-schedule

A lightweight, dependency-free TypeScript scheduler for Node.js and Bun. It fires callbacks at precise wall-clock times using `setTimeout` internally, supports one-shot and recurring schedules, and models open/close windows (e.g., business hours) as a built-in event type.

---

## Features

- **One-shot events** — fire a callback once at a specific time.
- **Repeating events** — fire at a fixed list of times every day, or at specific times on specific days of the week.
- **Open/close events** — alternate between "open" and "close" callbacks on a daily schedule or per day-of-week.
- Zero runtime dependencies.
- Dual ESM/CJS build with full TypeScript declarations.
- Works with Bun and Node.js.

---

## Installation

```bash
# Bun
bun add abdala-schedule

# npm
npm install abdala-schedule
```

---

## Quick Start

```ts
import { createSchedule, createOnceEvent, createRepeatHourEvent } from 'abdala-schedule';

const scheduler = createSchedule();

// Fire once at 14:30:00 today
const onceEvt = createOnceEvent({ hh: 14, mm: 30, ss: 0 }, (event) => {
  console.log('Fired once, id:', event.id);
});
scheduler.addService(onceEvt);

// Fire every day at 08:00 and 18:00
const repeatEvt = createRepeatHourEvent(
  [{ hh: 8, mm: 0, ss: 0 }, { hh: 18, mm: 0, ss: 0 }],
  (event) => {
    console.log('Repeating event fired, id:', event.id);
  }
);
const registered = scheduler.addService(repeatEvt);
console.log('Registered with id:', registered?.id);

// On exit, cancel all timers
process.on('SIGTERM', () => scheduler.gracefulShutdown());
```

---

## Architecture Overview

```
createSchedule()
└── internal Map<Date, Schedule>    ← one entry per distinct fire time
      └── Schedule
            ├── eventTimeout        ← setTimeout handle
            └── events[]            ← events that share this fire time

createXxxEvent(params, cb)          ← factory: validates params, returns wrapper or null
    └── addService(wrapper)         ← registers the event, assigns an auto-incremented id
          └── handler (once/repeat/openClose)
                └── createEvent()   ← sets the setTimeout; reschedules REPEAT/OPEN_CLOSE after firing
```

When a scheduled moment arrives, the `setTimeout` fires, iterates every event sharing that slot, calls each callback, then re-schedules `REPEAT` and `OPEN_CLOSE` events for their next occurrence. `ONCE` events are not rescheduled.

---

## Core Types

### `ScheduleEventTime`

Represents a point in time within the current month.

```ts
type ScheduleEventTime = {
  d?: number;  // Day of month (1–31). Defaults to today if omitted.
  hh: number;  // Hours   (0–23)
  mm: number;  // Minutes (0–59)
  ss: number;  // Seconds (0–59)
};
```

> **Constraint:** There is no `month` or `year` field. All times are interpreted in the context of the current month and year. Setting `d` to a day in a past month is not supported.

---

### `ScheduleDays`

```ts
type ScheduleDays = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';
```

---

## Event Factories

All factory functions return `CreateScheduleEventParameter<T> | null`. A `null` return means the input was invalid or the scheduled time has already passed. Pass the return value directly to `addService`.

---

### `createOnceEvent`

Fires the callback **once** at the specified time. Silently returns `null` if the time has already passed.

```ts
function createOnceEvent(
  time: ScheduleEventTime,
  cb: (event: ScheduleEvents<'ONCE'>) => void
): CreateScheduleEventParameter<'ONCE'> | null
```

**Returns `null` when:** `now > scheduledTime`.

**Does not reschedule** after firing.

**Example:**

```ts
import { createSchedule, createOnceEvent } from 'abdala-schedule';

const scheduler = createSchedule();

// Fire at 09:00:00 on the 25th of this month
const evt = createOnceEvent({ d: 25, hh: 9, mm: 0, ss: 0 }, (event) => {
  console.log('Ran once at 09:00 on the 25th. Event id:', event.id);
});

scheduler.addService(evt); // null if the 25th has already passed
```

---

### `createRepeatHourEvent`

Fires at each time in the provided array, **every day**, cycling indefinitely.

```ts
function createRepeatHourEvent(
  timer: ScheduleEventTime[],
  cb: (event: ScheduleEvents<'REPEAT'>) => void
): CreateScheduleEventParameter<'REPEAT'> | null
```

**Returns `null` when:** `timer` is an empty array.

**Scheduling logic (inferred from source):**
1. On registration (and after each firing), finds the earliest time in `timer` that is still in the future today.
2. If no time remains today, schedules the earliest entry in `timer` for tomorrow.
3. Repeats indefinitely.

The `d` field inside each `ScheduleEventTime` entry is not meaningful here and should be omitted.

**Example — fire at 07:00, 12:00, and 20:00 every day:**

```ts
import { createSchedule, createRepeatHourEvent } from 'abdala-schedule';

const scheduler = createSchedule();

const evt = createRepeatHourEvent(
  [
    { hh: 7,  mm: 0, ss: 0 },
    { hh: 12, mm: 0, ss: 0 },
    { hh: 20, mm: 0, ss: 0 },
  ],
  (event) => {
    console.log('Repeat fired at', new Date(), 'id:', event.id);
  }
);

scheduler.addService(evt);
```

---

### `createRepeatDaysEvent`

Fires at specific times **on specific days of the week**, cycling indefinitely.

```ts
function createRepeatDaysEvent(
  days: ScheduleEventRepeatParameterDays,
  cb: (event: ScheduleEvents<'REPEAT'>) => void
): CreateScheduleEventParameter<'REPEAT'> | null

type ScheduleEventRepeatParameterDays = {
  [K in ScheduleDays]?: ScheduleEventTime[];
};
```

**Returns `null` when:** `days` is an empty object.

Each key is a day abbreviation; its value is the list of times to fire on that day. Days not present in the object are skipped entirely.

**Scheduling logic (inferred from source):** Searches forward from the current moment through the current and following days (up to 8 days ahead) to find the next scheduled day+time combination.

**Example — fire at 09:00 on weekdays and at 11:00 on weekends:**

```ts
import { createSchedule, createRepeatDaysEvent } from 'abdala-schedule';

const scheduler = createSchedule();

const evt = createRepeatDaysEvent(
  {
    MON: [{ hh: 9, mm: 0, ss: 0 }],
    TUE: [{ hh: 9, mm: 0, ss: 0 }],
    WED: [{ hh: 9, mm: 0, ss: 0 }],
    THU: [{ hh: 9, mm: 0, ss: 0 }],
    FRI: [{ hh: 9, mm: 0, ss: 0 }],
    SAT: [{ hh: 11, mm: 0, ss: 0 }],
    SUN: [{ hh: 11, mm: 0, ss: 0 }],
  },
  (event) => {
    console.log('Weekday/weekend event fired, id:', event.id);
  }
);

scheduler.addService(evt);
```

---

### `createOpenCloseEvent`

Models a **daily open/close window**. The callback alternates between an "open" firing and a "close" firing indefinitely.

```ts
function createOpenCloseEvent(
  timer: ScheduleEventOpenCloseTimerParameter,
  cb: (event: ScheduleEvents<'OPEN_CLOSE'>) => void
): CreateScheduleEventParameter<'OPEN_CLOSE'> | null

type ScheduleEventOpenCloseTimerParameter = {
  timeOpen:  ScheduleEventTime;
  timeClose: ScheduleEventTime;
};
```

**Always returns a non-null value** (no validation on this factory).

**Callback behavior:**
- When `timeOpen` fires → `event.parameter.isOpen === true`
- When `timeClose` fires → `event.parameter.isOpen === false`

Use `event.parameter.isOpen` inside the callback to distinguish between the two cases.

**Scheduling logic (inferred from source):**
- Starts in the closed state; the first scheduled event is `timeOpen`.
- If `timeOpen` (or `timeClose`) has already passed today when the event is registered, it is automatically rolled over to the next day.
- After each firing, the complementary event (open→close or close→open) is scheduled.

**Example — store open 09:00–18:00 every day:**

```ts
import { createSchedule, createOpenCloseEvent } from 'abdala-schedule';

const scheduler = createSchedule();

const evt = createOpenCloseEvent(
  {
    timeOpen:  { hh: 9,  mm: 0, ss: 0 },
    timeClose: { hh: 18, mm: 0, ss: 0 },
  },
  (event) => {
    if (event.parameter.isOpen) {
      console.log('Store is now OPEN');
    } else {
      console.log('Store is now CLOSED');
    }
  }
);

scheduler.addService(evt);
```

---

### `createOpenCloseDaysEvent`

Models an open/close window with **different hours per day of the week**.

```ts
function createOpenCloseDaysEvent(
  days: ScheduleEventOpenCloseParametersDays,
  cb: (event: ScheduleEvents<'OPEN_CLOSE'>) => void
): CreateScheduleEventParameter<'OPEN_CLOSE'> | null

type ScheduleEventOpenCloseParametersDays = {
  [K in ScheduleDays]?: {
    timeOpen:  ScheduleEventTime;
    timeClose: ScheduleEventTime;
  };
};
```

**Returns `null` when:** `days` is an empty object.

Days not present in the object are treated as closed (skipped entirely).

**Example — Monday–Friday 08:00–17:00, Saturday 10:00–14:00, Sunday closed:**

```ts
import { createSchedule, createOpenCloseDaysEvent } from 'abdala-schedule';

const scheduler = createSchedule();

const evt = createOpenCloseDaysEvent(
  {
    MON: { timeOpen: { hh: 8, mm: 0, ss: 0 }, timeClose: { hh: 17, mm: 0, ss: 0 } },
    TUE: { timeOpen: { hh: 8, mm: 0, ss: 0 }, timeClose: { hh: 17, mm: 0, ss: 0 } },
    WED: { timeOpen: { hh: 8, mm: 0, ss: 0 }, timeClose: { hh: 17, mm: 0, ss: 0 } },
    THU: { timeOpen: { hh: 8, mm: 0, ss: 0 }, timeClose: { hh: 17, mm: 0, ss: 0 } },
    FRI: { timeOpen: { hh: 8, mm: 0, ss: 0 }, timeClose: { hh: 17, mm: 0, ss: 0 } },
    SAT: { timeOpen: { hh: 10, mm: 0, ss: 0 }, timeClose: { hh: 14, mm: 0, ss: 0 } },
  },
  (event) => {
    const state = event.parameter.isOpen ? 'OPEN' : 'CLOSED';
    console.log(`Office is now ${state}`);
  }
);

scheduler.addService(evt);
```

---

## Scheduler Instance — `createSchedule()`

```ts
const scheduler = createSchedule();
```

Returns a `CreateSchedule` object with four methods.

---

### `addService(event)`

```ts
addService(event: CreateScheduleEventParameterUnion | null): ScheduleEventsUnion | null
```

Registers an event. Assigns a unique auto-incremented integer `id` to it. Returns the registered event object (with its `id`) or `null` if the input is `null`.

```ts
const registered = scheduler.addService(createOnceEvent(...));
if (registered) {
  console.log('Registered with id:', registered.id);
}
```

Passing `null` is safe — it returns `null` without throwing.

---

### `removeService(id)`

```ts
removeService(id: number): void
```

Cancels a registered event by its `id`. If the removed event is of type `OPEN_CLOSE` and is currently in the open state (`parameter.isOpen === true`), the callback is invoked once before removal so the caller can clean up. If the `id` is not found, the call is a no-op.

Internally, if removing an event leaves a time slot with no remaining events, the corresponding `setTimeout` is cleared.

```ts
const evt = scheduler.addService(createRepeatHourEvent([{ hh: 10, mm: 0, ss: 0 }], cb));
if (evt) {
  // later…
  scheduler.removeService(evt.id);
}
```

---

### `listEvents()`

```ts
listEvents(): ScheduleListEvent[]

type ScheduleListEvent = {
  date: ScheduleEventTime; // { d, hh, mm, ss } of the next scheduled fire time
  ids:  number[];          // ids of all events scheduled at that moment
};
```

Returns one entry per distinct pending fire time. Useful for debugging or displaying the queue.

```ts
console.log(scheduler.listEvents());
// [
//   { date: { d: 17, hh: 8, mm: 0, ss: 0 }, ids: [1, 3] },
//   { date: { d: 17, hh: 18, mm: 0, ss: 0 }, ids: [2] },
// ]
```

---

### `gracefulShutdown()`

```ts
gracefulShutdown(): void
```

Cancels all active `setTimeout` handles and clears the internal event map. For every `OPEN_CLOSE` event with `parameter.isOpen === true`, the callback is called once before the timer is cancelled (same behaviour as `removeService`). No further events fire after this call.

Intended to be called on process exit:

```ts
process.on('SIGTERM', () => scheduler.gracefulShutdown());
process.on('SIGINT',  () => scheduler.gracefulShutdown());
```

---

## Complete Usage Examples

### Example 1 — Daily backup at 02:00

```ts
import { createSchedule, createRepeatHourEvent } from 'abdala-schedule';

const scheduler = createSchedule();

scheduler.addService(
  createRepeatHourEvent([{ hh: 2, mm: 0, ss: 0 }], async (event) => {
    console.log('Starting backup…', new Date());
    await runBackup();
  })
);
```

---

### Example 2 — One-time reminder on the 30th at 16:00

```ts
import { createSchedule, createOnceEvent } from 'abdala-schedule';

const scheduler = createSchedule();

const reminder = createOnceEvent({ d: 30, hh: 16, mm: 0, ss: 0 }, () => {
  sendNotification('Monthly report due tomorrow!');
});

if (!scheduler.addService(reminder)) {
  console.warn('Reminder time has already passed this month.');
}
```

---

### Example 3 — Business hours with open/close callbacks

```ts
import { createSchedule, createOpenCloseDaysEvent } from 'abdala-schedule';

const scheduler = createSchedule();

scheduler.addService(
  createOpenCloseDaysEvent(
    {
      MON: { timeOpen: { hh: 9, mm: 0, ss: 0 }, timeClose: { hh: 18, mm: 0, ss: 0 } },
      TUE: { timeOpen: { hh: 9, mm: 0, ss: 0 }, timeClose: { hh: 18, mm: 0, ss: 0 } },
      WED: { timeOpen: { hh: 9, mm: 0, ss: 0 }, timeClose: { hh: 18, mm: 0, ss: 0 } },
      THU: { timeOpen: { hh: 9, mm: 0, ss: 0 }, timeClose: { hh: 18, mm: 0, ss: 0 } },
      FRI: { timeOpen: { hh: 9, mm: 0, ss: 0 }, timeClose: { hh: 17, mm: 0, ss: 0 } },
    },
    (event) => {
      if (event.parameter.isOpen) {
        startAcceptingOrders();
      } else {
        stopAcceptingOrders();
      }
    }
  )
);

process.on('SIGTERM', () => scheduler.gracefulShutdown());
```

---

### Example 4 — Multiple independent schedulers

```ts
const billingScheduler = createSchedule();
const reportScheduler  = createSchedule();

billingScheduler.addService(createRepeatHourEvent([{ hh: 0, mm: 0, ss: 0 }], runBilling));
reportScheduler.addService(createRepeatDaysEvent({ MON: [{ hh: 8, mm: 0, ss: 0 }] }, sendWeeklyReport));

process.on('SIGTERM', () => {
  billingScheduler.gracefulShutdown();
  reportScheduler.gracefulShutdown();
});
```

---

## Scheduling Behavior

| Event type | Reschedules after firing | First fire |
|---|---|---|
| `ONCE` | No | At the specified time |
| `REPEAT / NORMAL` | Yes — next matching time today, or first time tomorrow | Next future time in `timer[]` |
| `REPEAT / DAYS` | Yes — next matching day+time within the next 8 days | Next future day+time in `days` |
| `OPEN_CLOSE / NORMAL` | Yes — alternates open↔close daily | Next `timeOpen` (or tomorrow if passed) |
| `OPEN_CLOSE / DAYS` | Yes — alternates open↔close per day schedule | Next `timeOpen` on the next configured day |

**Timing precision:** All scheduling uses `setTimeout` with millisecond precision. The minimum scheduling granularity is 1 second because `ScheduleEventTime` has no sub-second field.

**Multiple events at the same time:** If two or more events share an exact fire time, they are batched into a single `setTimeout` and all callbacks fire in the order they were added.

**Time interpretation:** `ScheduleEventTime` is always resolved against the current year and month. The `d` field is the calendar day of the current month. There is no cross-month or cross-year scheduling.

---

## Error Handling and Validation

| Situation | Result |
|---|---|
| `createOnceEvent` called with a time in the past | Returns `null` |
| `createRepeatHourEvent` called with `[]` | Returns `null` |
| `createRepeatDaysEvent` called with `{}` | Returns `null` |
| `createOpenCloseDaysEvent` called with `{}` | Returns `null` |
| `createOpenCloseEvent` called with any input | Never returns `null` |
| `addService(null)` | Returns `null` safely |
| `removeService` called with an unknown id | Silent no-op |
| `gracefulShutdown` called when no events are registered | Safe no-op |

All factory functions that can fail return `null`; there are no thrown exceptions for invalid inputs.

---

## Troubleshooting

**`addService` returns `null` even though I passed a factory result.**

The factory itself returned `null`. This happens when:
- The scheduled time for a `ONCE` event has already passed.
- An empty array was passed to `createRepeatHourEvent`.
- An empty object was passed to `createRepeatDaysEvent` or `createOpenCloseDaysEvent`.

Check the factory return value before calling `addService`:
```ts
const evt = createOnceEvent({ hh: 10, mm: 0, ss: 0 }, cb);
if (!evt) console.error('Time already passed');
```

---

**My `ONCE` event never fires.**

Verify that `now < scheduledTime` when `addService` is called. The check is performed at factory time, not at `addService` time. If the process starts at 10:01 and you schedule for 10:00, the event is silently dropped.

---

**My `OPEN_CLOSE` event fires the close callback at startup.**

`gracefulShutdown` or `removeService` fires the callback for open/close events in the state `isOpen === true`. This happens when the internal state indicates the event is pending its next "open" fire. If you observe an unexpected callback at startup, verify that `gracefulShutdown` was not called accidentally before the scheduler was fully initialised.

---

**My `createRepeatDaysEvent` event seems to skip a day.**

The look-ahead window is capped at 8 days (inferred from source). If the current day is not in `days` and no future day within 8 days is configured, the scheduling may stall. Ensure at least one day is always reachable from any day of the week.

---

**Times in `ScheduleEventTime` reference the wrong month.**

The scheduler resolves all times against the current year and month at the moment the event fires or reschedules. The `d` field is a day-of-month, not a fixed calendar date. Events that span a month boundary are not supported.

---

## Development

```bash
bun install          # install dependencies
bun run start        # run src/index.ts directly (no build step)
bun run build        # emit .d.ts via tsc, then bundle to dist/ (ESM + CJS)
```

The build produces:
- `dist/index.js` — ESM bundle (minified)
- `dist/index.cjs` — CJS bundle (minified)
- `types/` — TypeScript declaration files

This project was bootstrapped with `bun init` (Bun v1.2.17).
