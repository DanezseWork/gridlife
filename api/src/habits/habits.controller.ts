import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';
import {
  CreateHabitDto,
  ReorderHabitsDto,
  UpdateHabitDto,
} from './dto/habit.dto';
import { HabitsService } from './habits.service';
import { HabitLogsService } from '../habit-logs/habit-logs.service';
import { ToggleHabitDto } from './dto/habit.dto';

@ApiTags('habits')
@ApiBearerAuth()
@Controller('habits')
export class HabitsController {
  constructor(
    private readonly habitsService: HabitsService,
    private readonly habitLogsService: HabitLogsService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.habitsService.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateHabitDto) {
    return this.habitsService.create(user.id, dto);
  }

  @Post('reorder')
  reorder(@CurrentUser() user: AuthUser, @Body() dto: ReorderHabitsDto) {
    return this.habitsService.reorder(user.id, dto.habitIds);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateHabitDto,
  ) {
    return this.habitsService.update(user.id, id, dto);
  }

  @Post(':id/toggle')
  toggle(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ToggleHabitDto,
  ) {
    return this.habitLogsService.toggle(user.id, id, dto.date);
  }
}
