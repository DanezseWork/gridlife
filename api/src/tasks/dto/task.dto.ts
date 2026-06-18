import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Buy groceries' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Milk, eggs, bread' })
  @IsOptional()
  @IsString()
  details?: string;

  @ApiProperty({
    description: 'Task date (YYYY-MM-DD)',
    example: '2026-06-18',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Buy groceries and fruit' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated details' })
  @IsOptional()
  @IsString()
  details?: string;
}

export class CreateSubtaskDto {
  @ApiProperty({ example: 'Pick up milk' })
  @IsString()
  title: string;
}

export class UpdateSubtaskDto {
  @ApiProperty({ example: 'Pick up oat milk' })
  @IsString()
  title: string;
}

export class TaskDateQueryDto {
  @ApiProperty({
    description: 'Date to list tasks for (YYYY-MM-DD)',
    example: '2026-06-18',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;
}

export class TaskCalendarQueryDto {
  @ApiProperty({
    description: 'Month to summarize (YYYY-MM)',
    example: '2026-06',
    pattern: '^\\d{4}-\\d{2}$',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  month: string;
}

export class ReorderTasksDto {
  @ApiProperty({
    description: 'Date of the task list being reordered (YYYY-MM-DD)',
    example: '2026-06-18',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @ApiProperty({
    description: 'Task ids in desired display order',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  taskIds: string[];
}
