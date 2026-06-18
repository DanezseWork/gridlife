"use client";

import { useState } from "react";
import { Check, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import { EditTaskDialog, type EditTaskForm } from "@/components/edit-task-dialog";
import { getHabitIconComponent } from "@/lib/habit-icons";
import type { Subtask, Task } from "@/lib/api";
import { cn } from "@/lib/utils";

const fieldStyle = {
  background:
    "color-mix(in srgb, var(--color-inverse) 6%, var(--color-base))",
  border:
    "1px solid color-mix(in srgb, var(--color-inverse) 12%, transparent)",
};

interface TaskListItemProps {
  task: Task;
  canToggle: boolean;
  onToggle: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onUpdate?: (
    taskId: string,
    data: { title: string; details?: string },
  ) => Promise<void>;
  onCreateSubtask?: (taskId: string, title: string) => Promise<void>;
  onToggleSubtask?: (taskId: string, subtaskId: string) => Promise<void>;
  onUpdateSubtask?: (
    taskId: string,
    subtaskId: string,
    title: string,
  ) => Promise<void>;
  onDeleteSubtask?: (taskId: string, subtaskId: string) => Promise<void>;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
  readOnly?: boolean;
}

function SubtaskRow({
  subtask,
  accentColor,
  readOnly,
  onToggle,
  onUpdate,
  onDelete,
}: {
  subtask: Subtask;
  accentColor: string;
  readOnly?: boolean;
  onToggle?: () => void;
  onUpdate?: (title: string) => Promise<void>;
  onDelete?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(subtask.title);
  const [submitting, setSubmitting] = useState(false);
  const canModify = !readOnly && !subtask.completed;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !onUpdate) return;

    setSubmitting(true);
    try {
      await onUpdate(title.trim());
      setEditing(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center gap-2 py-1">
      {readOnly ? (
        <span
          aria-hidden
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded border"
          style={{
            borderColor: accentColor,
            background: subtask.completed ? accentColor : "transparent",
            color: subtask.completed ? "#fff" : accentColor,
          }}
        >
          {subtask.completed && (
            <Check className="h-3 w-3" strokeWidth={3} />
          )}
        </span>
      ) : (
        <button
          type="button"
          aria-label={
            subtask.completed ? "Mark subtask incomplete" : "Mark subtask complete"
          }
          onClick={onToggle}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-transform active:scale-95"
          style={{
            borderColor: accentColor,
            background: subtask.completed ? accentColor : "transparent",
            color: subtask.completed ? "#fff" : accentColor,
          }}
        >
          {subtask.completed && (
            <Check className="h-3 w-3" strokeWidth={3} />
          )}
        </button>
      )}

      {editing && canModify ? (
        <form onSubmit={handleSave} className="flex min-w-0 flex-1 gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="min-w-0 flex-1 rounded-lg px-2.5 py-1 text-xs sm:text-sm"
            style={fieldStyle}
          />
          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="rounded-lg px-2 py-1 text-xs font-medium opacity-80 hover:opacity-100 disabled:opacity-30"
            style={{ color: "var(--color-accent)" }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setTitle(subtask.title);
              setEditing(false);
            }}
            className="rounded-lg px-2 py-1 text-xs opacity-40 hover:opacity-70"
          >
            Cancel
          </button>
        </form>
      ) : (
        <span
          className={cn(
            "min-w-0 flex-1 text-xs sm:text-sm",
            subtask.completed && "line-through opacity-60",
          )}
        >
          {subtask.title}
        </span>
      )}

      {canModify && !editing && (
        <div className="flex shrink-0 items-center">
          {onUpdate && (
            <button
              type="button"
              aria-label="Edit subtask"
              onClick={() => {
                setTitle(subtask.title);
                setEditing(true);
              }}
              className="flex h-6 w-6 items-center justify-center rounded opacity-30 transition-opacity hover:opacity-100"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              aria-label="Delete subtask"
              onClick={onDelete}
              className="flex h-6 w-6 items-center justify-center rounded opacity-30 transition-opacity hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function TaskListItem({
  task,
  canToggle,
  onToggle,
  onDelete,
  onUpdate,
  onCreateSubtask,
  onToggleSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  dragHandleProps,
  isDragging,
  readOnly = false,
}: TaskListItemProps) {
  const HabitIcon = task.habit ? getHabitIconComponent(task.habit.icon) : null;
  const accentColor = task.habit?.color ?? "var(--color-accent)";
  const habitCount = task.habit?.count ?? 0;
  const habitTarget = task.habit?.targetCount ?? 1;
  const isMultiTapHabit = Boolean(task.habit && habitTarget > 1);
  const habitRatio =
    habitTarget > 0 ? Math.min(habitCount / habitTarget, 1) : 0;
  const habitInProgress = Boolean(
    task.habit && !task.completed && habitCount > 0,
  );
  const canModifyTask = !readOnly && !task.habitId && !task.completed;
  const canManageSubtasks =
    canModifyTask && onCreateSubtask && onToggleSubtask;
  const hasSubtasks = task.subtasks.length > 0;
  const incompleteSubtasks = task.subtasks.filter((s) => !s.completed).length;

  const [addingSubtask, setAddingSubtask] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [submittingSubtask, setSubmittingSubtask] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault();
    if (!subtaskTitle.trim() || !onCreateSubtask) return;

    setSubmittingSubtask(true);
    try {
      await onCreateSubtask(task.id, subtaskTitle.trim());
      setSubtaskTitle("");
      setAddingSubtask(false);
    } finally {
      setSubmittingSubtask(false);
    }
  }

  async function handleSaveTask(form: EditTaskForm) {
    if (!onUpdate) return;
    await onUpdate(task.id, {
      title: form.title,
      details: form.details || undefined,
    });
  }

  return (
    <>
      <article
        className={cn(
          "flex items-start gap-3 rounded-2xl p-4 transition-opacity",
          task.completed && "opacity-60",
          isDragging && "shadow-lg",
        )}
        style={{
          background:
            "color-mix(in srgb, var(--color-inverse) 8%, var(--color-base))",
          border:
            "1px solid color-mix(in srgb, var(--color-inverse) 10%, transparent)",
        }}
      >
        {!task.completed && dragHandleProps && !readOnly && (
          <button
            type="button"
            aria-label="Drag to reorder"
            className="mt-0.5 flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded-md opacity-35 transition-opacity hover:opacity-70 active:cursor-grabbing"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        {readOnly ? (
          <span
            aria-hidden
            className={cn(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2",
              task.habit && "relative overflow-hidden",
            )}
            style={{
              borderColor: accentColor,
              background: task.completed ? accentColor : "transparent",
              color: task.completed ? "#fff" : accentColor,
            }}
          >
            {habitInProgress && (
              <div
                className="absolute inset-x-0 bottom-0"
                style={{
                  height: `${habitRatio * 100}%`,
                  background: `color-mix(in srgb, ${accentColor} 35%, transparent)`,
                }}
              />
            )}
            {task.completed ? (
              <Check className="relative h-3.5 w-3.5" strokeWidth={3} />
            ) : habitInProgress ? (
              <span className="relative font-data text-[10px] font-semibold leading-none">
                {habitCount}/{habitTarget}
              </span>
            ) : isMultiTapHabit ? (
              <span className="relative font-data text-[10px] font-semibold leading-none">
                {habitTarget}×
              </span>
            ) : null}
          </span>
        ) : (
          <button
            type="button"
            aria-label={
              task.habit
                ? task.completed
                  ? `Reset ${task.title} for today`
                  : habitInProgress
                    ? `Log progress for ${task.title} (${habitCount}/${habitTarget})`
                    : isMultiTapHabit
                      ? `Log progress for ${task.title} (${habitTarget} taps to complete)`
                      : `Log progress for ${task.title}`
                : task.completed
                  ? "Mark incomplete"
                  : "Mark complete"
            }
            disabled={!canToggle}
            onClick={() => onToggle(task.id)}
            className={cn(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-transform",
              task.habit && "relative overflow-hidden",
              canToggle && "active:scale-95",
              !canToggle && "cursor-default opacity-50",
            )}
            style={{
              borderColor: accentColor,
              background: task.completed ? accentColor : "transparent",
              color: task.completed ? "#fff" : accentColor,
            }}
            title={
              !canToggle && hasSubtasks && incompleteSubtasks > 0
                ? "Complete all subtasks first"
                : isMultiTapHabit && !task.completed && habitCount === 0
                  ? `${habitTarget} taps to complete`
                  : undefined
            }
          >
            {habitInProgress && (
              <div
                className="absolute inset-x-0 bottom-0"
                style={{
                  height: `${habitRatio * 100}%`,
                  background: `color-mix(in srgb, ${accentColor} 35%, transparent)`,
                }}
              />
            )}
            {task.completed ? (
              <Check className="relative h-3.5 w-3.5" strokeWidth={3} />
            ) : habitInProgress ? (
              <span className="relative font-data text-[10px] font-semibold leading-none">
                {habitCount}/{habitTarget}
              </span>
            ) : isMultiTapHabit ? (
              <span className="relative font-data text-[10px] font-semibold leading-none">
                {habitTarget}×
              </span>
            ) : null}
          </button>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {HabitIcon && (
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded"
                style={{
                  background: `color-mix(in srgb, ${task.habit!.color} 20%, transparent)`,
                  color: task.habit!.color,
                }}
              >
                <HabitIcon className="h-3 w-3" />
              </span>
            )}
            <h3
              className={cn(
                "text-sm font-medium sm:text-base",
                task.completed && "line-through opacity-70",
              )}
            >
              {task.title}
            </h3>
            {isMultiTapHabit && (
              <span
                className="shrink-0 rounded-md px-1.5 py-0.5 font-data text-[10px] font-semibold sm:text-xs"
                style={{
                  background: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
                  color: accentColor,
                }}
              >
                {habitCount > 0 ? `${habitCount}/${habitTarget}` : `${habitTarget}×`}
              </span>
            )}
            {hasSubtasks && (
              <span className="text-xs opacity-40">
                {task.subtasks.filter((s) => s.completed).length}/
                {task.subtasks.length}
              </span>
            )}
          </div>
          {task.details && (
            <p className="mt-1 text-xs opacity-50 sm:text-sm">{task.details}</p>
          )}

          {(hasSubtasks || addingSubtask) && (
            <div
              className="mt-3 space-y-0.5 border-t pt-3"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--color-inverse) 10%, transparent)",
              }}
            >
              {task.subtasks.map((subtask) => (
                <SubtaskRow
                  key={subtask.id}
                  subtask={subtask}
                  accentColor={accentColor}
                  readOnly={readOnly}
                  onToggle={
                    onToggleSubtask
                      ? () => onToggleSubtask(task.id, subtask.id)
                      : undefined
                  }
                  onUpdate={
                    onUpdateSubtask
                      ? (title) => onUpdateSubtask(task.id, subtask.id, title)
                      : undefined
                  }
                  onDelete={
                    onDeleteSubtask && !subtask.completed
                      ? () => onDeleteSubtask(task.id, subtask.id)
                      : undefined
                  }
                />
              ))}

              {addingSubtask && canManageSubtasks && (
                <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={subtaskTitle}
                    onChange={(e) => setSubtaskTitle(e.target.value)}
                    placeholder="Subtask title"
                    autoFocus
                    className="min-w-0 flex-1 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm"
                    style={fieldStyle}
                  />
                  <button
                    type="submit"
                    disabled={!subtaskTitle.trim() || submittingSubtask}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-medium opacity-80 transition-opacity hover:opacity-100 disabled:opacity-30"
                    style={{ color: "var(--color-accent)" }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingSubtask(false);
                      setSubtaskTitle("");
                    }}
                    className="rounded-lg px-2 py-1.5 text-xs opacity-40 hover:opacity-70"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          )}

          {canManageSubtasks && !addingSubtask && (
            <button
              type="button"
              onClick={() => setAddingSubtask(true)}
              className="mt-2 flex items-center gap-1 text-xs opacity-40 transition-opacity hover:opacity-70"
            >
              <Plus className="h-3 w-3" />
              Add subtask
            </button>
          )}
        </div>

        {canModifyTask && (onUpdate || onDelete) && (
          <div className="flex shrink-0 items-center">
            {onUpdate && (
              <button
                type="button"
                aria-label="Edit task"
                onClick={() => setEditOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg opacity-40 transition-opacity hover:opacity-100 active:scale-95"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                aria-label="Delete task"
                onClick={() => onDelete(task.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg opacity-40 transition-opacity hover:opacity-100 active:scale-95"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </article>

      {onUpdate && (
        <EditTaskDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          initialTitle={task.title}
          initialDetails={task.details ?? ""}
          onSave={handleSaveTask}
        />
      )}
    </>
  );
}
