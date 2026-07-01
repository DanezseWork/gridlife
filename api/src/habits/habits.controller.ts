import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiWrappedCreatedResponse,
  ApiWrappedOkResponse,
} from '../common/swagger/api-response.helpers';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';
import {
  CreateHabitDto,
  ReorderHabitsDto,
  UpdateHabitDto,
} from './dto/habit.dto';
import { HabitsService } from './habits.service';
import { HabitLogsService } from '../habit-logs/habit-logs.service';
import { TasksService } from '../tasks/tasks.service';
import { ToggleHabitDto } from './dto/habit.dto';

@ApiTags('habits')
@ApiBearerAuth()
@Controller('habits')
export class HabitsController {
  constructor(
    private readonly habitsService: HabitsService,
    private readonly habitLogsService: HabitLogsService,
    private readonly tasksService: TasksService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List active habits with logs and streaks' })
  @ApiWrappedOkResponse('Habit list', { type: 'array', items: { type: 'object' } })
  findAll(@CurrentUser() user: AuthUser) {
    return this.habitsService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a habit' })
  @ApiWrappedCreatedResponse('Created habit')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateHabitDto) {
    return this.habitsService.create(user.id, dto);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder habits' })
  @ApiWrappedOkResponse('Reordered habit list', {
    type: 'array',
    items: { type: 'object' },
  })
  reorder(@CurrentUser() user: AuthUser, @Body() dto: ReorderHabitsDto) {
    return this.habitsService.reorder(user.id, dto.habitIds);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a habit',
    description: 'Set archive: true to soft-delete the habit.',
  })
  @ApiWrappedOkResponse('Updated habit')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateHabitDto,
  ) {
    return this.habitsService.update(user.id, id, dto);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Toggle habit completion for a date' })
  @ApiWrappedOkResponse('Toggle result', {
    type: 'object',
    properties: {
      count: { type: 'number', example: 1 },
      targetCount: { type: 'number', example: 1 },
      completed: { type: 'boolean', example: true },
      date: { type: 'string', example: '2026-06-18' },
    },
  })
  toggle(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ToggleHabitDto,
  ) {
    return this.habitLogsService.toggle(user.id, id, dto.date);
  }

  @Post(':id/skip-day')
  @ApiOperation({ summary: 'Remove a habit from a day on the task list' })
  @ApiWrappedOkResponse('Habit skipped for the day', { type: 'null', nullable: true })
  skipDay(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ToggleHabitDto,
  ) {
    return this.tasksService.skipHabitDay(user.id, id, dto.date);
  }

  @Post(':id/restore-day')
  @ApiOperation({ summary: 'Restore a habit to a day on the task list' })
  @ApiWrappedOkResponse('Habit restored for the day', { type: 'null', nullable: true })
  restoreDay(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ToggleHabitDto,
  ) {
    return this.tasksService.restoreHabitDay(user.id, id, dto.date);
  }
}
