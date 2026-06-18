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
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  baseColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  accentColor?: string;

  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_CURRENCIES)
  currency?: string;
}
