import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { parseDateKey, todayDateKey } from '../common/date.utils';
import { CreateHabitDto, UpdateHabitDto } from './dto/habit.dto';
import { DEFAULT_HABIT_ICON } from './habit-icons';
import {
  buildHabitScheduleDays,
  computeHabitStreak,
  defaultScheduleDays,
  formatHabitScheduleSummary,
  habitAnchorDateKey,
  isHabitScheduleDays,
} from './habit-schedule.utils';
import type { HabitFrequency, HabitScheduleDays } from './habit-schedule.types';
import { formatDateKeyUtc } from '../common/date.utils';

@Injectable()
export class HabitsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const habits = await this.prisma.habit.findMany({
      where: { userId, archivedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        logs: {
          orderBy: { completedDate: 'desc' },
        },
        daySkips: true,
        tasks: {
          where: { manuallyAdded: true },
          select: { date: true },
        },
      },
    });

    return habits.map((habit) => this.toHabitResponse(habit));
  }

  async create(userId: string, dto: CreateHabitDto) {
    const frequency = dto.frequency ?? 'daily';
    const scheduleDays = this.resolveScheduleDays(frequency, dto);
    const sortOrder = await this.nextSortOrder(userId);

    const habit = await this.prisma.habit.create({
      data: {
        userId,
        name: dto.name,
        color: dto.color ?? '#00ffff',
        icon: dto.icon ?? DEFAULT_HABIT_ICON,
        targetCount: dto.targetCount ?? 1,
        frequency,
        scheduleDays: scheduleDays ?? undefined,
        sortOrder,
        trackingEnabled: dto.trackingEnabled ?? true,
      },
      include: {
        logs: true,
        daySkips: true,
        tasks: { where: { manuallyAdded: true }, select: { date: true } },
      },
    });

    return this.toHabitResponse(habit);
  }

  async reorder(userId: string, habitIds: string[]) {
    const habits = await this.prisma.habit.findMany({
      where: { userId, archivedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    if (habitIds.length !== habits.length) {
      throw new BadRequestException(
        'Habit list must include all active habits',
      );
    }

    const habitIdSet = new Set(habits.map((habit) => habit.id));
    for (const id of habitIds) {
      if (!habitIdSet.has(id)) {
        throw new BadRequestException('Invalid habit in reorder list');
      }
    }

    await this.prisma.$transaction(
      habitIds.map((id, index) =>
        this.prisma.habit.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    await this.syncIncompleteHabitTaskOrders(userId, habitIds);

    return this.findAll(userId);
  }

  async update(userId: string, habitId: string, dto: UpdateHabitDto) {
    await this.ensureOwnership(userId, habitId);

    const frequency = dto.frequency;
    const scheduleDays =
      frequency !== undefined
        ? this.resolveScheduleDays(frequency, dto)
        : undefined;

    const habit = await this.prisma.habit.update({
      where: { id: habitId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.targetCount !== undefined && { targetCount: dto.targetCount }),
        ...(frequency !== undefined && { frequency }),
        ...(scheduleDays !== undefined && {
          scheduleDays:
            scheduleDays === null
              ? Prisma.DbNull
              : (scheduleDays as Prisma.InputJsonValue),
        }),
        ...(dto.archive === true && { archivedAt: new Date() }),
        ...(dto.archive === false && { archivedAt: null }),
        ...(dto.trackingEnabled !== undefined && {
          trackingEnabled: dto.trackingEnabled,
        }),
      },
      include: {
        logs: true,
        daySkips: true,
        tasks: { where: { manuallyAdded: true }, select: { date: true } },
      },
    });

    return this.toHabitResponse(habit);
  }

  private resolveScheduleDays(
    frequency: HabitFrequency,
    dto: CreateHabitDto | UpdateHabitDto,
  ): HabitScheduleDays | null {
    if (frequency === 'daily') return null;

    const hasScheduleInput =
      dto.weeklyDays !== undefined ||
      dto.monthlyDays !== undefined ||
      dto.yearlyDays !== undefined ||
      dto.intervalDays !== undefined;

    if (!hasScheduleInput) {
      return defaultScheduleDays(frequency);
    }

    return buildHabitScheduleDays(
      frequency,
      dto.weeklyDays,
      dto.monthlyDays,
      dto.yearlyDays,
      dto.intervalDays,
    );
  }

  private async nextSortOrder(userId: string) {
    const result = await this.prisma.habit.aggregate({
      where: { userId, archivedAt: null },
      _max: { sortOrder: true },
    });

    return (result._max?.sortOrder ?? -1) + 1;
  }

  private async syncIncompleteHabitTaskOrders(
    userId: string,
    orderedHabitIds: string[],
  ) {
    const sortOrderByHabitId = new Map(
      orderedHabitIds.map((id, index) => [id, index]),
    );
    const today = parseDateKey(todayDateKey());

    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        habitId: { not: null },
        completedAt: null,
        date: { gte: today },
      },
    });

    if (tasks.length === 0) return;

    await this.prisma.$transaction(
      tasks
        .map((task) => {
          const sortOrder = sortOrderByHabitId.get(task.habitId!);
          if (sortOrder === undefined) return null;

          return this.prisma.task.update({
            where: { id: task.id },
            data: { sortOrder },
          });
        })
        .filter((update) => update !== null),
    );
  }

  private toHabitResponse(habit: {
    id: string;
    name: string;
    color: string;
    icon: string;
    targetCount: number;
    frequency: string;
    scheduleDays: unknown;
    sortOrder: number;
    trackingEnabled: boolean;
    createdAt: Date;
    logs: { id: string; completedDate: Date; count: number }[];
    daySkips: { date: Date }[];
    tasks: { date: Date }[];
  }) {
    const frequency = habit.frequency as HabitFrequency;
    const scheduleDays = isHabitScheduleDays(habit.scheduleDays)
      ? habit.scheduleDays
      : null;
    const anchorDateKey = habitAnchorDateKey(habit.createdAt);

    return {
      id: habit.id,
      name: habit.name,
      color: habit.color,
      icon: habit.icon,
      targetCount: habit.targetCount,
      frequency,
      scheduleDays,
      scheduleSummary: formatHabitScheduleSummary(frequency, scheduleDays),
      sortOrder: habit.sortOrder,
      trackingEnabled: habit.trackingEnabled,
      createdAt: habit.createdAt,
      streak: computeHabitStreak(
        frequency,
        scheduleDays,
        habit.logs,
        habit.targetCount,
        anchorDateKey,
      ),
      logs: habit.logs.map((l) => ({
        id: l.id,
        completedDate: formatDateKeyUtc(l.completedDate),
        count: l.count,
      })),
      skippedDates: habit.daySkips.map((skip) =>
        formatDateKeyUtc(skip.date),
      ),
      manuallyAddedDates: habit.tasks.map((task) =>
        formatDateKeyUtc(task.date),
      ),
    };
  }

  private async ensureOwnership(userId: string, habitId: string) {
    const habit = await this.prisma.habit.findUnique({
      where: { id: habitId },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    if (habit.userId !== userId) {
      throw new ForbiddenException();
    }
  }
}
