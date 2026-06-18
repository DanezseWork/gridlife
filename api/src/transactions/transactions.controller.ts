import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiWrappedCreatedResponse,
  ApiWrappedOkResponse,
} from '../common/swagger/api-response.helpers';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';
import { CreateTransactionDto } from './dto/transaction.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all transactions' })
  @ApiWrappedOkResponse('Transaction list', {
    type: 'array',
    items: { type: 'object' },
  })
  findAll(@CurrentUser() user: AuthUser) {
    return this.transactionsService.findAll(user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a transaction',
    description: 'Supports income, expense, and transfer types.',
  })
  @ApiWrappedCreatedResponse('Created transaction')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(user.id, dto);
  }
}
