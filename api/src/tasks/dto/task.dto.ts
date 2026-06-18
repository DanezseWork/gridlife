import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  details?: string;
}

export class CreateSubtaskDto {
  @IsString()
  title: string;
}

export class UpdateSubtaskDto {
  @IsString()
  title: string;
}

export class TaskDateQueryDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;
}

export class TaskCalendarQueryDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/)
  month: string;
}

export class ReorderTasksDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @IsArray()
  @IsUUID('4', { each: true })
  taskIds: string[];
}
