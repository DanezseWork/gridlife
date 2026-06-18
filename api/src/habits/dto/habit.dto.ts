import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { HABIT_ICON_IDS } from '../habit-icons';
import type { HabitFrequency } from '../habit-schedule.types';

class YearlyScheduleEntryDto {
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsInt()
  @Min(1)
  @Max(31)
  day: number;
}

export class CreateHabitDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color?: string;

  @IsOptional()
  @IsString()
  @Matches(new RegExp(`^(${HABIT_ICON_IDS.join('|')})$`))
  icon?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  targetCount?: number;

  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly', 'yearly', 'custom'])
  frequency?: HabitFrequency;

  @ValidateIf((dto: CreateHabitDto) => dto.frequency === 'weekly')
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weeklyDays?: number[];

  @ValidateIf((dto: CreateHabitDto) => dto.frequency === 'monthly')
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(31, { each: true })
  monthlyDays?: number[];

  @ValidateIf((dto: CreateHabitDto) => dto.frequency === 'yearly')
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => YearlyScheduleEntryDto)
  yearlyDays?: YearlyScheduleEntryDto[];

  @ValidateIf((dto: CreateHabitDto) => dto.frequency === 'custom')
  @IsInt()
  @Min(1)
  @Max(365)
  intervalDays?: number;
}

export class UpdateHabitDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color?: string;

  @IsOptional()
  @IsString()
  @Matches(new RegExp(`^(${HABIT_ICON_IDS.join('|')})$`))
  icon?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  targetCount?: number;

  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly', 'yearly', 'custom'])
  frequency?: HabitFrequency;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weeklyDays?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(31, { each: true })
  monthlyDays?: number[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => YearlyScheduleEntryDto)
  yearlyDays?: YearlyScheduleEntryDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  intervalDays?: number;

  @IsOptional()
  archive?: boolean;
}

export class ToggleHabitDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;
}

export class ReorderHabitsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  habitIds: string[];
}
