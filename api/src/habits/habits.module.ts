import { Module } from '@nestjs/common';
import { HabitLogsModule } from '../habit-logs/habit-logs.module';
import { TasksModule } from '../tasks/tasks.module';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';

@Module({
  imports: [HabitLogsModule, TasksModule],
  controllers: [HabitsController],
  providers: [HabitsService],
})
export class HabitsModule {}
