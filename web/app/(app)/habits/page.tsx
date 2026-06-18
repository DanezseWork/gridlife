"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { AddHabitDialog, type NewHabitForm } from "@/components/add-habit-dialog";
import { HabitCalendarDialog } from "@/components/habit-calendar-dialog";
import { SortableHabitList } from "@/components/sortable-habit-list";
import { PageContainer } from "@/components/page-container";
import { ScanlineSkeleton } from "@/components/scanline-skeleton";
import { api, type Habit } from "@/lib/api";
import { getTodayKey, toLocalDateKey } from "@/lib/dates";
import { getDayProgress } from "@/lib/habit-progress";
import { nextHabitColor } from "@/lib/habit-colors";
import { useHabitGridWeekCount } from "@/lib/habit-grid";

const DAYS_PER_WEEK = 7;

function getGridWeeks(weekCount: number): string[][] {
  const weeks: string[][] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (weekCount * DAYS_PER_WEEK - 1));

  const cursor = new Date(start);
  let currentWeek: string[] = [];

  while (cursor <= today) {
    currentWeek.push(toLocalDateKey(cursor));
    if (currentWeek.length === DAYS_PER_WEEK) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

function habitCompletedOn(habit: Habit, dateKey: string): boolean {
  const progress = getDayProgress(habit, dateKey);
  return progress.due && progress.completed;
}

function habitDueOn(habit: Habit, dateKey: string): boolean {
  return getDayProgress(habit, dateKey).due;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [calendarHabit, setCalendarHabit] = useState<Habit | null>(null);
  const weekCount = useHabitGridWeekCount();
  const weeks = useMemo(() => getGridWeeks(weekCount), [weekCount]);
  const todayKey = getTodayKey();

  const dueTodayCount = useMemo(
    () => habits.filter((h) => habitDueOn(h, todayKey)).length,
    [habits, todayKey],
  );

  const completedTodayCount = useMemo(
    () => habits.filter((h) => habitCompletedOn(h, todayKey)).length,
    [habits, todayKey],
  );

  const loadHabits = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getHabits();
      setHabits(data);
      setCalendarHabit((current) =>
        current ? data.find((h) => h.id === current.id) ?? null : null,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  async function handleToggleToday(habitId: string) {
    await api.toggleHabit(habitId, todayKey);
    await loadHabits();
  }

  async function handleCreate(form: NewHabitForm) {
    await api.createHabit({
      name: form.name,
      color: form.color,
      icon: form.icon,
      targetCount: form.targetCount,
      frequency: form.frequency,
      weeklyDays: form.frequency === "weekly" ? form.weeklyDays : undefined,
      monthlyDays: form.frequency === "monthly" ? form.monthlyDays : undefined,
      yearlyDays: form.frequency === "yearly" ? form.yearlyDays : undefined,
      intervalDays: form.frequency === "custom" ? form.intervalDays : undefined,
    });
    await loadHabits();
  }

  async function handleUpdate(habitId: string, form: NewHabitForm) {
    await api.updateHabit(habitId, {
      name: form.name,
      color: form.color,
      icon: form.icon,
      targetCount: form.targetCount,
      frequency: form.frequency,
      weeklyDays: form.frequency === "weekly" ? form.weeklyDays : undefined,
      monthlyDays: form.frequency === "monthly" ? form.monthlyDays : undefined,
      yearlyDays: form.frequency === "yearly" ? form.yearlyDays : undefined,
      intervalDays: form.frequency === "custom" ? form.intervalDays : undefined,
    });
    await loadHabits();
  }

  async function handleDelete(habitId: string) {
    await api.deleteHabit(habitId);
    setEditingHabit(null);
    await loadHabits();
  }

  async function handleReorder(habitIds: string[]) {
    const reordered = await api.reorderHabits(habitIds);
    setHabits(reordered);
  }

  return (
    <PageContainer className="pb-8 lg:max-w-6xl xl:max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <header className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
          <div className="w-10" aria-hidden />

          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              <span style={{ color: "var(--color-inverse)" }}>Hab</span>
              <span style={{ color: "var(--color-accent)" }}>its</span>
            </h1>
            {!loading && habits.length > 0 && (
              <p className="mt-0.5 text-xs opacity-50 sm:text-sm">
                {dueTodayCount > 0
                  ? `${completedTodayCount}/${dueTodayCount} due today`
                  : "Nothing due today"}
              </p>
            )}
          </div>

          <button
            type="button"
            aria-label="Add habit"
            onClick={() => setDialogOpen(true)}
            className="btn-accent flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-95"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </header>

        {loading ? (
          <div className="flex flex-col gap-3 sm:gap-4">
            <ScanlineSkeleton className="h-36 rounded-2xl sm:h-40" />
            <ScanlineSkeleton className="h-36 rounded-2xl sm:h-40" />
          </div>
        ) : habits.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background:
                "color-mix(in srgb, var(--color-inverse) 8%, var(--color-base))",
              border:
                "1px solid color-mix(in srgb, var(--color-inverse) 10%, transparent)",
            }}
          >
            <p className="text-sm opacity-60 sm:text-base">
              No habits yet. Tap + to add one.
            </p>
          </div>
        ) : (
          <SortableHabitList
            habits={habits}
            weeks={weeks}
            weekCount={weekCount}
            onOpen={setCalendarHabit}
            onEdit={setEditingHabit}
            onToggleToday={handleToggleToday}
            onReorder={handleReorder}
          />
        )}
      </motion.div>

      <AddHabitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
        defaultColor={nextHabitColor(habits.length)}
      />

      <AddHabitDialog
        open={editingHabit !== null}
        onOpenChange={(open) => {
          if (!open) setEditingHabit(null);
        }}
        habit={editingHabit}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        defaultColor={editingHabit?.color ?? nextHabitColor(0)}
      />

      <HabitCalendarDialog
        habit={calendarHabit}
        open={calendarHabit !== null}
        onOpenChange={(open) => {
          if (!open) setCalendarHabit(null);
        }}
        onToggleToday={handleToggleToday}
      />
    </PageContainer>
  );
}
