"use client";

import { useMemo } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskListItem } from "@/components/task-list-item";
import type { Task } from "@/lib/api";

interface SortableTaskListProps {
  tasks: Task[];
  canToggle: (task: Task) => boolean;
  onToggle: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onUntrack?: (taskId: string) => void;
  allowHabitUntrack?: boolean;
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
  onTransfer?: (taskId: string) => Promise<void>;
  transferringTaskId?: string | null;
  onReorder: (taskIds: string[]) => void;
  readOnly?: boolean;
}

interface SortableTaskListItemProps {
  task: Task;
  canToggle: boolean;
  onToggle: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onUntrack?: (taskId: string) => void;
  allowHabitUntrack?: boolean;
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
  onTransfer?: (taskId: string) => Promise<void>;
  transferringTaskId?: string | null;
  readOnly?: boolean;
}

function SortableTaskListItem({
  task,
  canToggle,
  onToggle,
  onDelete,
  onUntrack,
  allowHabitUntrack,
  onUpdate,
  onCreateSubtask,
  onToggleSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onTransfer,
  transferringTaskId,
  readOnly,
}: SortableTaskListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskListItem
        task={task}
        canToggle={canToggle}
        onToggle={onToggle}
        onDelete={onDelete}
        onUntrack={onUntrack}
        allowHabitUntrack={allowHabitUntrack}
        onUpdate={onUpdate}
        onCreateSubtask={onCreateSubtask}
        onToggleSubtask={onToggleSubtask}
        onUpdateSubtask={onUpdateSubtask}
        onDeleteSubtask={onDeleteSubtask}
        onTransfer={onTransfer}
        transferring={transferringTaskId === task.id}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
        readOnly={readOnly}
      />
    </div>
  );
}

export function SortableTaskList({
  tasks,
  canToggle,
  onToggle,
  onDelete,
  onUntrack,
  allowHabitUntrack = false,
  onUpdate,
  onCreateSubtask,
  onToggleSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onTransfer,
  transferringTaskId,
  onReorder,
  readOnly = false,
}: SortableTaskListProps) {
  const incompleteTasks = useMemo(
    () => tasks.filter((task) => !task.completed),
    [tasks],
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.completed),
    [tasks],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = incompleteTasks.findIndex((task) => task.id === active.id);
    const newIndex = incompleteTasks.findIndex((task) => task.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...incompleteTasks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered.map((task) => task.id));
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {readOnly ? (
        tasks.map((task) => (
          <TaskListItem
            key={task.id}
            task={task}
            canToggle={false}
            onToggle={onToggle}
            readOnly
          />
        ))
      ) : (
        <>
          {incompleteTasks.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={incompleteTasks.map((task) => task.id)}
                strategy={verticalListSortingStrategy}
              >
                {incompleteTasks.map((task) => (
                  <SortableTaskListItem
                    key={task.id}
                    task={task}
                    canToggle={canToggle(task)}
                    onToggle={onToggle}
                    onDelete={task.habitId ? undefined : onDelete}
                    onUntrack={onUntrack}
                    allowHabitUntrack={allowHabitUntrack}
                    onUpdate={task.habitId ? undefined : onUpdate}
                    onCreateSubtask={onCreateSubtask}
                    onToggleSubtask={onToggleSubtask}
                    onUpdateSubtask={onUpdateSubtask}
                    onDeleteSubtask={onDeleteSubtask}
                    onTransfer={onTransfer}
                    transferringTaskId={transferringTaskId}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          {completedTasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              canToggle={canToggle(task)}
              onToggle={onToggle}
              onUntrack={onUntrack}
              allowHabitUntrack={allowHabitUntrack}
              onCreateSubtask={onCreateSubtask}
              onToggleSubtask={onToggleSubtask}
            />
          ))}
        </>
      )}
    </div>
  );
}
