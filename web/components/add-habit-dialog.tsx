"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HabitFrequencyBadge } from "@/components/habit-frequency-badge";
import { HabitScheduleFields } from "@/components/habit-schedule-fields";
import { CollapsibleIconPicker } from "@/components/collapsible-icon-picker";
import { HABIT_COLORS } from "@/lib/habit-colors";
import { getOnAccentColor } from "@/lib/color-utils";
import type { Habit, HabitFrequency } from "@/lib/api";
import {
  DEFAULT_HABIT_ICON,
  getHabitIconComponent,
  HABIT_ICON_IDS,
  isHabitIconId,
  type HabitIconId,
} from "@/lib/habit-icons";
import {
  buildHabitScheduleDays,
  defaultScheduleDays,
  formatHabitScheduleSummary,
  scheduleDaysFromHabit,
} from "@/lib/habit-schedule";
import { cn } from "@/lib/utils";

export interface NewHabitForm {
  name: string;
  color: string;
  icon: HabitIconId;
  targetCount: number;
  frequency: HabitFrequency;
  weeklyDays: number[];
  monthlyDays: number[];
  yearlyDays: Array<{ month: number; day: number }>;
  intervalDays: number;
}

interface AddHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate?: (habit: NewHabitForm) => Promise<void>;
  onUpdate?: (habitId: string, habit: NewHabitForm) => Promise<void>;
  onDelete?: (habitId: string) => Promise<void>;
  habit?: Habit | null;
  defaultColor: string;
}

function defaultForm(defaultColor: string): NewHabitForm {
  const today = new Date();
  const frequency: HabitFrequency = "daily";
  const scheduleDays = defaultScheduleDays(frequency, today);

  return {
    name: "",
    color: defaultColor,
    icon: DEFAULT_HABIT_ICON,
    targetCount: 1,
    frequency,
    weeklyDays: scheduleDays && "weekly" in scheduleDays ? scheduleDays.weekly : [],
    monthlyDays:
      scheduleDays && "monthly" in scheduleDays ? scheduleDays.monthly : [],
    yearlyDays:
      scheduleDays && "yearly" in scheduleDays ? scheduleDays.yearly : [],
    intervalDays:
      scheduleDays && "intervalDays" in scheduleDays
        ? scheduleDays.intervalDays
        : 3,
  };
}

function formFromHabit(habit: Habit): NewHabitForm {
  const scheduleDays = scheduleDaysFromHabit(habit.scheduleDays);

  return {
    name: habit.name,
    color: habit.color,
    icon: isHabitIconId(habit.icon) ? habit.icon : DEFAULT_HABIT_ICON,
    targetCount: habit.targetCount,
    frequency: habit.frequency,
    weeklyDays: scheduleDays && "weekly" in scheduleDays ? scheduleDays.weekly : [],
    monthlyDays:
      scheduleDays && "monthly" in scheduleDays ? scheduleDays.monthly : [],
    yearlyDays:
      scheduleDays && "yearly" in scheduleDays ? scheduleDays.yearly : [],
    intervalDays:
      scheduleDays && "intervalDays" in scheduleDays
        ? scheduleDays.intervalDays
        : 3,
  };
}

export function AddHabitDialog({
  open,
  onOpenChange,
  onCreate,
  onUpdate,
  onDelete,
  habit,
  defaultColor,
}: AddHabitDialogProps) {
  const isEditing = habit != null;
  const [form, setForm] = useState<NewHabitForm>(defaultForm(defaultColor));
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmDelete(false);
      return;
    }
    if (habit) {
      setForm(formFromHabit(habit));
    } else {
      setForm(defaultForm(defaultColor));
    }
  }, [open, defaultColor, habit]);

  function handleFrequencyChange(frequency: HabitFrequency) {
    const scheduleDays = defaultScheduleDays(frequency);
    setForm((current) => ({
      ...current,
      frequency,
      weeklyDays:
        scheduleDays && "weekly" in scheduleDays ? scheduleDays.weekly : [],
      monthlyDays:
        scheduleDays && "monthly" in scheduleDays ? scheduleDays.monthly : [],
      yearlyDays:
        scheduleDays && "yearly" in scheduleDays ? scheduleDays.yearly : [],
      intervalDays:
        scheduleDays && "intervalDays" in scheduleDays
          ? scheduleDays.intervalDays
          : 3,
    }));
  }

  async function handleSubmit() {
    if (!form.name.trim() || submitting || deleting) return;
    setSubmitting(true);
    try {
      const payload = { ...form, name: form.name.trim() };
      if (isEditing && onUpdate) {
        await onUpdate(habit.id, payload);
      } else if (onCreate) {
        await onCreate(payload);
      }
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!isEditing || !onDelete || deleting || submitting) return;
    setDeleting(true);
    try {
      await onDelete(habit.id);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  }

  const PreviewIcon = getHabitIconComponent(form.icon);
  const previewScheduleDays = buildHabitScheduleDays(
    form.frequency,
    form.weeklyDays,
    form.monthlyDays,
    form.yearlyDays,
    form.intervalDays,
  );
  const previewSummary = formatHabitScheduleSummary(
    form.frequency,
    previewScheduleDays,
  );
  const previewHabit: Habit = {
    id: "preview",
    name: form.name.trim() || "Habit name",
    color: form.color,
    icon: form.icon,
    targetCount: form.targetCount,
    frequency: form.frequency,
    scheduleDays: previewScheduleDays,
    scheduleSummary: previewSummary,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    streak: 0,
    logs: [],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-md"
        style={{
          background: "var(--color-base)",
          color: "var(--color-inverse)",
          borderColor: "var(--color-border)",
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit habit" : "New habit"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div
            className="flex items-center gap-3 rounded-xl p-3"
            style={{
              background:
                "color-mix(in srgb, var(--color-inverse) 8%, var(--color-base))",
              border:
                "1px solid color-mix(in srgb, var(--color-inverse) 10%, transparent)",
            }}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: `color-mix(in srgb, ${form.color} 18%, var(--color-base))`,
              }}
            >
              <PreviewIcon className="h-5 w-5" style={{ color: form.color }} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">
                {form.name.trim() || "Habit name"}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <HabitFrequencyBadge habit={previewHabit} variant="full" />
                <p className="text-xs opacity-50">
                  {form.targetCount === 1
                    ? "1 tap to complete"
                    : `${form.targetCount} taps to complete`}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="habit-name">Name</Label>
            <Input
              id="habit-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Walk around the block"
              className="min-h-11 border-[var(--color-border)] bg-transparent sm:min-h-12"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSubmit();
              }}
            />
          </div>

          <HabitScheduleFields
            frequency={form.frequency}
            onFrequencyChange={handleFrequencyChange}
            weeklyDays={form.weeklyDays}
            onWeeklyDaysChange={(weeklyDays) =>
              setForm((f) => ({ ...f, weeklyDays }))
            }
            monthlyDays={form.monthlyDays}
            onMonthlyDaysChange={(monthlyDays) =>
              setForm((f) => ({ ...f, monthlyDays }))
            }
            yearlyDays={form.yearlyDays}
            onYearlyDaysChange={(yearlyDays) =>
              setForm((f) => ({ ...f, yearlyDays }))
            }
            intervalDays={form.intervalDays}
            onIntervalDaysChange={(intervalDays) =>
              setForm((f) => ({ ...f, intervalDays }))
            }
          />

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Select color ${color}`}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  className={cn(
                    "h-9 w-9 rounded-full transition-transform active:scale-95",
                    form.color === color && "ring-2 ring-offset-2 ring-offset-[var(--color-base)]",
                  )}
                  style={{
                    background: color,
                    ...(form.color === color
                      ? { boxShadow: `0 0 0 2px ${color}` }
                      : {}),
                  }}
                />
              ))}
            </div>
          </div>

          <CollapsibleIconPicker
            iconIds={HABIT_ICON_IDS}
            selectedIcon={form.icon}
            onSelect={(icon) => setForm((f) => ({ ...f, icon: icon as HabitIconId }))}
            getIconComponent={getHabitIconComponent}
            accentColor={form.color}
            columns={7}
            resetKey={open ? habit?.id ?? "new" : undefined}
          />

          <div className="space-y-2">
            <Label>Taps to complete</Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Decrease taps"
                disabled={form.targetCount <= 1}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    targetCount: Math.max(1, f.targetCount - 1),
                  }))
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl disabled:opacity-30"
                style={{
                  background:
                    "color-mix(in srgb, var(--color-inverse) 8%, var(--color-base))",
                  border:
                    "1px solid color-mix(in srgb, var(--color-inverse) 10%, transparent)",
                }}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-data min-w-[3ch] text-center text-lg font-semibold">
                {form.targetCount}
              </span>
              <button
                type="button"
                aria-label="Increase taps"
                disabled={form.targetCount >= 10}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    targetCount: Math.min(10, f.targetCount + 1),
                  }))
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl disabled:opacity-30"
                style={{
                  background:
                    "color-mix(in srgb, var(--color-inverse) 8%, var(--color-base))",
                  border:
                    "1px solid color-mix(in srgb, var(--color-inverse) 10%, transparent)",
                }}
              >
                <Plus className="h-4 w-4" />
              </button>
              <span className="text-sm opacity-50">
                {form.targetCount === 1
                  ? "Single tap habit"
                  : "Partial fill until all taps done"}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={!form.name.trim() || submitting || deleting}
            onClick={() => void handleSubmit()}
            className="min-h-11 w-full rounded-lg text-sm font-medium transition-opacity disabled:opacity-40 sm:min-h-12"
            style={{
              background: form.color,
              color: getOnAccentColor(form.color),
            }}
          >
            {submitting
              ? isEditing
                ? "Saving…"
                : "Creating…"
              : isEditing
                ? "Save changes"
                : "Create habit"}
          </button>

          {isEditing && onDelete && (
            <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
              {confirmDelete ? (
                <div className="space-y-3">
                  <p className="text-center text-sm opacity-60">
                    Delete &ldquo;{habit.name}&rdquo;? This can&apos;t be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => setConfirmDelete(false)}
                      className="min-h-11 flex-1 rounded-lg text-sm font-medium opacity-70 transition-opacity hover:opacity-100 disabled:opacity-40 sm:min-h-12"
                      style={{
                        background:
                          "color-mix(in srgb, var(--color-inverse) 8%, var(--color-base))",
                        border:
                          "1px solid color-mix(in srgb, var(--color-inverse) 10%, transparent)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => void handleDelete()}
                      className="min-h-11 flex-1 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-40 sm:min-h-12"
                      style={{ background: "#ef4444" }}
                    >
                      {deleting ? "Deleting…" : "Delete habit"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setConfirmDelete(true)}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-red-400 transition-opacity hover:opacity-80 disabled:opacity-40 sm:min-h-12"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete habit
                </button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
