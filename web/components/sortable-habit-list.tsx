"use client";

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
import { HabitCard } from "@/components/habit-card";
import type { Habit } from "@/lib/api";

interface SortableHabitListProps {
  habits: Habit[];
  weeks: string[][];
  weekCount: number;
  onOpen: (habit: Habit) => void;
  onEdit: (habit: Habit) => void;
  onToggleToday: (habitId: string) => void;
  onReorder: (habitIds: string[]) => void;
}

interface SortableHabitCardProps {
  habit: Habit;
  weeks: string[][];
  weekCount: number;
  onOpen: (habit: Habit) => void;
  onEdit: (habit: Habit) => void;
  onToggleToday: (habitId: string) => void;
}

function SortableHabitCard({
  habit,
  weeks,
  weekCount,
  onOpen,
  onEdit,
  onToggleToday,
}: SortableHabitCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <HabitCard
        habit={habit}
        weeks={weeks}
        weekCount={weekCount}
        onOpen={onOpen}
        onEdit={onEdit}
        onToggleToday={onToggleToday}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

export function SortableHabitList({
  habits,
  weeks,
  weekCount,
  onOpen,
  onEdit,
  onToggleToday,
  onReorder,
}: SortableHabitListProps) {
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

    const oldIndex = habits.findIndex((habit) => habit.id === active.id);
    const newIndex = habits.findIndex((habit) => habit.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...habits];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered.map((habit) => habit.id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={habits.map((habit) => habit.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-3 sm:gap-4">
          {habits.map((habit) => (
            <SortableHabitCard
              key={habit.id}
              habit={habit}
              weeks={weeks}
              weekCount={weekCount}
              onOpen={onOpen}
              onEdit={onEdit}
              onToggleToday={onToggleToday}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
