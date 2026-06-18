import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class YearlyScheduleEntryDto {
  @ApiProperty({ minimum: 1, maximum: 12, example: 6 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ minimum: 1, maximum: 31, example: 15 })
  @IsInt()
  @Min(1)
  @Max(31)
  day: number;
}

export class CreateHabitDto {
  @ApiProperty({ example: 'Morning run' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Hex color',
    example: '#3b82f6',
    pattern: '^#[0-9a-fA-F]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color?: string;

  @ApiPropertyOptional({
    description: 'Icon id from the habit icon set',
    example: 'activity',
    enum: HABIT_ICON_IDS,
  })
  @IsOptional()
  @IsString()
  @Matches(new RegExp(`^(${HABIT_ICON_IDS.join('|')})$`))
  icon?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 10, default: 1, example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  targetCount?: number;

  @ApiPropertyOptional({
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
    default: 'daily',
    example: 'daily',
  })
  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly', 'yearly', 'custom'])
  frequency?: HabitFrequency;

  @ApiPropertyOptional({
    description: 'Required when frequency is weekly. 0=Sunday through 6=Saturday.',
    type: [Number],
    example: [1, 3, 5],
  })
  @ValidateIf((dto: CreateHabitDto) => dto.frequency === 'weekly')
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weeklyDays?: number[];

  @ApiPropertyOptional({
    description: 'Required when frequency is monthly. Days of month (1-31).',
    type: [Number],
    example: [1, 15],
  })
  @ValidateIf((dto: CreateHabitDto) => dto.frequency === 'monthly')
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(31, { each: true })
  monthlyDays?: number[];

  @ApiPropertyOptional({
    description: 'Required when frequency is yearly.',
    type: [YearlyScheduleEntryDto],
    example: [{ month: 1, day: 1 }],
  })
  @ValidateIf((dto: CreateHabitDto) => dto.frequency === 'yearly')
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => YearlyScheduleEntryDto)
  yearlyDays?: YearlyScheduleEntryDto[];

  @ApiPropertyOptional({
    description: 'Required when frequency is custom. Repeat every N days.',
    minimum: 1,
    maximum: 365,
    example: 3,
  })
  @ValidateIf((dto: CreateHabitDto) => dto.frequency === 'custom')
  @IsInt()
  @Min(1)
  @Max(365)
  intervalDays?: number;
}

export class UpdateHabitDto {
  @ApiPropertyOptional({ example: 'Evening walk' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '#22c55e', pattern: '^#[0-9a-fA-F]{6}$' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color?: string;

  @ApiPropertyOptional({ enum: HABIT_ICON_IDS, example: 'footprints' })
  @IsOptional()
  @IsString()
  @Matches(new RegExp(`^(${HABIT_ICON_IDS.join('|')})$`))
  icon?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 10, example: 2 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  targetCount?: number;

  @ApiPropertyOptional({
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
    example: 'weekly',
  })
  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly', 'yearly', 'custom'])
  frequency?: HabitFrequency;

  @ApiPropertyOptional({ type: [Number], example: [0, 6] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weeklyDays?: number[];

  @ApiPropertyOptional({ type: [Number], example: [10, 20] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(31, { each: true })
  monthlyDays?: number[];

  @ApiPropertyOptional({ type: [YearlyScheduleEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => YearlyScheduleEntryDto)
  yearlyDays?: YearlyScheduleEntryDto[];

  @ApiPropertyOptional({ minimum: 1, maximum: 365, example: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  intervalDays?: number;

  @ApiPropertyOptional({
    description: 'Set true to archive (soft-delete) the habit',
    example: true,
  })
  @IsOptional()
  archive?: boolean;
}

export class ToggleHabitDto {
  @ApiProperty({
    description: 'Date to toggle completion for (YYYY-MM-DD)',
    example: '2026-06-18',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;
}

export class ReorderHabitsDto {
  @ApiProperty({
    description: 'Habit ids in desired display order',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  habitIds: string[];
}
