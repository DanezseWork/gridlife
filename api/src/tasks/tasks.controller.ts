import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiWrappedCreatedResponse,
  ApiWrappedOkResponse,
} from '../common/swagger/api-response.helpers';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';
import {
  CreateTaskDto,
  CreateHabitTaskDto,
  CreateSubtaskDto,
  ReorderTasksDto,
  TaskCalendarQueryDto,
  TaskDateQueryDto,
  UpdateTaskDto,
  UpdateSubtaskDto,
} from './dto/task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks for a date' })
  @ApiWrappedOkResponse('Tasks for the given date', {
    type: 'array',
    items: { type: 'object' },
  })
  findForDate(@CurrentUser() user: AuthUser, @Query() query: TaskDateQueryDto) {
    return this.tasksService.findForDate(user.id, query.date);
  }

  @Get('available-habits')
  @ApiOperation({ summary: 'List tracked habits that can be added to a date' })
  @ApiWrappedOkResponse('Available habits for the date', {
    type: 'array',
    items: { type: 'object' },
  })
  findAvailableHabits(
    @CurrentUser() user: AuthUser,
    @Query() query: TaskDateQueryDto,
  ) {
    return this.tasksService.findAvailableHabits(user.id, query.date);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get monthly task calendar summary' })
  @ApiWrappedOkResponse('Calendar summary for the month', {
    type: 'array',
    items: { type: 'object' },
  })
  getCalendar(
    @CurrentUser() user: AuthUser,
    @Query() query: TaskCalendarQueryDto,
  ) {
    return this.tasksService.getCalendarSummary(user.id, query.month);
  }

  @Post()
  @ApiOperation({ summary: 'Create a task' })
  @ApiWrappedCreatedResponse('Created task')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.id, dto);
  }

  @Post('habit')
  @ApiOperation({ summary: 'Add a tracked habit to a date' })
  @ApiWrappedCreatedResponse('Created habit task')
  createHabitTask(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateHabitTaskDto,
  ) {
    return this.tasksService.createHabitTask(user.id, dto.habitId, dto.date);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder tasks for a date' })
  @ApiWrappedOkResponse('Reordered tasks', {
    type: 'array',
    items: { type: 'object' },
  })
  reorder(@CurrentUser() user: AuthUser, @Body() dto: ReorderTasksDto) {
    return this.tasksService.reorder(user.id, dto.date, dto.taskIds);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  @ApiWrappedOkResponse('Updated task')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.id, id, dto);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Toggle task completion' })
  @ApiWrappedOkResponse('Updated task')
  toggle(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tasksService.toggle(user.id, id);
  }

  @Post(':id/untrack')
  @ApiOperation({ summary: 'Remove a habit from a day without pausing tracking' })
  @ApiWrappedOkResponse('Habit untracked for the day', { type: 'null', nullable: true })
  untrackHabit(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tasksService.untrackHabit(user.id, id);
  }

  @Post(':id/transfer-to-today')
  @ApiOperation({ summary: 'Move a yesterday task to today' })
  @ApiWrappedOkResponse('Transferred task')
  transferToToday(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tasksService.transferToToday(user.id, id);
  }

  @Post(':id/subtasks')
  @ApiOperation({ summary: 'Add a subtask' })
  @ApiWrappedCreatedResponse('Created subtask')
  createSubtask(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateSubtaskDto,
  ) {
    return this.tasksService.createSubtask(user.id, id, dto);
  }

  @Post(':id/subtasks/:subtaskId/toggle')
  @ApiOperation({ summary: 'Toggle subtask completion' })
  @ApiWrappedOkResponse('Updated subtask')
  toggleSubtask(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('subtaskId') subtaskId: string,
  ) {
    return this.tasksService.toggleSubtask(user.id, id, subtaskId);
  }

  @Patch(':id/subtasks/:subtaskId')
  @ApiOperation({ summary: 'Update a subtask title' })
  @ApiWrappedOkResponse('Updated subtask')
  updateSubtask(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('subtaskId') subtaskId: string,
    @Body() dto: UpdateSubtaskDto,
  ) {
    return this.tasksService.updateSubtask(user.id, id, subtaskId, dto);
  }

  @Delete(':id/subtasks/:subtaskId')
  @ApiOperation({ summary: 'Delete a subtask' })
  @ApiWrappedOkResponse('Subtask deleted', { type: 'null', nullable: true })
  removeSubtask(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('subtaskId') subtaskId: string,
  ) {
    return this.tasksService.removeSubtask(user.id, id, subtaskId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiWrappedOkResponse('Task deleted', { type: 'null', nullable: true })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tasksService.remove(user.id, id);
  }
}
