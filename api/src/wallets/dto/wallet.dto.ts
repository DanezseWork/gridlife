import { IsIn, IsNumber, IsOptional, IsString, Matches } from 'class-validator';
import { ALLOWED_WALLET_CURRENCIES } from '../wallet-currencies';

export class CreateWalletDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_WALLET_CURRENCIES)
  currency?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsNumber()
  initialAmount?: number;
}

export class UpdateWalletDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_WALLET_CURRENCIES)
  currency?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}
