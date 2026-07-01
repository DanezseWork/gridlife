"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, EyeOff, Plus } from "lucide-react";
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
import {
  getCellBackground,
  getDayProgress,
  getManualCellOutline,
  getSkippedCellBackground,
} from "@/lib/habit-progress";
import { HabitFrequencyBadge } from "@/components/habit-frequency-badge";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface HabitCalendarDialogProps {
  habit: Habit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleDate: (habitId: string, dateKey: string) => void;
  onSkipDate: (habitId: string, dateKey: string) => void;
  onRestoreDate: (habitId: string, dateKey: string) => void;
  onTrackToday: (habitId: string) => void;
}

export function HabitCalendarDialog({
  habit,
  open,
  onOpenChange,
  onToggleDate,
  onSkipDate,
  onRestoreDate,
  onTrackToday,
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
  const isTracking = habit?.trackingEnabled ?? true;
  const isOnTasksToday = todayProgress?.due ?? false;

  if (!habit) return null;

  function handleDayAction(dateKey: string) {
    const progress = getDayProgress(habit!, dateKey);
    const isFutureOrToday = dateKey >= todayKey;
    const canLog = isTracking && isLoggableHabitDateKey(dateKey) && progress.due;

    if (canLog) {
      onToggleDate(habit!.id, dateKey);
      return;
    }

    if (
      progress.skipped &&
      progress.scheduled &&
      isFutureOrToday &&
      isTracking
    ) {
      onRestoreDate(habit!.id, dateKey);
      return;
    }

    if (progress.due && dateKey > todayKey && isTracking) {
      onSkipDate(habit!.id, dateKey);
    }
  }

  function dayAriaLabel(dateKey: string, progress: ReturnType<typeof getDayProgress>) {
    if (progress.skipped && progress.scheduled) {
      return dateKey >= todayKey
        ? `${dateKey} skipped — tap to restore to tasks`
        : `${dateKey} skipped`;
    }

    if (progress.due && dateKey > todayKey) {
      return `${dateKey} on tasks — tap to remove from that day`;
    }

    if (progress.completed) {
      return `${dateKey} completed`;
    }

    if (progress.count > 0) {
      return `${dateKey} ${progress.count}/${progress.targetCount}`;
    }

    if (progress.due && dateKey === todayKey) {
      return `Log ${habit!.name} for today`;
    }

    if (progress.due && dateKey === yesterdayKey) {
      return `Log ${habit!.name} for yesterday`;
    }

    if (progress.manuallyAdded && !progress.scheduled) {
      return `${dateKey} manually added to tasks`;
    }

    return `${dateKey} no progress`;
  }

  function isDayInteractive(dateKey: string, progress: ReturnType<typeof getDayProgress>) {
    if (!isTracking || dateKey < todayKey) return false;

    if (progress.due && isLoggableHabitDateKey(dateKey)) return true;
    if (progress.skipped && progress.scheduled) return true;
    if (progress.due && dateKey > todayKey) return true;

    return false;
  }

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
            {!isTracking
              ? "Tracking paused — turn tracking back on to show on tasks"
              : todayProgress?.skipped && todayProgress.scheduled
                ? "Skipped today — removed from today's task list"
                : todayProgress?.due && todayProgress.manuallyAdded && !todayProgress.scheduled
                  ? "Added to today's tasks from the Tasks page"
                  : habit.streak > 0
                    ? `${habit.streak} streak`
                    : habit.targetCount > 1
                      ? `${habit.targetCount} taps per session`
                      : "Tracked habits appear on your Tasks page"}
            {isTracking && todayProgress?.due && !todayProgress.skipped ? " · on tasks today" : ""}
            {isTracking && !todayProgress?.due && todayProgress?.scheduled && !todayProgress?.skipped
              ? " · not on tasks today"
              : ""}
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
              const isSkipped = progress.skipped && progress.scheduled;
              const interactive = isDayInteractive(dateKey, progress);

              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={!interactive}
                  aria-label={dayAriaLabel(dateKey, progress)}
                  onClick={() => handleDayAction(dateKey)}
                  className={cn(
                    "relative flex aspect-square items-center justify-center overflow-hidden rounded-lg text-sm transition-colors",
                    interactive && "cursor-pointer active:scale-95",
                    !interactive && "cursor-default",
                    isFuture && !progress.due && !isSkipped && "opacity-30",
                  )}
                  style={{
                    background: isSkipped
                      ? getSkippedCellBackground(habit.color)
                      : getCellBackground(habit.color, progress.ratio, progress.due),
                    color: progress.completed ? "#fff" : "var(--color-inverse)",
                    ...(progress.manuallyAdded &&
                    !progress.scheduled &&
                    isTracking
                      ? { outline: getManualCellOutline(habit.color) }
                      : {}),
                    ...(isToday && progress.due
                      ? { boxShadow: `0 0 0 2px ${habit.color}` }
                      : {}),
                    ...(isYesterday && progress.due
                      ? {
                          boxShadow: `0 0 0 1px color-mix(in srgb, ${habit.color} 70%, transparent)`,
                        }
                      : {}),
                    ...(!progress.due && !isSkipped ? { opacity: 0.35 } : {}),
                  }}
                >
                  <span className="relative z-10">{day.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {todayProgress?.due && isTracking && (
              <button
                type="button"
                disabled={!todayProgress.due}
                onClick={() => onToggleDate(habit.id, todayKey)}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-transform active:scale-95 disabled:opacity-35",
                )}
                style={{
                  background: todayProgress.completed ? habit.color : "transparent",
                  borderColor: habit.color,
                  color: todayProgress.completed ? "#fff" : habit.color,
                }}
              >
                {todayProgress.completed ? (
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                ) : todayProgress.count > 0 ? (
                  <span className="font-data text-xs font-semibold">
                    {todayProgress.count}/{todayProgress.targetCount}
                  </span>
                ) : (
                  <Plus className="h-5 w-5" strokeWidth={2.5} />
                )}
              </button>
            )}

            {isTracking && todayProgress?.due && (
              <button
                type="button"
                aria-label="Remove from today's tasks"
                title="Remove from today's tasks"
                onClick={() => onSkipDate(habit.id, todayKey)}
                className="flex h-12 w-12 items-center justify-center rounded-xl border opacity-70 transition-transform hover:opacity-100 active:scale-95"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--color-inverse) 20%, transparent)",
                }}
              >
                <EyeOff className="h-5 w-5" />
              </button>
            )}

            {isTracking && !isOnTasksToday && (
              <button
                type="button"
                aria-label="Track today"
                onClick={() => onTrackToday(habit.id)}
                className="flex h-12 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-transform active:scale-95"
                style={{
                  background: `color-mix(in srgb, ${habit.color} 16%, var(--color-base))`,
                  border: `1px solid color-mix(in srgb, ${habit.color} 40%, transparent)`,
                  color: habit.color,
                }}
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Track today
              </button>
            )}
          </div>

          <p className="text-center text-xs opacity-50">
            {!isTracking
              ? "Tracking is paused for this habit"
              : !isOnTasksToday
                ? todayProgress?.skipped && todayProgress.scheduled
                  ? "Not on today's tasks — tap Track today to add it back"
                  : "Not on today's tasks — tap Track today to add it for today"
                : todayProgress?.completed
                  ? "Completed today — tap to reset"
                  : todayProgress && todayProgress.count > 0
                    ? `${todayProgress.count}/${todayProgress.targetCount} taps — keep tapping today`
                    : "Tap today or yesterday to log · use Tasks to add this habit on other days"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
