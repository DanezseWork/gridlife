"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Habit } from "@/lib/api";
import {
  addMonths,
  getMonthCalendarDays,
  getTodayKey,
  getYesterdayKey,
  isLoggableHabitDateKey,
  toLocalDateKey,
} from "@/lib/dates";
import { getCellBackground, getDayProgress } from "@/lib/habit-progress";
import { HabitFrequencyBadge } from "@/components/habit-frequency-badge";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface HabitCalendarDialogProps {
  habit: Habit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleDate: (habitId: string, dateKey: string) => void;
}

export function HabitCalendarDialog({
  habit,
  open,
  onOpenChange,
  onToggleDate,
}: HabitCalendarDialogProps) {
  const todayKey = getTodayKey();
  const yesterdayKey = getYesterdayKey();
  const [viewMonth, setViewMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    if (open && habit) {
      const today = new Date();
      setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    }
  }, [open, habit]);

  const monthLabel = viewMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const calendarDays = useMemo(
    () => getMonthCalendarDays(viewMonth),
    [viewMonth],
  );

  const todayProgress = habit ? getDayProgress(habit, todayKey) : null;
  const isDueToday = todayProgress?.due ?? false;

  if (!habit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        style={{
          background: "var(--color-base)",
          color: "var(--color-inverse)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span>{habit.name}</span>
            <HabitFrequencyBadge habit={habit} variant="full" />
          </DialogTitle>
          <p className="text-sm opacity-50">
            {habit.streak > 0
              ? `${habit.streak} streak`
              : habit.targetCount > 1
                ? `${habit.targetCount} taps per session`
                : "Tap today to log this habit"}
            {!isDueToday ? " · not due today" : ""}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg opacity-60 transition-opacity hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium">{monthLabel}</span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg opacity-60 transition-opacity hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs opacity-50">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateKey = toLocalDateKey(day);
              const progress = getDayProgress(habit, dateKey);
              const isToday = dateKey === todayKey;
              const isYesterday = dateKey === yesterdayKey;
              const isFuture = dateKey > todayKey;
              const canToggle = isLoggableHabitDateKey(dateKey) && progress.due;

              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={!canToggle}
                  aria-label={
                    progress.completed
                      ? `${dateKey} completed`
                      : progress.count > 0
                        ? `${dateKey} ${progress.count}/${progress.targetCount}`
                        : isToday
                          ? `Log ${habit.name} for today`
                          : isYesterday
                            ? `Log ${habit.name} for yesterday`
                            : `${dateKey} no progress`
                  }
                  onClick={() => {
                    if (canToggle) onToggleDate(habit.id, dateKey);
                  }}
                  className={cn(
                    "relative flex aspect-square items-center justify-center overflow-hidden rounded-lg text-sm transition-colors",
                    canToggle && "cursor-pointer active:scale-95",
                    !canToggle && "cursor-default",
                    isFuture && "opacity-30",
                  )}
                  style={{
                    background: getCellBackground(
                      habit.color,
                      progress.ratio,
                      progress.due,
                    ),
                    color: progress.completed ? "#fff" : "var(--color-inverse)",
                    ...(isToday && progress.due
                      ? { boxShadow: `0 0 0 2px ${habit.color}` }
                      : {}),
                    ...(isYesterday && progress.due
                      ? {
                          boxShadow: `0 0 0 1px color-mix(in srgb, ${habit.color} 70%, transparent)`,
                        }
                      : {}),
                    ...(!progress.due ? { opacity: 0.35 } : {}),
                  }}
                >
                  <span className="relative z-10">{day.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={!isDueToday}
              onClick={() => onToggleDate(habit.id, todayKey)}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-transform active:scale-95 disabled:opacity-35",
              )}
              style={{
                background: todayProgress?.completed ? habit.color : "transparent",
                borderColor: habit.color,
                color: todayProgress?.completed ? "#fff" : habit.color,
              }}
            >
              {todayProgress?.completed ? (
                <Check className="h-5 w-5" strokeWidth={2.5} />
              ) : todayProgress && todayProgress.count > 0 ? (
                <span className="font-data text-xs font-semibold">
                  {todayProgress.count}/{todayProgress.targetCount}
                </span>
              ) : (
                <Plus className="h-5 w-5" strokeWidth={2.5} />
              )}
            </button>
          </div>

          <p className="text-center text-xs opacity-50">
            {!isDueToday
              ? "This habit is not scheduled for today"
              : todayProgress?.completed
                ? "Completed today — tap to reset"
                : todayProgress && todayProgress.count > 0
                  ? `${todayProgress.count}/${todayProgress.targetCount} taps — keep tapping today`
                  : "Tap today or yesterday in the calendar to log this habit"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
