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
  CreatePlannedTransactionDto,
  UpdatePlannedTransactionDto,
} from './dto/planned-transaction.dto';
import { PlannedTransactionsService } from './planned-transactions.service';

@ApiTags('planned-transactions')
@ApiBearerAuth()
@Controller('planned-transactions')
export class PlannedTransactionsController {
  constructor(
    private readonly plannedTransactionsService: PlannedTransactionsService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.plannedTransactionsService.findAll(user.id);
  }

  @Get('queue')
  getQueue(@CurrentUser() user: AuthUser) {
    return this.plannedTransactionsService.getQueue(user.id);
  }

  @Get('projection')
  getProjection(
    @CurrentUser() user: AuthUser,
    @Query('range') range?: 'week' | 'month' | 'year',
    @Query('unit') unit?: 'week' | 'month' | 'year',
    @Query('count') count?: string,
  ) {
    let safeUnit: 'week' | 'month' | 'year' = 'month';
    let safeCount = 1;

    if (unit === 'week' || unit === 'month' || unit === 'year') {
      safeUnit = unit;
      const parsed = Number.parseInt(count ?? '1', 10);
      safeCount = Number.isFinite(parsed) ? parsed : 1;
    } else if (range === 'week' || range === 'month' || range === 'year') {
      safeUnit = range;
    }

    return this.plannedTransactionsService.getProjection(
      user.id,
      safeUnit,
      safeCount,
    );
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePlannedTransactionDto,
  ) {
    return this.plannedTransactionsService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePlannedTransactionDto,
  ) {
    return this.plannedTransactionsService.update(user.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.plannedTransactionsService.remove(user.id, id);
  }
}
