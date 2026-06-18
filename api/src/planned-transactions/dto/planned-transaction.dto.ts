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

class YearlyScheduleEntryDto {
  @IsNumber()
  @Min(1)
  month: number;

  @IsNumber()
  @Min(1)
  day: number;
}

export class CreatePlannedTransactionDto {
  @IsIn(['income', 'expense', 'transfer'])
  type: 'income' | 'expense' | 'transfer';

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @ValidateIf(
    (dto: CreatePlannedTransactionDto) =>
      dto.type === 'expense' || dto.type === 'transfer',
  )
  @IsString()
  fromWalletId?: string;

  @ValidateIf(
    (dto: CreatePlannedTransactionDto) =>
      dto.type === 'income' || dto.type === 'transfer',
  )
  @IsString()
  toWalletId?: string;

  @IsIn(['scheduled', 'recurring'])
  kind: 'scheduled' | 'recurring';

  @ValidateIf((dto: CreatePlannedTransactionDto) => dto.kind === 'scheduled')
  @IsString()
  scheduledDate?: string;

  @ValidateIf((dto: CreatePlannedTransactionDto) => dto.kind === 'recurring')
  @IsIn(['weekly', 'monthly', 'yearly'])
  frequency?: 'weekly' | 'monthly' | 'yearly';

  @ValidateIf(
    (dto: CreatePlannedTransactionDto) =>
      dto.kind === 'recurring' && dto.frequency === 'weekly',
  )
  @IsArray()
  @IsNumber({}, { each: true })
  weeklyDays?: number[];

  @ValidateIf(
    (dto: CreatePlannedTransactionDto) =>
      dto.kind === 'recurring' && dto.frequency === 'monthly',
  )
  @IsArray()
  @IsNumber({}, { each: true })
  monthlyDays?: number[];

  @ValidateIf(
    (dto: CreatePlannedTransactionDto) =>
      dto.kind === 'recurring' && dto.frequency === 'yearly',
  )
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => YearlyScheduleEntryDto)
  yearlyDays?: YearlyScheduleEntryDto[];

  @ValidateIf((dto: CreatePlannedTransactionDto) => dto.kind === 'recurring')
  @IsOptional()
  @IsString()
  startDate?: string;

  @ValidateIf((dto: CreatePlannedTransactionDto) => dto.kind === 'recurring')
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class UpdatePlannedTransactionDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @IsOptional()
  @IsIn(['weekly', 'monthly', 'yearly'])
  frequency?: 'weekly' | 'monthly' | 'yearly';

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  weeklyDays?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  monthlyDays?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => YearlyScheduleEntryDto)
  yearlyDays?: YearlyScheduleEntryDto[];

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
