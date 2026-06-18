"use client";

import type { Habit } from "@/lib/api";
import {
  getHabitFrequencyLabel,
  getHabitFrequencyShortLabel,
  scheduleDaysFromHabit,
} from "@/lib/habit-schedule";
import { cn } from "@/lib/utils";

interface HabitFrequencyBadgeProps {
  habit: Habit;
  className?: string;
  variant?: "short" | "full";
}

export function HabitFrequencyBadge({
  habit,
  className,
  variant = "short",
}: HabitFrequencyBadgeProps) {
  const scheduleDays = scheduleDaysFromHabit(habit.scheduleDays);
  const label =
    variant === "full"
      ? habit.scheduleSummary
      : habit.frequency === "daily"
        ? getHabitFrequencyLabel(habit.frequency)
        : getHabitFrequencyShortLabel(habit.frequency, scheduleDays);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide sm:text-xs",
        className,
      )}
      style={{
        background: `color-mix(in srgb, ${habit.color} 16%, var(--color-base))`,
        color: habit.color,
        border: `1px solid color-mix(in srgb, ${habit.color} 35%, transparent)`,
      }}
      title={habit.scheduleSummary}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}
