import { Module } from '@nestjs/common';
import { HabitLogsService } from './habit-logs.service';

@Module({
  providers: [HabitLogsService],
  exports: [HabitLogsService],
})
export class HabitLogsModule {}
