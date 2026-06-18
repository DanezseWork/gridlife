import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { parseDateKey, todayDateKey } from '../common/date.utils';
import { PrismaService } from '../prisma.service';
import { PlannedTransactionsService } from '../planned-transactions/planned-transactions.service';
import { CreateTransactionDto } from './dto/transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly plannedTransactionsService: PlannedTransactionsService,
  ) {}

  async findAll(userId: string) {
    await this.plannedTransactionsService.materializeDue(userId);

    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: {
        fromWallet: { select: { id: true, name: true, currency: true } },
        toWallet: { select: { id: true, name: true, currency: true } },
      },
    });

    return transactions.map((t) => ({
      ...t,
      amount: t.amount.toString(),
    }));
  }

  async create(userId: string, dto: CreateTransactionDto) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dto.date)) {
      throw new BadRequestException('Invalid date format');
    }

    const today = todayDateKey();
    if (dto.date > today) {
      throw new BadRequestException('Transaction date cannot be in the future');
    }

    const date = parseDateKey(dto.date);
    const amount = new Prisma.Decimal(dto.amount);

    if (dto.type === 'income') {
      if (!dto.toWalletId) {
        throw new BadRequestException('toWalletId required for income');
      }
      await this.ensureWalletOwnership(userId, dto.toWalletId);

      const tx = await this.prisma.transaction.create({
        data: {
          userId,
          type: 'income',
          amount,
          date,
          note: dto.note,
          toWalletId: dto.toWalletId,
        },
        include: this.walletInclude,
      });

      return { ...tx, amount: tx.amount.toString() };
    }

    if (dto.type === 'expense') {
      if (!dto.fromWalletId) {
        throw new BadRequestException('fromWalletId required for expense');
      }
      await this.ensureWalletOwnership(userId, dto.fromWalletId);

      const tx = await this.prisma.transaction.create({
        data: {
          userId,
          type: 'expense',
          amount,
          date,
          note: dto.note,
          fromWalletId: dto.fromWalletId,
        },
        include: this.walletInclude,
      });

      return { ...tx, amount: tx.amount.toString() };
    }

    if (dto.type === 'transfer') {
      if (!dto.fromWalletId || !dto.toWalletId) {
        throw new BadRequestException(
          'fromWalletId and toWalletId required for transfer',
        );
      }
      if (dto.fromWalletId === dto.toWalletId) {
        throw new BadRequestException('Cannot transfer to the same wallet');
      }

      const fromWallet = await this.ensureWalletOwnership(
        userId,
        dto.fromWalletId,
      );
      const toWallet = await this.ensureWalletOwnership(userId, dto.toWalletId);

      if (fromWallet.currency !== toWallet.currency) {
        throw new BadRequestException(
          'Transfers require wallets with the same currency',
        );
      }

      const tx = await this.prisma.$transaction(async (prisma) => {
        return prisma.transaction.create({
          data: {
            userId,
            type: 'transfer',
            amount,
            date,
            note: dto.note,
            fromWalletId: dto.fromWalletId,
            toWalletId: dto.toWalletId,
          },
          include: this.walletInclude,
        });
      });

      return { ...tx, amount: tx.amount.toString() };
    }

    throw new BadRequestException('Invalid transaction type');
  }

  private readonly walletInclude = {
    fromWallet: { select: { id: true, name: true, currency: true } },
    toWallet: { select: { id: true, name: true, currency: true } },
  } as const;

  private async ensureWalletOwnership(userId: string, walletId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.userId !== userId) {
      throw new ForbiddenException();
    }

    return wallet;
  }
}
