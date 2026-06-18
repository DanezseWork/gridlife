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
}

export function getLogForDate(
  habit: Habit,
  dateKey: string,
): Habit["logs"][number] | undefined {
  return habit.logs.find((l) => logToDateKey(l.completedDate) === dateKey);
}

export function getDayProgress(habit: Habit, dateKey: string): DayProgress {
  const scheduleDays = scheduleDaysFromHabit(habit.scheduleDays);
  const anchorDateKey = habitAnchorDateKey(habit.createdAt);
  const due = isHabitDueOnDate(
    habit.frequency,
    scheduleDays,
    dateKey,
    anchorDateKey,
  );

  if (!due) {
    return {
      count: 0,
      targetCount: habit.targetCount,
      ratio: 0,
      completed: false,
      due: false,
    };
  }

  const log = getLogForDate(habit, dateKey);
  const count = log?.count ?? 0;
  const targetCount = habit.targetCount;
  const ratio = targetCount > 0 ? Math.min(count / targetCount, 1) : 0;

  return {
    count,
    targetCount,
    ratio,
    completed: count >= targetCount,
    due: true,
  };
}

export function getCellBackground(color: string, ratio: number, due: boolean): string {
  if (!due) {
    return "color-mix(in srgb, var(--color-inverse) 5%, transparent)";
  }

  const empty = `color-mix(in srgb, ${color} 24%, transparent)`;
  if (ratio <= 0) return empty;
  if (ratio >= 1) return color;
  return `linear-gradient(to top, ${color} ${ratio * 100}%, ${empty} ${ratio * 100}%)`;
}

export function getOffDayCellBackground(): string {
  return "color-mix(in srgb, var(--color-inverse) 5%, transparent)";
}
