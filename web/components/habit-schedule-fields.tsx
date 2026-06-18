"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HabitFrequency } from "@/lib/api";
import { cn } from "@/lib/utils";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const FREQUENCIES: HabitFrequency[] = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "custom",
];

interface HabitScheduleFieldsProps {
  frequency: HabitFrequency;
  onFrequencyChange: (value: HabitFrequency) => void;
  weeklyDays: number[];
  onWeeklyDaysChange: (days: number[]) => void;
  monthlyDays: number[];
  onMonthlyDaysChange: (days: number[]) => void;
  yearlyDays: Array<{ month: number; day: number }>;
  onYearlyDaysChange: (days: Array<{ month: number; day: number }>) => void;
  intervalDays: number;
  onIntervalDaysChange: (value: number) => void;
}

function toggleValue(list: number[], value: number): number[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value].sort((a, b) => a - b);
}

export function HabitScheduleFields({
  frequency,
  onFrequencyChange,
  weeklyDays,
  onWeeklyDaysChange,
  monthlyDays,
  onMonthlyDaysChange,
  yearlyDays,
  onYearlyDaysChange,
  intervalDays,
  onIntervalDaysChange,
}: HabitScheduleFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Schedule</Label>
        <div className="flex flex-wrap gap-2">
          {FREQUENCIES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onFrequencyChange(value)}
              className={cn(
                "min-h-10 rounded-md border px-3 py-2 text-xs capitalize transition-colors sm:text-sm",
                frequency === value
                  ? "chip-active"
                  : "border-[var(--color-border)] opacity-70 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {frequency === "weekly" && (
        <div className="space-y-2">
          <Label>On these days</Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => onWeeklyDaysChange(toggleValue(weeklyDays, value))}
                className={cn(
                  "min-h-10 min-w-12 rounded-md border px-2 py-2 text-xs transition-colors sm:text-sm",
                  weeklyDays.includes(value)
                    ? "chip-active"
                    : "border-[var(--color-border)] opacity-70 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {frequency === "monthly" && (
        <div className="space-y-2">
          <Label>On these days of the month</Label>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => onMonthlyDaysChange(toggleValue(monthlyDays, day))}
                className={cn(
                  "min-h-9 rounded-md border text-xs transition-colors sm:text-sm",
                  monthlyDays.includes(day)
                    ? "chip-active"
                    : "border-[var(--color-border)] opacity-70 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                )}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      {frequency === "yearly" && (
        <div className="space-y-2">
          <Label>On these dates each year</Label>
          <div className="space-y-2">
            {yearlyDays.map((entry, index) => (
              <div key={`${entry.month}-${entry.day}-${index}`} className="flex gap-2">
                <select
                  value={entry.month}
                  onChange={(e) => {
                    const next = [...yearlyDays];
                    next[index] = { ...entry, month: Number(e.target.value) };
                    onYearlyDaysChange(next);
                  }}
                  className="min-h-11 flex-1 rounded-md border bg-transparent px-3 text-sm"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  {MONTHS.map((label, monthIndex) => (
                    <option key={label} value={monthIndex + 1}>
                      {label}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={entry.day}
                  onChange={(e) => {
                    const next = [...yearlyDays];
                    next[index] = { ...entry, day: Number(e.target.value) };
                    onYearlyDaysChange(next);
                  }}
                  className="min-h-11 w-24 font-data"
                />
                <button
                  type="button"
                  onClick={() =>
                    onYearlyDaysChange(
                      yearlyDays.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border opacity-70"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onYearlyDaysChange([...yearlyDays, { month: 1, day: 1 }])
            }
            className="min-h-10 gap-2"
          >
            <Plus className="h-4 w-4" />
            Add date
          </Button>
        </div>
      )}

      {frequency === "custom" && (
        <div className="space-y-2">
          <Label>Repeat every</Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={365}
              value={intervalDays}
              onChange={(e) =>
                onIntervalDaysChange(
                  Math.min(365, Math.max(1, Number(e.target.value) || 1)),
                )
              }
              className="min-h-11 w-24 font-data"
            />
            <span className="text-sm opacity-60">days</span>
          </div>
          <p className="text-xs opacity-50">
            Counts from the day you created the habit.
          </p>
        </div>
      )}
    </div>
  );
}
