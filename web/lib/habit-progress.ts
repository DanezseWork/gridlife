import type { Habit } from "@/lib/api";
import { logToDateKey } from "@/lib/dates";
import {
  habitAnchorDateKey,
  isHabitDueOnDate,
  scheduleDaysFromHabit,
} from "@/lib/habit-schedule";

export interface DayProgress {
  count: number;
  targetCount: number;
  ratio: number;
  completed: boolean;
  due: boolean;
  scheduled: boolean;
  skipped: boolean;
  manuallyAdded: boolean;
}

export function getLogForDate(
  habit: Habit,
  dateKey: string,
): Habit["logs"][number] | undefined {
  return habit.logs.find((l) => logToDateKey(l.completedDate) === dateKey);
}

function isScheduledOnDate(habit: Habit, dateKey: string): boolean {
  const scheduleDays = scheduleDaysFromHabit(habit.scheduleDays);
  const anchorDateKey = habitAnchorDateKey(habit.createdAt);
  return isHabitDueOnDate(
    habit.frequency,
    scheduleDays,
    dateKey,
    anchorDateKey,
  );
}

export function getDayProgress(habit: Habit, dateKey: string): DayProgress {
  const targetCount = habit.targetCount;
  const skipped = habit.skippedDates.includes(dateKey);
  const manuallyAdded = habit.manuallyAddedDates.includes(dateKey);
  const scheduled = isScheduledOnDate(habit, dateKey);

  if (!habit.trackingEnabled) {
    const log = getLogForDate(habit, dateKey);
    const count = log?.count ?? 0;
    const ratio = targetCount > 0 ? Math.min(count / targetCount, 1) : 0;

    return {
      count,
      targetCount,
      ratio,
      completed: count >= targetCount,
      due: false,
      scheduled,
      skipped,
      manuallyAdded,
    };
  }

  if (skipped && scheduled) {
    return {
      count: 0,
      targetCount,
      ratio: 0,
      completed: false,
      due: false,
      scheduled,
      skipped: true,
      manuallyAdded: false,
    };
  }

  const due = !skipped && (scheduled || manuallyAdded);

  if (!due) {
    const log = getLogForDate(habit, dateKey);
    const count = log?.count ?? 0;
    const ratio = targetCount > 0 ? Math.min(count / targetCount, 1) : 0;

    return {
      count,
      targetCount,
      ratio,
      completed: count >= targetCount,
      due: false,
      scheduled,
      skipped,
      manuallyAdded,
    };
  }

  const log = getLogForDate(habit, dateKey);
  const count = log?.count ?? 0;
  const ratio = targetCount > 0 ? Math.min(count / targetCount, 1) : 0;

  return {
    count,
    targetCount,
    ratio,
    completed: count >= targetCount,
    due: true,
    scheduled,
    skipped: false,
    manuallyAdded,
  };
}

export function getCellBackground(
  color: string,
  ratio: number,
  due: boolean,
): string {
  if (!due) {
    return "color-mix(in srgb, var(--color-inverse) 5%, transparent)";
  }

  const empty = `color-mix(in srgb, ${color} 24%, transparent)`;
  if (ratio <= 0) return empty;
  if (ratio >= 1) return color;
  return `linear-gradient(to top, ${color} ${ratio * 100}%, ${empty} ${ratio * 100}%)`;
}

export function getSkippedCellBackground(color: string): string {
  return `repeating-linear-gradient(
    -45deg,
    color-mix(in srgb, ${color} 10%, transparent),
    color-mix(in srgb, ${color} 10%, transparent) 3px,
    color-mix(in srgb, var(--color-inverse) 6%, transparent) 3px,
    color-mix(in srgb, var(--color-inverse) 6%, transparent) 7px
  )`;
}

export function getManualCellOutline(color: string): string {
  return `1px dashed color-mix(in srgb, ${color} 55%, transparent)`;
}
