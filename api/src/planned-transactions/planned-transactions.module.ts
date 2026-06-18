import { Module } from '@nestjs/common';
import { PlannedTransactionsController } from './planned-transactions.controller';
import { PlannedTransactionsService } from './planned-transactions.service';

@Module({
  controllers: [PlannedTransactionsController],
  providers: [PlannedTransactionsService],
  exports: [PlannedTransactionsService],
})
export class PlannedTransactionsModule {}
