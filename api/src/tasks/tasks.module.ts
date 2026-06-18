import { Module } from '@nestjs/common';
import { HabitLogsModule } from '../habit-logs/habit-logs.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [HabitLogsModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
