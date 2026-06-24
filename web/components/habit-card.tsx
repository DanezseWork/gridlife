"use client";

import { useMemo, type HTMLAttributes } from "react";
import { Check, GripVertical, Pencil, Plus } from "lucide-react";
import { HabitFrequencyBadge } from "@/components/habit-frequency-badge";
import { ToggleSwitch } from "@/components/toggle-switch";
import type { Habit } from "@/lib/api";
import { getTodayKey } from "@/lib/dates";
import { getHabitIconComponent } from "@/lib/habit-icons";
import { getCellBackground, getDayProgress } from "@/lib/habit-progress";
import { cn } from "@/lib/utils";

interface HabitCardProps {
  habit: Habit;
  weeks: string[][];
  weekCount: number;
  onOpen: (habit: Habit) => void;
  onEdit: (habit: Habit) => void;
  onToggleToday: (habitId: string) => void;
  onTrackingChange: (habitId: string, trackingEnabled: boolean) => void;
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
}

export function HabitCard({
  habit,
  weeks,
  weekCount,
  onOpen,
  onEdit,
  onToggleToday,
  onTrackingChange,
  dragHandleProps,
  isDragging = false,
}: HabitCardProps) {
  const todayKey = getTodayKey();
  const Icon = getHabitIconComponent(habit.icon);
  const todayProgress = getDayProgress(habit, todayKey);
  const denseGrid = weekCount > 26;
  const isDueToday = todayProgress.due;
  const isTracking = habit.trackingEnabled;

  const progressByDate = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getDayProgress>>();
    for (const week of weeks) {
      for (const date of week) {
        map.set(date, getDayProgress(habit, date));
      }
    }
    return map;
  }, [habit, weeks]);

  const subtitle = (() => {
    if (!isTracking) {
      return habit.streak > 0
        ? `${habit.streak} streak · tracking paused`
        : "Tracking paused";
    }

    if (!isDueToday) {
      return habit.streak > 0
        ? `${habit.streak} streak · not due today`
        : "Not due today";
    }

    if (habit.streak > 0) {
      return `${habit.streak} streak`;
    }

    if (todayProgress.completed) {
      return "Completed today";
    }

    if (todayProgress.count > 0) {
      return `${todayProgress.count}/${todayProgress.targetCount} today`;
    }

    return habit.targetCount > 1
      ? `Tap + (${habit.targetCount}x to complete)`
      : "Tap + to log today";
  })();

  return (
    <article
      className={cn("rounded-2xl p-4 sm:p-5", isDragging && "shadow-lg", !isTracking && "opacity-75")}
      style={{
        background: "color-mix(in srgb, var(--color-inverse) 8%, var(--color-base))",
        border: "1px solid color-mix(in srgb, var(--color-inverse) 10%, transparent)",
      }}
    >
      <div className="mb-4 flex items-start gap-3">
        {dragHandleProps && (
          <button
            type="button"
            aria-label="Drag to reorder"
            className="mt-1 flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded-md opacity-35 transition-opacity hover:opacity-70 active:cursor-grabbing"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => onOpen(habit)}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12"
            style={{
              background: `color-mix(in srgb, ${habit.color} 18%, var(--color-base))`,
            }}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: habit.color }} />
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold sm:text-lg">{habit.name}</h2>
              <HabitFrequencyBadge habit={habit} />
            </div>
            <p className="truncate text-sm opacity-50">{subtitle}</p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <ToggleSwitch
            checked={isTracking}
            onCheckedChange={(checked) => onTrackingChange(habit.id, checked)}
            label="Track"
            id={`track-${habit.id}`}
          />

          <button
            type="button"
            aria-label={`Edit ${habit.name}`}
            onClick={() => onEdit(habit)}
            className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform active:scale-95 sm:h-12 sm:w-12"
            style={{
              background: `color-mix(in srgb, ${habit.color} 12%, var(--color-base))`,
              border: `1px solid color-mix(in srgb, ${habit.color} 35%, transparent)`,
            }}
          >
            <Pencil className="h-4 w-4" style={{ color: habit.color }} strokeWidth={2.5} />
          </button>

          <button
            type="button"
            disabled={!isDueToday || !isTracking}
            aria-label={
              !isTracking
                ? `${habit.name} tracking is paused`
                : !isDueToday
                ? `${habit.name} is not due today`
                : todayProgress.completed
                  ? `Reset ${habit.name} for today`
                  : `Log progress for ${habit.name}`
            }
            onClick={() => onToggleToday(habit.id)}
            className={cn(
              "relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl transition-transform active:scale-95 sm:h-12 sm:w-12",
              !todayProgress.completed && isDueToday && isTracking && "border-2 bg-transparent",
              (!isDueToday || !isTracking) && "opacity-35",
            )}
            style={{
              background: todayProgress.completed ? habit.color : "transparent",
              borderColor: isDueToday ? habit.color : "transparent",
            }}
          >
            {!todayProgress.completed && todayProgress.count > 0 && isDueToday && (
              <div
                className="absolute inset-x-0 bottom-0"
                style={{
                  height: `${todayProgress.ratio * 100}%`,
                  background: `color-mix(in srgb, ${habit.color} 35%, transparent)`,
                }}
              />
            )}
            {!isTracking ? (
              <span className="relative text-[10px] font-medium uppercase opacity-60">
                Pause
              </span>
            ) : !isDueToday ? (
              <span className="relative text-[10px] font-medium uppercase opacity-60">
                Off
              </span>
            ) : todayProgress.completed ? (
              <Check className="relative h-5 w-5 text-white" strokeWidth={2.5} />
            ) : todayProgress.count > 0 ? (
              <span
                className="relative font-data text-xs font-semibold"
                style={{ color: habit.color }}
              >
                {todayProgress.count}/{todayProgress.targetCount}
              </span>
            ) : (
              <Plus className="relative h-5 w-5" style={{ color: habit.color }} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpen(habit)}
        aria-label={`Open calendar for ${habit.name}`}
        className="w-full text-left"
      >
        <div>
          <div
            className={cn(
              "grid w-full",
              denseGrid
                ? "gap-px sm:gap-[2px]"
                : weekCount <= 12
                  ? "gap-[3px] sm:gap-1"
                  : "gap-[2px] sm:gap-[3px]",
            )}
            style={{
              gridTemplateRows: "repeat(7, minmax(0, auto))",
              gridAutoFlow: "column",
              gridAutoColumns: "minmax(0, 1fr)",
            }}
          >
            {weeks.map((week) =>
              week.map((date) => {
                const progress = progressByDate.get(date)!;
                const isToday = date === todayKey;
                const showProgress = isTracking ? progress.due : progress.ratio > 0;
                return (
                  <div
                    key={date}
                    aria-hidden
                    className={cn(
                      "aspect-square w-full min-w-0",
                      denseGrid
                        ? "rounded-[1px] sm:rounded-[2px]"
                        : weekCount <= 12
                          ? "rounded-md"
                          : "rounded-sm",
                      isToday &&
                        isTracking &&
                        progress.due &&
                        !progress.completed &&
                        "ring-1 ring-offset-1 ring-offset-transparent",
                    )}
                    style={{
                      background: getCellBackground(
                        habit.color,
                        progress.ratio,
                        showProgress,
                      ),
                      ...(isToday && isTracking && progress.due && !progress.completed
                        ? { boxShadow: `0 0 0 1px ${habit.color}` }
                        : {}),
                    }}
                  />
                );
              }),
            )}
          </div>
        </div>
      </button>
    </article>
  );
}
