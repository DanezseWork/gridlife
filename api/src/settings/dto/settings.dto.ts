import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

const ALLOWED_CURRENCIES = [
  'PHP',
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'SGD',
  'INR',
  'CNY',
  'KRW',
  'THB',
  'MYR',
  'IDR',
  'VND',
  'HKD',
  'NZD',
  'CHF',
] as const;

export class UpdateSettingsDto {
  @ApiPropertyOptional({
    description: 'App base theme color (hex)',
    example: '#0f172a',
    pattern: '^#[0-9a-fA-F]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  baseColor?: string;

  @ApiPropertyOptional({
    description: 'App accent color (hex)',
    example: '#6366f1',
    pattern: '^#[0-9a-fA-F]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  accentColor?: string;

  @ApiPropertyOptional({
    enum: ALLOWED_CURRENCIES,
    description: 'Default display currency',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_CURRENCIES)
  currency?: string;
}
