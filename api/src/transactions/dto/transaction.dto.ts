import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateTransactionDto {
  @ApiProperty({
    enum: ['income', 'expense', 'transfer'],
    example: 'expense',
  })
  @IsIn(['income', 'expense', 'transfer'])
  type: 'income' | 'expense' | 'transfer';

  @ApiProperty({ minimum: 0.01, example: 42.5 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Transaction date (ISO date string)',
    example: '2026-06-18',
  })
  @IsString()
  date: string;

  @ApiPropertyOptional({ example: 'Coffee' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    description: 'Required for expense and transfer',
    example: 'wallet-uuid',
  })
  @ValidateIf(
    (o: CreateTransactionDto) => o.type === 'expense' || o.type === 'transfer',
  )
  @IsString()
  fromWalletId?: string;

  @ApiPropertyOptional({
    description: 'Required for income and transfer',
    example: 'wallet-uuid',
  })
  @ValidateIf(
    (o: CreateTransactionDto) => o.type === 'income' || o.type === 'transfer',
  )
  @IsString()
  toWalletId?: string;
}
