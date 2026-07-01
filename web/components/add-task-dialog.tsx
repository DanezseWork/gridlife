"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanlineSkeleton } from "@/components/scanline-skeleton";
import { api, type AvailableHabit } from "@/lib/api";
import { getHabitIconComponent } from "@/lib/habit-icons";
import { cn } from "@/lib/utils";

export interface NewTaskForm {
  title: string;
  details: string;
}

type AddMode = "task" | "habit";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  onCreateTask: (form: NewTaskForm) => Promise<void>;
  onCreateHabit: (habitId: string) => Promise<void>;
}

export function AddTaskDialog({
  open,
  onOpenChange,
  date,
  onCreateTask,
  onCreateHabit,
}: AddTaskDialogProps) {
  const [mode, setMode] = useState<AddMode>("task");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [habits, setHabits] = useState<AvailableHabit[]>([]);
  const [loadingHabits, setLoadingHabits] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setMode("task");
      setTitle("");
      setDetails("");
      setHabits([]);
      setSelectedHabitId(null);
      return;
    }

    if (mode !== "habit") return;

    let cancelled = false;
    setLoadingHabits(true);
    setSelectedHabitId(null);

    api
      .getAvailableHabits(date)
      .then((data) => {
        if (!cancelled) setHabits(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingHabits(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, mode, date]);

  async function handleSubmitTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onCreateTask({ title: title.trim(), details: details.trim() });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitHabit() {
    if (!selectedHabitId) return;

    setSubmitting(true);
    try {
      await onCreateHabit(selectedHabitId);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
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
          <DialogTitle>Add to day</DialogTitle>
        </DialogHeader>

        <div
          className="grid grid-cols-2 gap-1 rounded-xl p-1"
          style={{
            background:
              "color-mix(in srgb, var(--color-inverse) 8%, var(--color-base))",
            border:
              "1px solid color-mix(in srgb, var(--color-inverse) 10%, transparent)",
          }}
        >
          {(["task", "habit"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={cn(
                "rounded-lg py-2 text-sm font-medium capitalize transition-colors",
                mode === option ? "btn-accent" : "opacity-60 hover:opacity-90",
              )}
            >
              {option}
            </button>
          ))}
        </div>

        {mode === "task" ? (
          <form onSubmit={handleSubmitTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs doing?"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-details">Details (optional)</Label>
              <Input
                id="task-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Notes or context"
              />
            </div>

            <button
              type="submit"
              disabled={!title.trim() || submitting}
              className="btn-accent w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-40"
            >
              {submitting ? "Adding…" : "Add task"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-xs opacity-50">
              Only habits with tracking turned on that are not already on this
              day.
            </p>

            {loadingHabits ? (
              <div className="space-y-2">
                <ScanlineSkeleton className="h-14 rounded-xl" />
                <ScanlineSkeleton className="h-14 rounded-xl" />
              </div>
            ) : habits.length === 0 ? (
              <div
                className="rounded-xl px-4 py-6 text-center text-sm opacity-60"
                style={{
                  background:
                    "color-mix(in srgb, var(--color-inverse) 6%, var(--color-base))",
                  border:
                    "1px solid color-mix(in srgb, var(--color-inverse) 10%, transparent)",
                }}
              >
                No habits available to add. Turn on tracking for a habit on the
                Habits page, or they may already be on this day.
              </div>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {habits.map((habit) => {
                  const Icon = getHabitIconComponent(habit.icon);
                  const selected = selectedHabitId === habit.id;

                  return (
                    <li key={habit.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedHabitId(habit.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-transform active:scale-[0.99]",
                        )}
                        style={{
                          background: selected
                            ? `color-mix(in srgb, ${habit.color} 16%, var(--color-base))`
                            : "color-mix(in srgb, var(--color-inverse) 6%, var(--color-base))",
                          border: selected
                            ? `1px solid color-mix(in srgb, ${habit.color} 45%, transparent)`
                            : "1px solid color-mix(in srgb, var(--color-inverse) 10%, transparent)",
                        }}
                      >
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            background: `color-mix(in srgb, ${habit.color} 18%, var(--color-base))`,
                            color: habit.color,
                          }}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2.5} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {habit.name}
                          </span>
                          <span className="block truncate text-xs opacity-50">
                            {habit.scheduleSummary}
                          </span>
                        </span>

                        {selected && (
                          <Check
                            className="h-4 w-4 shrink-0"
                            style={{ color: habit.color }}
                            strokeWidth={2.5}
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <button
              type="button"
              disabled={!selectedHabitId || submitting || habits.length === 0}
              onClick={() => void handleSubmitHabit()}
              className="btn-accent w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-40"
            >
              {submitting ? "Adding…" : "Add habit"}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
