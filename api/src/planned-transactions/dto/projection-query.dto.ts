import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ProjectionQueryDto {
  @ApiPropertyOptional({
    enum: ['week', 'month', 'year'],
    description: 'Legacy alias for unit. Ignored when unit is provided.',
    example: 'month',
  })
  @IsOptional()
  @IsIn(['week', 'month', 'year'])
  range?: 'week' | 'month' | 'year';

  @ApiPropertyOptional({
    enum: ['week', 'month', 'year'],
    description: 'Projection time unit',
    default: 'month',
    example: 'month',
  })
  @IsOptional()
  @IsIn(['week', 'month', 'year'])
  unit?: 'week' | 'month' | 'year';

  @ApiPropertyOptional({
    description: 'Number of units to project forward',
    default: '1',
    example: '3',
  })
  @IsOptional()
  @IsString()
  count?: string;
}
