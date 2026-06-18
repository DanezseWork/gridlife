import { Module } from '@nestjs/common';
import { HabitLogsModule } from '../habit-logs/habit-logs.module';
import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';

@Module({
  imports: [HabitLogsModule],
  controllers: [HabitsController],
  providers: [HabitsService],
})
export class HabitsModule {}
