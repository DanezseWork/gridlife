import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, Matches } from 'class-validator';
import { ALLOWED_WALLET_CURRENCIES } from '../wallet-currencies';

export class CreateWalletDto {
  @ApiProperty({ example: 'Cash' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    enum: ALLOWED_WALLET_CURRENCIES,
    example: 'USD',
    description: 'ISO-like currency code',
  })
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_WALLET_CURRENCIES)
  currency?: string;

  @ApiPropertyOptional({
    example: '#6366f1',
    pattern: '^#[0-9a-fA-F]{6}$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color?: string;

  @ApiPropertyOptional({ example: 'wallet' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Opening balance when creating the wallet',
    example: 100,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  initialAmount?: number;
}

export class UpdateWalletDto {
  @ApiPropertyOptional({ example: 'Savings' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ALLOWED_WALLET_CURRENCIES, example: 'EUR' })
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_WALLET_CURRENCIES)
  currency?: string;

  @ApiPropertyOptional({ example: '#10b981', pattern: '^#[0-9a-fA-F]{6}$' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color?: string;

  @ApiPropertyOptional({ example: 'piggy-bank' })
  @IsOptional()
  @IsString()
  icon?: string;
}
