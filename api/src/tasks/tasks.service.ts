import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  formatDateKeyUtc,
  isLoggableHabitDateKey,
  parseDateKey,
  todayDateKey,
  yesterdayDateKey,
} from '../common/date.utils';
import type { HabitFrequency } from '../habits/habit-schedule.types';
import {
  formatHabitScheduleSummary,
  habitAnchorDateKey,
  isHabitDueOnDate,
  isHabitScheduleDays,
} from '../habits/habit-schedule.utils';
import { HabitLogsService } from '../habit-logs/habit-logs.service';
import {
  CreateTaskDto,
  CreateSubtaskDto,
  UpdateSubtaskDto,
  UpdateTaskDto,
} from './dto/task.dto';

type SubtaskRecord = {
  id: string;
  title: string;
  completedAt: Date | null;
  sortOrder: number;
  createdAt: Date;
};

type TaskWithHabit = {
  id: string;
  title: string;
  details: string | null;
  date: Date;
  completedAt: Date | null;
  habitId: string | null;
  manuallyAdded: boolean;
  sortOrder: number;
  createdAt: Date;
  subtasks: SubtaskRecord[];
  habit: {
    id: string;
    name: string;
    color: string;
    icon: string;
    targetCount: number;
    frequency: string;
    scheduleDays: unknown;
    createdAt: Date;
    logs: { count: number }[];
  } | null;
};

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly habitLogsService: HabitLogsService,
  ) {}

  async findForDate(userId: string, dateKey: string) {
    await this.syncHabitTasksForDate(userId, dateKey);
    const tasks = await this.findTasksForDate(userId, dateKey);
    return this.sortTasks(tasks, dateKey).map((task) =>
      this.toTaskResponse(task, dateKey),
    );
  }

  async transferToToday(userId: string, taskId: string) {
    const task = await this.ensureStandaloneTask(userId, taskId);
    const dateKey = formatDateKeyUtc(task.date);

    if (dateKey !== yesterdayDateKey()) {
      throw new BadRequestException(
        'Only yesterday tasks can be transferred to today',
      );
    }

    if (task.completedAt) {
      throw new BadRequestException('Completed tasks cannot be transferred');
    }

    const todayKey = todayDateKey();
    const todayDate = parseDateKey(todayKey);
    const sortOrder = await this.nextSortOrder(userId, todayDate);

    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data: { date: todayDate, sortOrder },
      include: {
        subtasks: { orderBy: { sortOrder: 'asc' } },
        habit: { include: { logs: true } },
      },
    });

    return this.toTaskResponse(updated, todayKey);
  }

  async reorder(userId: string, dateKey: string, taskIds: string[]) {
    this.assertDateEditable(dateKey);
    await this.syncHabitTasksForDate(userId, dateKey);
    const tasks = await this.findTasksForDate(userId, dateKey);
    const incompleteTasks = tasks.filter(
      (task) => !this.isTaskCompleted(task, dateKey),
    );
    const incompleteIds = new Set(incompleteTasks.map((task) => task.id));

    if (taskIds.length !== incompleteTasks.length) {
      throw new BadRequestException(
        'Task list must include all incomplete tasks for this date',
      );
    }

    for (const id of taskIds) {
      if (!incompleteIds.has(id)) {
        throw new BadRequestException('Invalid task in reorder list');
      }
    }

    await this.prisma.$transaction(
      taskIds.map((id, index) =>
        this.prisma.task.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    const refreshed = await this.findTasksForDate(userId, dateKey);
    return this.sortTasks(refreshed, dateKey).map((task) =>
      this.toTaskResponse(task, dateKey),
    );
  }

  async getCalendarSummary(userId: string, monthKey: string) {
    const [year, month] = monthKey.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));
    const daysInMonth = end.getUTCDate();

    const habits = await this.prisma.habit.findMany({
      where: { userId, archivedAt: null },
      include: {
        logs: {
          where: {
            completedDate: {
              gte: start,
              lte: end,
            },
          },
        },
      },
    });

    const habitTasks = await this.prisma.task.findMany({
      where: {
        userId,
        habitId: { not: null },
        date: { gte: start, lte: end },
      },
      include: {
        habit: {
          include: {
            logs: {
              where: {
                completedDate: {
                  gte: start,
                  lte: end,
                },
              },
            },
          },
        },
      },
    });

    const habitDaySkips = await this.prisma.habitDaySkip.findMany({
      where: {
        habit: { userId },
        date: { gte: start, lte: end },
      },
    });

    const skippedHabitsByDate = new Map<string, Set<string>>();
    for (const skip of habitDaySkips) {
      const dateKey = formatDateKeyUtc(skip.date);
      const skipped = skippedHabitsByDate.get(dateKey) ?? new Set<string>();
      skipped.add(skip.habitId);
      skippedHabitsByDate.set(dateKey, skipped);
    }

    const standaloneTasks = await this.prisma.task.findMany({
      where: {
        userId,
        habitId: null,
        date: { gte: start, lte: end },
      },
    });

    const days: Array<{
      date: string;
      total: number;
      completed: number;
      completedHabits: Array<{ id: string; color: string }>;
    }> = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(year, month - 1, day));
      const dateKey = formatDateKeyUtc(date);
      const skippedHabitIds = skippedHabitsByDate.get(dateKey) ?? new Set<string>();

      let total = 0;
      let completed = 0;
      const completedHabits: Array<{ id: string; color: string }> = [];
      const countedHabitIds = new Set<string>();

      for (const habit of habits) {
        if (!habit.trackingEnabled) {
          continue;
        }

        if (skippedHabitIds.has(habit.id)) {
          continue;
        }

        const frequency = habit.frequency as HabitFrequency;
        const scheduleDays = isHabitScheduleDays(habit.scheduleDays)
          ? habit.scheduleDays
          : null;
        const anchorDateKey = habitAnchorDateKey(habit.createdAt);

        if (
          !isHabitDueOnDate(frequency, scheduleDays, dateKey, anchorDateKey)
        ) {
          continue;
        }

        countedHabitIds.add(habit.id);
        total += 1;
        const log = habit.logs.find(
          (entry) => formatDateKeyUtc(entry.completedDate) === dateKey,
        );
        if (log && log.count >= habit.targetCount) {
          completed += 1;
          completedHabits.push({ id: habit.id, color: habit.color });
        }
      }

      for (const task of habitTasks) {
        if (formatDateKeyUtc(task.date) !== dateKey || !task.habit) continue;
        if (countedHabitIds.has(task.habit.id)) continue;
        if (!task.habit.trackingEnabled) continue;

        countedHabitIds.add(task.habit.id);
        total += 1;
        const log = task.habit.logs.find(
          (entry) => formatDateKeyUtc(entry.completedDate) === dateKey,
        );
        if (log && log.count >= task.habit.targetCount) {
          completed += 1;
          completedHabits.push({ id: task.habit.id, color: task.habit.color });
        }
      }

      for (const task of standaloneTasks) {
        if (formatDateKeyUtc(task.date) !== dateKey) continue;
        total += 1;
        if (task.completedAt) completed += 1;
      }

      days.push({ date: dateKey, total, completed, completedHabits });
    }

    return days;
  }

  async findAvailableHabits(userId: string, dateKey: string) {
    await this.syncHabitTasksForDate(userId, dateKey);
    const date = parseDateKey(dateKey);

    const existingHabitIds = await this.prisma.task.findMany({
      where: { userId, date, habitId: { not: null } },
      select: { habitId: true },
    });
    const onDay = new Set(
      existingHabitIds
        .map((task) => task.habitId)
        .filter((id): id is string => id !== null),
    );

    const habits = await this.prisma.habit.findMany({
      where: {
        userId,
        archivedAt: null,
        trackingEnabled: true,
        id: { notIn: [...onDay] },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return habits.map((habit) => {
      const frequency = habit.frequency as HabitFrequency;
      const scheduleDays = isHabitScheduleDays(habit.scheduleDays)
        ? habit.scheduleDays
        : null;

      return {
        id: habit.id,
        name: habit.name,
        color: habit.color,
        icon: habit.icon,
        scheduleSummary: formatHabitScheduleSummary(frequency, scheduleDays),
      };
    });
  }

  async createHabitTask(userId: string, habitId: string, dateKey: string) {
    this.assertDateNotPast(dateKey);
    const date = parseDateKey(dateKey);

    const habit = await this.prisma.habit.findUnique({
      where: { id: habitId },
    });

    if (!habit || habit.archivedAt) {
      throw new NotFoundException('Habit not found');
    }

    if (habit.userId !== userId) {
      throw new ForbiddenException();
    }

    if (!habit.trackingEnabled) {
      throw new BadRequestException('Tracking is paused for this habit');
    }

    const existing = await this.prisma.task.findUnique({
      where: {
        habitId_date: {
          habitId,
          date,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('This habit is already on that day');
    }

    await this.prisma.habitDaySkip.deleteMany({
      where: { habitId, date },
    });

    const frequency = habit.frequency as HabitFrequency;
    const scheduleDays = isHabitScheduleDays(habit.scheduleDays)
      ? habit.scheduleDays
      : null;
    const details = formatHabitScheduleSummary(frequency, scheduleDays);
    const sortOrder = await this.nextSortOrder(userId, date);

    const task = await this.prisma.task.create({
      data: {
        userId,
        habitId,
        title: habit.name,
        details,
        date,
        sortOrder,
        manuallyAdded: true,
      },
      include: {
        subtasks: { orderBy: { sortOrder: 'asc' } },
        habit: {
          include: {
            logs: {
              where: { completedDate: date },
            },
          },
        },
      },
    });

    return this.toTaskResponse(task, dateKey);
  }

  async create(userId: string, dto: CreateTaskDto) {
    this.assertDateNotPast(dto.date);
    const date = parseDateKey(dto.date);
    const sortOrder = await this.nextSortOrder(userId, date);
    const task = await this.prisma.task.create({
      data: {
        userId,
        title: dto.title.trim(),
        details: dto.details?.trim() || null,
        date,
        habitId: null,
        sortOrder,
      },
      include: {
        subtasks: { orderBy: { sortOrder: 'asc' } },
        habit: { include: { logs: true } },
      },
    });

    return this.toTaskResponse(task, dto.date);
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    const task = await this.ensureStandaloneTask(userId, taskId);
    this.assertDateEditable(formatDateKeyUtc(task.date));
    this.assertTaskNotCompleted(task);

    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.details !== undefined && {
          details: dto.details.trim() || null,
        }),
      },
      include: {
        subtasks: { orderBy: { sortOrder: 'asc' } },
        habit: { include: { logs: true } },
      },
    });

    return this.toTaskResponse(updated, formatDateKeyUtc(updated.date));
  }

  async remove(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException();
    }

    if (task.habitId) {
      throw new BadRequestException('Use untrack to remove habit tasks');
    }

    this.assertDateEditable(formatDateKeyUtc(task.date));
    this.assertTaskNotCompleted(task);
    await this.prisma.task.delete({ where: { id: task.id } });
  }

  async untrackHabit(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException();
    }

    if (!task.habitId) {
      throw new BadRequestException('Only habit tasks can be untracked');
    }

    await this.skipHabitDay(userId, task.habitId, formatDateKeyUtc(task.date));
  }

  async skipHabitDay(userId: string, habitId: string, dateKey: string) {
    await this.ensureHabitOwnership(userId, habitId);
    this.assertDateNotPast(dateKey);

    const date = parseDateKey(dateKey);

    await this.prisma.$transaction([
      this.prisma.task.deleteMany({
        where: { habitId, date },
      }),
      this.prisma.habitDaySkip.upsert({
        where: {
          habitId_date: {
            habitId,
            date,
          },
        },
        create: {
          habitId,
          date,
        },
        update: {},
      }),
    ]);
  }

  async restoreHabitDay(userId: string, habitId: string, dateKey: string) {
    await this.ensureHabitOwnership(userId, habitId);
    this.assertDateNotPast(dateKey);

    const date = parseDateKey(dateKey);

    await this.prisma.habitDaySkip.deleteMany({
      where: { habitId, date },
    });

    await this.syncHabitTasksForDate(userId, dateKey);
  }

  private async ensureHabitOwnership(userId: string, habitId: string) {
    const habit = await this.prisma.habit.findUnique({ where: { id: habitId } });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    if (habit.userId !== userId) {
      throw new ForbiddenException();
    }

    return habit;
  }

  async createSubtask(userId: string, taskId: string, dto: CreateSubtaskDto) {
    const task = await this.ensureStandaloneTask(userId, taskId);
    const dateKey = formatDateKeyUtc(task.date);
    this.assertDateEditable(dateKey);

    const sortOrder = await this.nextSubtaskSortOrder(taskId);
    const subtask = await this.prisma.subtask.create({
      data: {
        taskId: task.id,
        title: dto.title.trim(),
        sortOrder,
      },
    });

    if (task.completedAt) {
      await this.prisma.task.update({
        where: { id: task.id },
        data: { completedAt: null },
      });
    }

    return this.toSubtaskResponse(subtask);
  }

  async toggleSubtask(userId: string, taskId: string, subtaskId: string) {
    const task = await this.ensureStandaloneTask(userId, taskId);
    const dateKey = formatDateKeyUtc(task.date);
    this.assertDateEditable(dateKey);

    const subtask = await this.prisma.subtask.findUnique({
      where: { id: subtaskId },
    });

    if (!subtask || subtask.taskId !== task.id) {
      throw new NotFoundException('Subtask not found');
    }

    const completing = !subtask.completedAt;
    await this.prisma.subtask.update({
      where: { id: subtaskId },
      data: {
        completedAt: completing ? new Date() : null,
      },
    });

    if (completing) {
      const subtasks = await this.prisma.subtask.findMany({
        where: { taskId: task.id },
      });
      const allComplete = subtasks.every((entry) => entry.completedAt !== null);
      if (allComplete && !task.completedAt) {
        await this.prisma.task.update({
          where: { id: task.id },
          data: { completedAt: new Date() },
        });
      }
    } else if (task.completedAt) {
      await this.prisma.task.update({
        where: { id: task.id },
        data: { completedAt: null },
      });
    }

    const refreshed = await this.prisma.subtask.findUnique({
      where: { id: subtaskId },
    });

    if (!refreshed) {
      throw new NotFoundException('Subtask not found');
    }

    return this.toSubtaskResponse(refreshed);
  }

  async updateSubtask(
    userId: string,
    taskId: string,
    subtaskId: string,
    dto: UpdateSubtaskDto,
  ) {
    const task = await this.ensureStandaloneTask(userId, taskId);
    this.assertDateEditable(formatDateKeyUtc(task.date));

    const subtask = await this.prisma.subtask.findUnique({
      where: { id: subtaskId },
    });

    if (!subtask || subtask.taskId !== task.id) {
      throw new NotFoundException('Subtask not found');
    }

    this.assertSubtaskNotCompleted(subtask);

    const updated = await this.prisma.subtask.update({
      where: { id: subtaskId },
      data: { title: dto.title.trim() },
    });

    return this.toSubtaskResponse(updated);
  }

  async removeSubtask(userId: string, taskId: string, subtaskId: string) {
    const task = await this.ensureStandaloneTask(userId, taskId);
    this.assertDateEditable(formatDateKeyUtc(task.date));

    const subtask = await this.prisma.subtask.findUnique({
      where: { id: subtaskId },
    });

    if (!subtask || subtask.taskId !== task.id) {
      throw new NotFoundException('Subtask not found');
    }

    this.assertSubtaskNotCompleted(subtask);

    await this.prisma.subtask.delete({ where: { id: subtaskId } });
  }

  async toggle(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        subtasks: { orderBy: { sortOrder: 'asc' } },
        habit: {
          include: {
            logs: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException();
    }

    const dateKey = formatDateKeyUtc(task.date);
    this.assertDateEditable(dateKey);

    if (task.habitId && task.habit) {
      if (!isLoggableHabitDateKey(dateKey)) {
        throw new BadRequestException(
          'Habit tasks can only be toggled for today or yesterday',
        );
      }

      await this.habitLogsService.toggle(userId, task.habitId, dateKey);
      await this.syncHabitTasksForDate(userId, dateKey);
      const refreshed = await this.prisma.task.findUnique({
        where: { id: taskId },
        include: {
          subtasks: { orderBy: { sortOrder: 'asc' } },
          habit: { include: { logs: true } },
        },
      });

      if (!refreshed) {
        throw new NotFoundException('Task not found');
      }

      return this.toTaskResponse(refreshed, dateKey);
    }

    if (!task.completedAt && task.subtasks.length > 0) {
      const allSubtasksComplete = task.subtasks.every(
        (subtask) => subtask.completedAt !== null,
      );
      if (!allSubtasksComplete) {
        throw new BadRequestException(
          'Complete all subtasks before marking this task done',
        );
      }
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        completedAt: task.completedAt ? null : new Date(),
      },
      include: {
        subtasks: { orderBy: { sortOrder: 'asc' } },
        habit: { include: { logs: true } },
      },
    });

    return this.toTaskResponse(updated, dateKey);
  }

  private async syncHabitTasksForDate(userId: string, dateKey: string) {
    const date = parseDateKey(dateKey);
    const skippedHabits = await this.prisma.habitDaySkip.findMany({
      where: {
        date,
        habit: { userId },
      },
      select: { habitId: true },
    });
    const skippedHabitIds = new Set(skippedHabits.map((skip) => skip.habitId));

    const habits = await this.prisma.habit.findMany({
      where: { userId, archivedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        logs: {
          where: { completedDate: date },
        },
      },
    });

    for (const habit of habits) {
      if (skippedHabitIds.has(habit.id)) {
        await this.prisma.task.deleteMany({
          where: { habitId: habit.id, date },
        });
        continue;
      }

      if (!habit.trackingEnabled) {
        await this.prisma.task.deleteMany({
          where: { habitId: habit.id, date },
        });
        continue;
      }

      const frequency = habit.frequency as HabitFrequency;
      const scheduleDays = isHabitScheduleDays(habit.scheduleDays)
        ? habit.scheduleDays
        : null;
      const anchorDateKey = habitAnchorDateKey(habit.createdAt);

      if (!isHabitDueOnDate(frequency, scheduleDays, dateKey, anchorDateKey)) {
        await this.prisma.task.deleteMany({
          where: { habitId: habit.id, date, manuallyAdded: false },
        });
        continue;
      }

      const log = habit.logs[0];
      const completed = log ? log.count >= habit.targetCount : false;
      const details = formatHabitScheduleSummary(frequency, scheduleDays);

      await this.prisma.task.upsert({
        where: {
          habitId_date: {
            habitId: habit.id,
            date,
          },
        },
        create: {
          userId,
          habitId: habit.id,
          title: habit.name,
          details,
          date,
          sortOrder: habit.sortOrder,
          completedAt: completed ? new Date() : null,
        },
        update: {
          title: habit.name,
          details,
          completedAt: completed ? new Date() : null,
          ...(completed ? {} : { sortOrder: habit.sortOrder }),
        },
      });
    }
  }

  private async findTasksForDate(userId: string, dateKey: string) {
    const date = parseDateKey(dateKey);
    return this.prisma.task.findMany({
      where: { userId, date },
      include: {
        subtasks: { orderBy: { sortOrder: 'asc' } },
        habit: {
          include: {
            logs: {
              where: { completedDate: date },
            },
          },
        },
      },
    });
  }

  private sortTasks(tasks: TaskWithHabit[], dateKey: string) {
    return [...tasks].sort((a, b) => {
      const aCompleted = this.isTaskCompleted(a, dateKey);
      const bCompleted = this.isTaskCompleted(b, dateKey);
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  private async nextSortOrder(userId: string, date: Date) {
    const result = await this.prisma.task.aggregate({
      where: {
        userId,
        date,
        completedAt: null,
      },
      _max: { sortOrder: true },
    });

    return (result._max?.sortOrder ?? -1) + 1;
  }

  private toTaskResponse(task: TaskWithHabit, dateKey: string) {
    const completed = this.isTaskCompleted(task, dateKey);
    const subtasks = [...task.subtasks]
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          a.createdAt.getTime() - b.createdAt.getTime(),
      )
      .map((subtask) => this.toSubtaskResponse(subtask));

    return {
      id: task.id,
      title: task.title,
      details: task.details,
      date: dateKey,
      completed,
      sortOrder: task.sortOrder,
      habitId: task.habitId,
      manuallyAdded: task.manuallyAdded,
      subtasks,
      habit: task.habit
        ? {
            id: task.habit.id,
            name: task.habit.name,
            color: task.habit.color,
            icon: task.habit.icon,
            targetCount: task.habit.targetCount,
            count: task.habit.logs[0]?.count ?? 0,
          }
        : null,
      createdAt: task.createdAt,
    };
  }

  private toSubtaskResponse(subtask: SubtaskRecord) {
    return {
      id: subtask.id,
      title: subtask.title,
      completed: subtask.completedAt !== null,
      sortOrder: subtask.sortOrder,
    };
  }

  private async nextSubtaskSortOrder(taskId: string) {
    const result = await this.prisma.subtask.aggregate({
      where: { taskId, completedAt: null },
      _max: { sortOrder: true },
    });

    return (result._max?.sortOrder ?? -1) + 1;
  }

  private isTaskCompleted(task: TaskWithHabit, dateKey: string): boolean {
    if (task.habitId) {
      return this.isHabitTaskCompleted(task, dateKey);
    }

    return task.completedAt !== null;
  }

  private isHabitTaskCompleted(task: TaskWithHabit, dateKey: string): boolean {
    if (!task.habit) return task.completedAt !== null;

    const log = task.habit.logs.find(
      (entry) => formatDateKeyUtc(task.date) === dateKey,
    );

    return log ? log.count >= task.habit.targetCount : false;
  }

  private async ensureStandaloneTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException();
    }

    if (task.habitId) {
      throw new BadRequestException('Habit-linked tasks cannot be edited');
    }

    return task;
  }

  private assertDateNotPast(dateKey: string) {
    if (dateKey < todayDateKey()) {
      throw new BadRequestException('Past dates are read-only');
    }
  }

  private assertDateEditable(dateKey: string) {
    if (dateKey < yesterdayDateKey()) {
      throw new BadRequestException('Dates older than yesterday are read-only');
    }
  }

  private assertTaskNotCompleted(task: { completedAt: Date | null }) {
    if (task.completedAt) {
      throw new BadRequestException(
        'Completed tasks cannot be edited or deleted',
      );
    }
  }

  private assertSubtaskNotCompleted(subtask: { completedAt: Date | null }) {
    if (subtask.completedAt) {
      throw new BadRequestException(
        'Completed subtasks cannot be edited or deleted',
      );
    }
  }
}
