import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PlannedYearlyScheduleEntryDto {
  @ApiProperty({ minimum: 1, example: 1 })
  @IsNumber()
  @Min(1)
  month: number;

  @ApiProperty({ minimum: 1, example: 15 })
  @IsNumber()
  @Min(1)
  day: number;
}

export class CreatePlannedTransactionDto {
  @ApiProperty({ enum: ['income', 'expense', 'transfer'], example: 'expense' })
  @IsIn(['income', 'expense', 'transfer'])
  type: 'income' | 'expense' | 'transfer';

  @ApiProperty({ minimum: 0.01, example: 1200 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'Rent' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'Required for expense and transfer',
    example: 'wallet-uuid',
  })
  @ValidateIf(
    (dto: CreatePlannedTransactionDto) =>
      dto.type === 'expense' || dto.type === 'transfer',
  )
  @IsString()
  fromWalletId?: string;

  @ApiPropertyOptional({
    description: 'Required for income and transfer',
    example: 'wallet-uuid',
  })
  @ValidateIf(
    (dto: CreatePlannedTransactionDto) =>
      dto.type === 'income' || dto.type === 'transfer',
  )
  @IsString()
  toWalletId?: string;

  @ApiProperty({ enum: ['scheduled', 'recurring'], example: 'recurring' })
  @IsIn(['scheduled', 'recurring'])
  kind: 'scheduled' | 'recurring';

  @ApiPropertyOptional({
    description: 'Required when kind is scheduled',
    example: '2026-07-01',
  })
  @ValidateIf((dto: CreatePlannedTransactionDto) => dto.kind === 'scheduled')
  @IsString()
  scheduledDate?: string;

  @ApiPropertyOptional({
    enum: ['weekly', 'monthly', 'yearly'],
    description: 'Required when kind is recurring',
    example: 'monthly',
  })
  @ValidateIf((dto: CreatePlannedTransactionDto) => dto.kind === 'recurring')
  @IsIn(['weekly', 'monthly', 'yearly'])
  frequency?: 'weekly' | 'monthly' | 'yearly';

  @ApiPropertyOptional({
    type: [Number],
    description: 'Required for recurring weekly',
    example: [1],
  })
  @ValidateIf(
    (dto: CreatePlannedTransactionDto) =>
      dto.kind === 'recurring' && dto.frequency === 'weekly',
  )
  @IsArray()
  @IsNumber({}, { each: true })
  weeklyDays?: number[];

  @ApiPropertyOptional({
    type: [Number],
    description: 'Required for recurring monthly',
    example: [1],
  })
  @ValidateIf(
    (dto: CreatePlannedTransactionDto) =>
      dto.kind === 'recurring' && dto.frequency === 'monthly',
  )
  @IsArray()
  @IsNumber({}, { each: true })
  monthlyDays?: number[];

  @ApiPropertyOptional({
    type: [PlannedYearlyScheduleEntryDto],
    description: 'Required for recurring yearly',
    example: [{ month: 12, day: 25 }],
  })
  @ValidateIf(
    (dto: CreatePlannedTransactionDto) =>
      dto.kind === 'recurring' && dto.frequency === 'yearly',
  )
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlannedYearlyScheduleEntryDto)
  yearlyDays?: PlannedYearlyScheduleEntryDto[];

  @ApiPropertyOptional({
    description: 'Recurring start date (YYYY-MM-DD)',
    example: '2026-06-01',
  })
  @ValidateIf((dto: CreatePlannedTransactionDto) => dto.kind === 'recurring')
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Recurring end date (YYYY-MM-DD)',
    example: '2027-06-01',
  })
  @ValidateIf((dto: CreatePlannedTransactionDto) => dto.kind === 'recurring')
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class UpdatePlannedTransactionDto {
  @ApiPropertyOptional({ minimum: 0.01, example: 1300 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ example: 'Updated note' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'Set false to deactivate a planned transaction',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @ApiPropertyOptional({ enum: ['weekly', 'monthly', 'yearly'], example: 'monthly' })
  @IsOptional()
  @IsIn(['weekly', 'monthly', 'yearly'])
  frequency?: 'weekly' | 'monthly' | 'yearly';

  @ApiPropertyOptional({ type: [Number], example: [5] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  weeklyDays?: number[];

  @ApiPropertyOptional({ type: [Number], example: [15] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  monthlyDays?: number[];

  @ApiPropertyOptional({ type: [PlannedYearlyScheduleEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlannedYearlyScheduleEntryDto)
  yearlyDays?: PlannedYearlyScheduleEntryDto[];

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2027-06-01' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
