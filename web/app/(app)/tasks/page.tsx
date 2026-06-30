"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { AddTaskDialog, type NewTaskForm } from "@/components/add-task-dialog";
import { PageContainer } from "@/components/page-container";
import { ScanlineSkeleton } from "@/components/scanline-skeleton";
import { SortableTaskList } from "@/components/sortable-task-list";
import { TaskCalendar, monthKey } from "@/components/task-calendar";
import { api, type Task, type TaskCalendarDay } from "@/lib/api";
import { getTodayKey, getYesterdayKey, isLoggableHabitDateKey, isPastDateKey, isReadOnlyTaskDateKey, parseDateKey } from "@/lib/dates";

function formatSelectedDateLabel(dateKey: string): string {
  const todayKey = getTodayKey();
  const yesterdayKey = getYesterdayKey();
  if (dateKey === todayKey) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";

  const date = parseDateKey(dateKey);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export default function TasksPage() {
  const todayKey = getTodayKey();
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [viewMonth, setViewMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarDays, setCalendarDays] = useState<TaskCalendarDay[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transferringTaskId, setTransferringTaskId] = useState<string | null>(
    null,
  );

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks],
  );

  const loadTasks = useCallback(async (date: string, options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoadingTasks(true);
    }
    try {
      const data = await api.getTasks(date);
      setTasks(data);
    } finally {
      if (!options?.silent) {
        setLoadingTasks(false);
      }
    }
  }, []);

  const loadCalendar = useCallback(async (month: Date, options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoadingCalendar(true);
    }
    try {
      const data = await api.getTaskCalendar(monthKey(month));
      setCalendarDays(data);
    } finally {
      if (!options?.silent) {
        setLoadingCalendar(false);
      }
    }
  }, []);

  useEffect(() => {
    loadTasks(selectedDate);
  }, [selectedDate, loadTasks]);

  useEffect(() => {
    loadCalendar(viewMonth);
  }, [viewMonth, loadCalendar]);

  async function handleToggle(taskId: string) {
    await api.toggleTask(taskId);
    await Promise.all([
      loadTasks(selectedDate, { silent: true }),
      loadCalendar(viewMonth, { silent: true }),
    ]);
  }

  async function handleCreate(form: NewTaskForm) {
    await api.createTask({
      title: form.title,
      details: form.details || undefined,
      date: selectedDate,
    });
    await Promise.all([
      loadTasks(selectedDate, { silent: true }),
      loadCalendar(viewMonth, { silent: true }),
    ]);
  }

  async function handleDelete(taskId: string) {
    await api.deleteTask(taskId);
    await Promise.all([
      loadTasks(selectedDate, { silent: true }),
      loadCalendar(viewMonth, { silent: true }),
    ]);
  }

  async function handleReorder(taskIds: string[]) {
    const reordered = await api.reorderTasks(selectedDate, taskIds);
    setTasks(reordered);
  }

  async function handleTransferToToday(taskId: string) {
    setTransferringTaskId(taskId);
    try {
      await api.transferTaskToToday(taskId);
      await Promise.all([
        loadTasks(selectedDate, { silent: true }),
        loadCalendar(viewMonth, { silent: true }),
      ]);
    } finally {
      setTransferringTaskId(null);
    }
  }

  async function handleCreateSubtask(taskId: string, title: string) {
    await api.createSubtask(taskId, title);
    await Promise.all([
      loadTasks(selectedDate, { silent: true }),
      loadCalendar(viewMonth, { silent: true }),
    ]);
  }

  async function handleToggleSubtask(taskId: string, subtaskId: string) {
    await api.toggleSubtask(taskId, subtaskId);
    await Promise.all([
      loadTasks(selectedDate, { silent: true }),
      loadCalendar(viewMonth, { silent: true }),
    ]);
  }

  async function handleDeleteSubtask(taskId: string, subtaskId: string) {
    await api.deleteSubtask(taskId, subtaskId);
    await Promise.all([
      loadTasks(selectedDate, { silent: true }),
      loadCalendar(viewMonth, { silent: true }),
    ]);
  }

  async function handleUpdate(
    taskId: string,
    data: { title: string; details?: string },
  ) {
    await api.updateTask(taskId, data);
    await Promise.all([
      loadTasks(selectedDate, { silent: true }),
      loadCalendar(viewMonth, { silent: true }),
    ]);
  }

  async function handleUpdateSubtask(
    taskId: string,
    subtaskId: string,
    title: string,
  ) {
    await api.updateSubtask(taskId, subtaskId, title);
    await Promise.all([
      loadTasks(selectedDate, { silent: true }),
      loadCalendar(viewMonth, { silent: true }),
    ]);
  }

  function handleSelectDate(dateKey: string) {
    setSelectedDate(dateKey);
    const date = parseDateKey(dateKey);
    setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  const isReadOnlyDate = isReadOnlyTaskDateKey(selectedDate);
  const isPastDate = isPastDateKey(selectedDate);
  const isYesterday = selectedDate === getYesterdayKey();

  const canToggleTask = (task: Task) => {
    if (isReadOnlyDate) return false;
    if (task.habitId) return isLoggableHabitDateKey(selectedDate);
    if (!task.completed && task.subtasks.length > 0) {
      return task.subtasks.every((subtask) => subtask.completed);
    }
    return true;
  };

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
              <span style={{ color: "var(--color-inverse)" }}>T</span>
              <span style={{ color: "var(--color-accent)" }}>asks</span>
            </h1>
            <p className="mt-0.5 text-xs opacity-50 sm:text-sm">
              {formatSelectedDateLabel(selectedDate)}
              {!loadingTasks && tasks.length > 0
                ? ` · ${completedCount}/${tasks.length} done`
                : ""}
            </p>
          </div>

          {isPastDate ? (
            <div className="w-10" aria-hidden />
          ) : (
            <button
              type="button"
              aria-label="Add task"
              onClick={() => setDialogOpen(true)}
              className="btn-accent flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-95"
            >
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </button>
          )}
        </header>

        <div className="mb-6 flex flex-col gap-3 sm:gap-4">
          {loadingTasks ? (
            <>
              <ScanlineSkeleton className="h-20 rounded-2xl" />
              <ScanlineSkeleton className="h-20 rounded-2xl" />
            </>
          ) : tasks.length === 0 ? (
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
                {selectedDate === todayKey
                  ? "Nothing on the list today. Habits due today appear here automatically, or tap + to add a task."
                  : isReadOnlyDate
                    ? "No tasks were recorded for this day."
                    : "No tasks for this day."}
              </p>
            </div>
          ) : (
            <SortableTaskList
              tasks={tasks}
              canToggle={canToggleTask}
              onToggle={handleToggle}
              onDelete={isReadOnlyDate ? undefined : handleDelete}
              onUpdate={isReadOnlyDate ? undefined : handleUpdate}
              onCreateSubtask={isReadOnlyDate ? undefined : handleCreateSubtask}
              onToggleSubtask={isReadOnlyDate ? undefined : handleToggleSubtask}
              onUpdateSubtask={isReadOnlyDate ? undefined : handleUpdateSubtask}
              onDeleteSubtask={isReadOnlyDate ? undefined : handleDeleteSubtask}
              onTransfer={isYesterday ? handleTransferToToday : undefined}
              transferringTaskId={transferringTaskId}
              onReorder={handleReorder}
              readOnly={isReadOnlyDate}
            />
          )}
        </div>

        {loadingCalendar ? (
          <ScanlineSkeleton className="h-80 rounded-2xl" />
        ) : (
          <TaskCalendar
            viewMonth={viewMonth}
            onViewMonthChange={setViewMonth}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            days={calendarDays}
          />
        )}
      </motion.div>

      <AddTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
      />
    </PageContainer>
  );
}
