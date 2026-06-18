import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateWalletDto, UpdateWalletDto } from './dto/wallet.dto';

export interface WalletWithBalance {
  id: string;
  name: string;
  currency: string;
  color: string;
  icon: string;
  createdAt: Date;
  balance: string;
}

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<WalletWithBalance[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        currency: string;
        color: string;
        icon: string;
        createdAt: Date;
        balance: Prisma.Decimal;
      }>
    >`
      SELECT
        w.id,
        w.name,
        w.currency,
        w.color,
        w.icon,
        w."createdAt",
        COALESCE(incoming.total, 0) - COALESCE(outgoing.total, 0) AS balance
      FROM "Wallet" w
      LEFT JOIN (
        SELECT "toWalletId" AS wallet_id, SUM(amount) AS total
        FROM "Transaction"
        WHERE "toWalletId" IS NOT NULL
        GROUP BY "toWalletId"
      ) incoming ON w.id = incoming.wallet_id
      LEFT JOIN (
        SELECT "fromWalletId" AS wallet_id, SUM(amount) AS total
        FROM "Transaction"
        WHERE "fromWalletId" IS NOT NULL
        GROUP BY "fromWalletId"
      ) outgoing ON w.id = outgoing.wallet_id
      WHERE w."userId" = ${userId}
      ORDER BY w."createdAt" ASC
    `;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      currency: row.currency,
      color: row.color,
      icon: row.icon,
      createdAt: row.createdAt,
      balance: row.balance.toString(),
    }));
  }

  async create(userId: string, dto: CreateWalletDto) {
    const hasInitialAmount =
      dto.initialAmount != null && dto.initialAmount !== 0;

    let currency = dto.currency;
    if (!currency) {
      const settings = await this.prisma.userSettings.findUnique({
        where: { userId },
        select: { currency: true },
      });
      currency = settings?.currency ?? 'PHP';
    }

    return this.prisma.$transaction(async (prisma) => {
      const wallet = await prisma.wallet.create({
        data: {
          userId,
          name: dto.name,
          currency,
          color: dto.color ?? '#00ffff',
          icon: dto.icon ?? 'wallet',
        },
      });

      if (hasInitialAmount) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        const amount = new Prisma.Decimal(Math.abs(dto.initialAmount!));

        if (dto.initialAmount! > 0) {
          await prisma.transaction.create({
            data: {
              userId,
              type: 'income',
              amount,
              date,
              note: 'Initial balance',
              toWalletId: wallet.id,
            },
          });
        } else {
          await prisma.transaction.create({
            data: {
              userId,
              type: 'expense',
              amount,
              date,
              note: 'Opening debt',
              fromWalletId: wallet.id,
            },
          });
        }
      }

      return wallet;
    });
  }

  async update(userId: string, walletId: string, dto: UpdateWalletDto) {
    await this.ensureOwnership(userId, walletId);

    return this.prisma.wallet.update({
      where: { id: walletId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
      },
    });
  }

  async delete(userId: string, walletId: string) {
    await this.ensureOwnership(userId, walletId);

    const txCount = await this.prisma.transaction.count({
      where: {
        OR: [{ fromWalletId: walletId }, { toWalletId: walletId }],
      },
    });

    if (txCount > 0) {
      throw new BadRequestException(
        'Cannot delete a wallet that has transactions',
      );
    }

    await this.prisma.wallet.delete({ where: { id: walletId } });
  }

  private async ensureOwnership(userId: string, walletId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.userId !== userId) {
      throw new ForbiddenException();
    }
  }
}
