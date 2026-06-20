"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TaskCalendarDay } from "@/lib/api";
import {
  addMonths,
  getMonthCalendarDays,
  getTodayKey,
  toLocalDateKey,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_HABIT_SQUARES = 4;

interface TaskCalendarProps {
  viewMonth: Date;
  onViewMonthChange: (month: Date) => void;
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  days: TaskCalendarDay[];
}

function monthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getCellStyle(total: number, completed: number, isSelected: boolean) {
  if (total === 0) {
    return {
      background:
        "color-mix(in srgb, var(--color-inverse) 5%, transparent)",
    };
  }

  const ratio = completed / total;
  const accent = "var(--color-accent)";
  const empty = `color-mix(in srgb, ${accent} 18%, transparent)`;

  return {
    background:
      ratio >= 1
        ? accent
        : ratio > 0
          ? `linear-gradient(to top, ${accent} ${ratio * 100}%, ${empty} ${ratio * 100}%)`
          : empty,
    ...(isSelected ? { boxShadow: `0 0 0 2px ${accent}` } : {}),
  };
}

/** Solid date color — gradient text clipped to glyphs is unreliable in calendar cells. */
function getDateTextStyle(
  total: number,
  completed: number,
): React.CSSProperties {
  if (total === 0) {
    return { color: "var(--color-inverse)" };
  }

  const ratio = completed / total;

  if (ratio >= 1) {
    return { color: "var(--color-on-accent)" };
  }

  if (ratio <= 0) {
    return { color: "var(--color-inverse)" };
  }

  return {
    color: "var(--color-inverse)",
    textShadow:
      "0 0 3px var(--color-base), 0 0 6px color-mix(in srgb, var(--color-base) 70%, transparent)",
  };
}

/** Task count sits in the top-right, on the unfilled zone unless the day is fully complete. */
function getCountTextColor(total: number, completed: number): string {
  if (total === 0) return "var(--color-inverse)";
  return completed >= total
    ? "var(--color-on-accent)"
    : "var(--color-inverse)";
}

export function TaskCalendar({
  viewMonth,
  onViewMonthChange,
  selectedDate,
  onSelectDate,
  days,
}: TaskCalendarProps) {
  const todayKey = getTodayKey();
  const monthLabel = viewMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const calendarDays = useMemo(
    () => getMonthCalendarDays(viewMonth),
    [viewMonth],
  );

  const dayMap = useMemo(
    () => new Map(days.map((day) => [day.date, day])),
    [days],
  );

  return (
    <section
      className="rounded-2xl p-4 sm:p-5"
      style={{
        background:
          "color-mix(in srgb, var(--color-inverse) 8%, var(--color-base))",
        border:
          "1px solid color-mix(in srgb, var(--color-inverse) 10%, transparent)",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => onViewMonthChange(addMonths(viewMonth, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg opacity-60 transition-opacity hover:opacity-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium">{monthLabel}</span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => onViewMonthChange(addMonths(viewMonth, 1))}
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
          const summary = dayMap.get(dateKey);
          const total = summary?.total ?? 0;
          const completed = summary?.completed ?? 0;
          const completedHabits = summary?.completedHabits ?? [];
          const visibleHabits = completedHabits.slice(0, MAX_HABIT_SQUARES);
          const overflowCount = completedHabits.length - visibleHabits.length;
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDate;
          const isFuture = dateKey > todayKey;
          const dateTextStyle = getDateTextStyle(total, completed);
          const countTextColor = getCountTextColor(total, completed);

          return (
            <button
              key={dateKey}
              type="button"
              aria-label={`${dateKey}, ${completed} of ${total} tasks done`}
              aria-current={isSelected ? "date" : undefined}
              onClick={() => onSelectDate(dateKey)}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-transform active:scale-95",
                isFuture && "opacity-40",
                isToday && !isSelected && "ring-1 ring-[var(--color-accent)]",
              )}
              style={getCellStyle(total, completed, isSelected)}
            >
              {visibleHabits.length > 0 && (
                <div className="absolute left-0.5 top-0.5 flex max-w-[calc(100%-1rem)] flex-wrap gap-px">
                  {visibleHabits.map((habit) => (
                    <span
                      key={habit.id}
                      aria-hidden
                      className="h-1.5 w-1.5 shrink-0 rounded-sm sm:h-2 sm:w-2"
                      style={{ background: habit.color }}
                    />
                  ))}
                  {overflowCount > 0 && (
                    <span className="text-[7px] leading-none opacity-50">
                      +{overflowCount}
                    </span>
                  )}
                </div>
              )}

              {total > 0 && (
                <span
                  className="absolute right-1 top-0.5 text-[10px] leading-none opacity-45"
                  style={{ color: countTextColor }}
                >
                  {total}
                </span>
              )}

              <span
                className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-sm font-medium leading-none tabular-nums"
                style={dateTextStyle}
              >
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export { monthKey };
