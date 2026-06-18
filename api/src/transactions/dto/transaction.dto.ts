import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateTransactionDto {
  @IsIn(['income', 'expense', 'transfer'])
  type: 'income' | 'expense' | 'transfer';

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  note?: string;

  @ValidateIf(
    (o: CreateTransactionDto) => o.type === 'expense' || o.type === 'transfer',
  )
  @IsString()
  fromWalletId?: string;

  @ValidateIf(
    (o: CreateTransactionDto) => o.type === 'income' || o.type === 'transfer',
  )
  @IsString()
  toWalletId?: string;
}
