import { Module } from '@nestjs/common';
import { PlannedTransactionsModule } from '../planned-transactions/planned-transactions.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [PlannedTransactionsModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
