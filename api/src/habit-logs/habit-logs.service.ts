import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  isLoggableHabitDateKey,
  parseDateKey,
} from '../common/date.utils';
import type { HabitFrequency } from '../habits/habit-schedule.types';
import {
  habitAnchorDateKey,
  isHabitDueOnDate,
  isHabitScheduleDays,
} from '../habits/habit-schedule.utils';

@Injectable()
export class HabitLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async toggle(userId: string, habitId: string, dateStr: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new BadRequestException('Invalid date format');
    }

    if (!isLoggableHabitDateKey(dateStr)) {
      throw new BadRequestException(
        'You can only log habits for today or yesterday',
      );
    }

    const habit = await this.prisma.habit.findUnique({
      where: { id: habitId },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    if (habit.userId !== userId) {
      throw new ForbiddenException();
    }

    const frequency = habit.frequency as HabitFrequency;
    const scheduleDays = isHabitScheduleDays(habit.scheduleDays)
      ? habit.scheduleDays
      : null;
    const anchorDateKey = habitAnchorDateKey(habit.createdAt);

    if (!isHabitDueOnDate(frequency, scheduleDays, dateStr, anchorDateKey)) {
      throw new BadRequestException('This habit is not scheduled for that day');
    }

    const completedDate = parseDateKey(dateStr);

    const existing = await this.prisma.habitLog.findUnique({
      where: {
        habitId_completedDate: {
          habitId,
          completedDate,
        },
      },
    });

    if (!existing) {
      const count = 1;
      await this.prisma.habitLog.create({
        data: { habitId, completedDate, count },
      });

      return {
        count,
        targetCount: habit.targetCount,
        completed: count >= habit.targetCount,
        date: dateStr,
      };
    }

    if (existing.count >= habit.targetCount) {
      await this.prisma.habitLog.delete({ where: { id: existing.id } });
      return {
        count: 0,
        targetCount: habit.targetCount,
        completed: false,
        date: dateStr,
      };
    }

    const count = existing.count + 1;
    await this.prisma.habitLog.update({
      where: { id: existing.id },
      data: { count },
    });

    return {
      count,
      targetCount: habit.targetCount,
      completed: count >= habit.targetCount,
      date: dateStr,
    };
  }
}
