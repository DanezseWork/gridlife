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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiWrappedCreatedResponse,
  ApiWrappedOkResponse,
} from '../common/swagger/api-response.helpers';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/types/auth-user';
import {
  CreatePlannedTransactionDto,
  UpdatePlannedTransactionDto,
} from './dto/planned-transaction.dto';
import { ProjectionQueryDto } from './dto/projection-query.dto';
import { PlannedTransactionsService } from './planned-transactions.service';

@ApiTags('planned-transactions')
@ApiBearerAuth()
@Controller('planned-transactions')
export class PlannedTransactionsController {
  constructor(
    private readonly plannedTransactionsService: PlannedTransactionsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List planned transactions' })
  @ApiWrappedOkResponse('Planned transaction list', {
    type: 'array',
    items: { type: 'object' },
  })
  findAll(@CurrentUser() user: AuthUser) {
    return this.plannedTransactionsService.findAll(user.id);
  }

  @Get('queue')
  @ApiOperation({
    summary: 'Get upcoming planned transaction queue',
    description: 'Returns materialized upcoming occurrences ready to post.',
  })
  @ApiWrappedOkResponse('Planned queue', {
    type: 'array',
    items: { type: 'object' },
  })
  getQueue(@CurrentUser() user: AuthUser) {
    return this.plannedTransactionsService.getQueue(user.id);
  }

  @Get('projection')
  @ApiOperation({
    summary: 'Get balance projection over time',
    description:
      'Projects wallet totals forward by unit/count. Legacy `range` is an alias for `unit` when unit is omitted.',
  })
  @ApiWrappedOkResponse('Projection points', {
    type: 'array',
    items: { type: 'object' },
  })
  getProjection(
    @CurrentUser() user: AuthUser,
    @Query() query: ProjectionQueryDto,
  ) {
    let safeUnit: 'week' | 'month' | 'year' = 'month';
    let safeCount = 1;

    if (query.unit === 'week' || query.unit === 'month' || query.unit === 'year') {
      safeUnit = query.unit;
      const parsed = Number.parseInt(query.count ?? '1', 10);
      safeCount = Number.isFinite(parsed) ? parsed : 1;
    } else if (
      query.range === 'week' ||
      query.range === 'month' ||
      query.range === 'year'
    ) {
      safeUnit = query.range;
    }

    return this.plannedTransactionsService.getProjection(
      user.id,
      safeUnit,
      safeCount,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create a planned transaction',
    description: 'Supports scheduled one-off and recurring rules.',
  })
  @ApiWrappedCreatedResponse('Created planned transaction')
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePlannedTransactionDto,
  ) {
    return this.plannedTransactionsService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a planned transaction',
    description: 'Set active: false to deactivate.',
  })
  @ApiWrappedOkResponse('Updated planned transaction')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePlannedTransactionDto,
  ) {
    return this.plannedTransactionsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a planned transaction' })
  @ApiWrappedOkResponse('Planned transaction deleted', {
    type: 'null',
    nullable: true,
  })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.plannedTransactionsService.remove(user.id, id);
  }
}
