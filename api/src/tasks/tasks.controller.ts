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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';
import {
  CreateTaskDto,
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
  findForDate(@CurrentUser() user: AuthUser, @Query() query: TaskDateQueryDto) {
    return this.tasksService.findForDate(user.id, query.date);
  }

  @Get('calendar')
  getCalendar(
    @CurrentUser() user: AuthUser,
    @Query() query: TaskCalendarQueryDto,
  ) {
    return this.tasksService.getCalendarSummary(user.id, query.month);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(user.id, dto);
  }

  @Post('reorder')
  reorder(@CurrentUser() user: AuthUser, @Body() dto: ReorderTasksDto) {
    return this.tasksService.reorder(user.id, dto.date, dto.taskIds);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.id, id, dto);
  }

  @Post(':id/toggle')
  toggle(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tasksService.toggle(user.id, id);
  }

  @Post(':id/subtasks')
  createSubtask(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateSubtaskDto,
  ) {
    return this.tasksService.createSubtask(user.id, id, dto);
  }

  @Post(':id/subtasks/:subtaskId/toggle')
  toggleSubtask(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('subtaskId') subtaskId: string,
  ) {
    return this.tasksService.toggleSubtask(user.id, id, subtaskId);
  }

  @Patch(':id/subtasks/:subtaskId')
  updateSubtask(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('subtaskId') subtaskId: string,
    @Body() dto: UpdateSubtaskDto,
  ) {
    return this.tasksService.updateSubtask(user.id, id, subtaskId, dto);
  }

  @Delete(':id/subtasks/:subtaskId')
  removeSubtask(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('subtaskId') subtaskId: string,
  ) {
    return this.tasksService.removeSubtask(user.id, id, subtaskId);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.tasksService.remove(user.id, id);
  }
}
