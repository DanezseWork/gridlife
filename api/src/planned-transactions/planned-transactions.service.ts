import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  formatDateKeyUtc,
  parseDateKey,
  todayDateKey,
  todayDateKeyUtc,
} from '../common/date.utils';
import { PrismaService } from '../prisma.service';
import {
  CreatePlannedTransactionDto,
  UpdatePlannedTransactionDto,
} from './dto/planned-transaction.dto';
import type {
  PlannedFrequency,
  PlannedKind,
  PlannedQueueItem,
  ScheduleDays,
  TransactionType,
} from './schedule.types';
import {
  formatScheduleSummary,
  generateOccurrenceDates,
  projectionHorizon,
  projectionPoints,
} from './schedule.utils';

type PlannedWithWallets = Prisma.PlannedTransactionGetPayload<{
  include: {
    fromWallet: { select: { id: true; name: true; currency: true } };
    toWallet: { select: { id: true; name: true; currency: true } };
    occurrences: { select: { dueDate: true; transactionId: true } };
  };
}>;

@Injectable()
export class PlannedTransactionsService {
  private readonly materializeLocks = new Map<string, Promise<void>>();

  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    await this.materializeDue(userId);

    const rules = await this.prisma.plannedTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: this.include,
    });

    return rules.map((rule) => this.serializeRule(rule));
  }

  async getQueue(userId: string): Promise<PlannedQueueItem[]> {
    await this.materializeDue(userId);

    const rules = await this.prisma.plannedTransaction.findMany({
      where: { userId, active: true },
      orderBy: [
        { kind: 'asc' },
        { startDate: 'asc' },
        { scheduledDate: 'asc' },
      ],
      include: this.include,
    });

    const today = todayDateKeyUtc();
    const horizon = projectionHorizon('year', 1);
    const queue: PlannedQueueItem[] = [];

    for (const rule of rules) {
      const input = this.toRuleInput(rule);
      const scheduleDays = (rule.scheduleDays as ScheduleDays | null) ?? null;
      const scheduleSummary = formatScheduleSummary(
        rule.kind as PlannedKind,
        rule.frequency as PlannedFrequency | null,
        scheduleDays,
      );

      if (rule.kind === 'scheduled') {
        const scheduledDate = rule.scheduledDate
          ? formatDateKeyUtc(rule.scheduledDate)
          : null;

        if (!scheduledDate || scheduledDate < today) {
          continue;
        }

        queue.push({
          plannedTransactionId: rule.id,
          kind: 'scheduled',
          type: rule.type as TransactionType,
          amount: rule.amount.toString(),
          note: rule.note,
          fromWalletId: rule.fromWalletId,
          toWalletId: rule.toWalletId,
          fromWallet: rule.fromWallet,
          toWallet: rule.toWallet,
          anchorDate: scheduledDate,
          scheduledDate,
          frequency: null,
          scheduleDays: null,
          startDate: null,
          endDate: null,
          nextDueDate: scheduledDate,
          scheduleSummary,
        });
        continue;
      }

      const startDate = input.startDate ?? formatDateKeyUtc(rule.createdAt);
      const endDate = input.endDate;
      const futureDates = generateOccurrenceDates(input, today, horizon);
      const nextDueDate = futureDates[0] ?? null;

      if (endDate && endDate < today) {
        continue;
      }

      queue.push({
        plannedTransactionId: rule.id,
        kind: 'recurring',
        type: rule.type as TransactionType,
        amount: rule.amount.toString(),
        note: rule.note,
        fromWalletId: rule.fromWalletId,
        toWalletId: rule.toWalletId,
        fromWallet: rule.fromWallet,
        toWallet: rule.toWallet,
        anchorDate: startDate,
        scheduledDate: null,
        frequency: rule.frequency as PlannedFrequency | null,
        scheduleDays,
        startDate,
        endDate,
        nextDueDate,
        scheduleSummary,
      });
    }

    queue.sort((left, right) => {
      const leftSort = left.nextDueDate ?? left.anchorDate;
      const rightSort = right.nextDueDate ?? right.anchorDate;
      if (leftSort !== rightSort) {
        return leftSort.localeCompare(rightSort);
      }
      return left.plannedTransactionId.localeCompare(
        right.plannedTransactionId,
      );
    });

    return queue;
  }

  async getProjection(
    userId: string,
    unit: 'week' | 'month' | 'year',
    count = 1,
  ) {
    await this.materializeDue(userId);

    const [wallets, rules] = await Promise.all([
      this.getWalletBalances(userId),
      this.prisma.plannedTransaction.findMany({
        where: { userId, active: true },
        include: this.include,
      }),
    ]);

    const points = projectionPoints(unit, count);
    const today = todayDateKeyUtc();
    const horizon = projectionHorizon(unit, count);
    const balances = new Map(
      wallets.map((wallet) => [wallet.id, Number(wallet.balance)]),
    );

    const futureOccurrences = rules.flatMap((rule) => {
      const input = this.toRuleInput(rule);
      return generateOccurrenceDates(input, today, horizon).map((dueDate) => ({
        rule,
        dueDate,
      }));
    });

    const totalsByCurrency = (
      walletBalances: Map<string, number>,
    ): Record<string, number> => {
      const totals: Record<string, number> = {};
      for (const wallet of wallets) {
        totals[wallet.currency] =
          (totals[wallet.currency] ?? 0) + (walletBalances.get(wallet.id) ?? 0);
      }
      return totals;
    };

    return points.map((date) => {
      const pointBalances = new Map(balances);

      for (const occurrence of futureOccurrences) {
        if (occurrence.dueDate > date) continue;

        const amount = Number(occurrence.rule.amount);
        if (occurrence.rule.fromWalletId) {
          pointBalances.set(
            occurrence.rule.fromWalletId,
            (pointBalances.get(occurrence.rule.fromWalletId) ?? 0) - amount,
          );
        }
        if (occurrence.rule.toWalletId) {
          pointBalances.set(
            occurrence.rule.toWalletId,
            (pointBalances.get(occurrence.rule.toWalletId) ?? 0) + amount,
          );
        }
      }

      return {
        date,
        label: this.formatProjectionLabel(date, unit, count),
        totals: totalsByCurrency(pointBalances),
      };
    });
  }

  async create(userId: string, dto: CreatePlannedTransactionDto) {
    this.validatePlannedDto(dto);

    const scheduleDays = this.buildScheduleDays(dto);
    const amount = new Prisma.Decimal(dto.amount);

    if (dto.type === 'income') {
      await this.ensureWalletOwnership(userId, dto.toWalletId!);
    }
    if (dto.type === 'expense') {
      await this.ensureWalletOwnership(userId, dto.fromWalletId!);
    }
    if (dto.type === 'transfer') {
      await this.ensureTransferWallets(
        userId,
        dto.fromWalletId!,
        dto.toWalletId!,
      );
    }

    const rule = await this.prisma.plannedTransaction.create({
      data: {
        userId,
        type: dto.type,
        amount,
        note: dto.note,
        fromWalletId:
          dto.type === 'expense' || dto.type === 'transfer'
            ? dto.fromWalletId
            : null,
        toWalletId:
          dto.type === 'income' || dto.type === 'transfer'
            ? dto.toWalletId
            : null,
        kind: dto.kind,
        scheduledDate:
          dto.kind === 'scheduled' && dto.scheduledDate
            ? parseDateKey(dto.scheduledDate)
            : null,
        frequency: dto.kind === 'recurring' ? dto.frequency : null,
        scheduleDays: scheduleDays ?? Prisma.JsonNull,
        startDate:
          dto.kind === 'recurring' && dto.startDate
            ? parseDateKey(dto.startDate)
            : dto.kind === 'recurring'
              ? parseDateKey(todayDateKey())
              : null,
        endDate:
          dto.kind === 'recurring' && dto.endDate
            ? parseDateKey(dto.endDate)
            : null,
        active: true,
      },
      include: this.include,
    });

    await this.materializeDue(userId);

    return this.serializeRule(rule);
  }

  async update(
    userId: string,
    plannedId: string,
    dto: UpdatePlannedTransactionDto,
  ) {
    const existing = await this.ensureOwnership(userId, plannedId);

    if (dto.scheduledDate && existing.kind !== 'scheduled') {
      throw new BadRequestException(
        'scheduledDate only applies to scheduled transactions',
      );
    }

    const scheduleDays =
      existing.kind === 'recurring'
        ? this.buildScheduleDaysFromUpdate(existing.frequency, dto)
        : undefined;

    const rule = await this.prisma.plannedTransaction.update({
      where: { id: plannedId },
      data: {
        ...(dto.amount !== undefined && {
          amount: new Prisma.Decimal(dto.amount),
        }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.active !== undefined && { active: dto.active }),
        ...(dto.scheduledDate !== undefined && {
          scheduledDate: parseDateKey(dto.scheduledDate),
        }),
        ...(dto.frequency !== undefined && { frequency: dto.frequency }),
        ...(scheduleDays !== undefined && {
          scheduleDays: scheduleDays ?? Prisma.JsonNull,
        }),
        ...(dto.startDate !== undefined && {
          startDate: parseDateKey(dto.startDate),
        }),
        ...(dto.endDate !== undefined && {
          endDate: dto.endDate ? parseDateKey(dto.endDate) : null,
        }),
      },
      include: this.include,
    });

    await this.materializeDue(userId);

    return this.serializeRule(rule);
  }

  async remove(userId: string, plannedId: string) {
    await this.ensureOwnership(userId, plannedId);
    await this.prisma.plannedTransaction.delete({ where: { id: plannedId } });
  }

  async materializeDue(userId: string) {
    const pending = this.materializeLocks.get(userId);
    const run = (pending ?? Promise.resolve()).then(() =>
      this.runMaterializeDue(userId),
    );
    this.materializeLocks.set(userId, run);

    try {
      await run;
    } finally {
      if (this.materializeLocks.get(userId) === run) {
        this.materializeLocks.delete(userId);
      }
    }
  }

  private async runMaterializeDue(userId: string) {
    const rules = await this.prisma.plannedTransaction.findMany({
      where: { userId, active: true },
      include: {
        occurrences: { select: { dueDate: true } },
      },
    });

    const today = todayDateKeyUtc();
    const earliest = '1970-01-01';

    for (const rule of rules) {
      const postedDates = new Set(
        rule.occurrences.map((occurrence) =>
          formatDateKeyUtc(occurrence.dueDate),
        ),
      );

      const input = this.toRuleInput({
        ...rule,
        scheduleDays: rule.scheduleDays,
      });

      const dueDates = generateOccurrenceDates(input, earliest, today).filter(
        (dueDate) => !postedDates.has(dueDate),
      );

      for (const dueDate of dueDates) {
        await this.postOccurrence(userId, rule, dueDate);
      }
    }
  }

  private async postOccurrence(
    userId: string,
    rule: Prisma.PlannedTransactionGetPayload<{
      include: { occurrences: { select: { dueDate: true } } };
    }>,
    dueDate: string,
  ) {
    const dueDateValue = parseDateKey(dueDate);

    try {
      await this.prisma.$transaction(async (prisma) => {
        const existing = await prisma.plannedOccurrence.findUnique({
          where: {
            plannedTransactionId_dueDate: {
              plannedTransactionId: rule.id,
              dueDate: dueDateValue,
            },
          },
        });

        if (existing) {
          return;
        }

        const transaction = await prisma.transaction.create({
          data: {
            userId,
            type: rule.type,
            amount: rule.amount,
            date: dueDateValue,
            note: rule.note,
            fromWalletId: rule.fromWalletId,
            toWalletId: rule.toWalletId,
          },
        });

        await prisma.plannedOccurrence.create({
          data: {
            plannedTransactionId: rule.id,
            dueDate: dueDateValue,
            transactionId: transaction.id,
          },
        });
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return;
      }

      throw error;
    }
  }

  private validatePlannedDto(dto: CreatePlannedTransactionDto) {
    if (dto.kind === 'scheduled') {
      if (
        !dto.scheduledDate ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dto.scheduledDate)
      ) {
        throw new BadRequestException('scheduledDate is required');
      }
      const today = todayDateKey();
      if (dto.scheduledDate <= today) {
        throw new BadRequestException(
          'Scheduled transactions must be dated in the future',
        );
      }
      return;
    }

    if (!dto.frequency) {
      throw new BadRequestException(
        'frequency is required for recurring transactions',
      );
    }

    if (
      dto.frequency === 'weekly' &&
      (!dto.weeklyDays || dto.weeklyDays.length === 0)
    ) {
      throw new BadRequestException('Select at least one weekday');
    }

    if (
      dto.frequency === 'monthly' &&
      (!dto.monthlyDays || dto.monthlyDays.length === 0)
    ) {
      throw new BadRequestException('Select at least one day of the month');
    }

    if (
      dto.frequency === 'yearly' &&
      (!dto.yearlyDays || dto.yearlyDays.length === 0)
    ) {
      throw new BadRequestException('Select at least one yearly date');
    }

    if (dto.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(dto.startDate)) {
      throw new BadRequestException('Invalid startDate format');
    }

    if (dto.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(dto.endDate)) {
      throw new BadRequestException('Invalid endDate format');
    }
  }

  private buildScheduleDays(
    dto: CreatePlannedTransactionDto,
  ): ScheduleDays | null {
    if (dto.kind !== 'recurring') return null;

    if (dto.frequency === 'weekly') {
      return {
        weekly: [...new Set(dto.weeklyDays ?? [])].sort((a, b) => a - b),
      };
    }

    if (dto.frequency === 'monthly') {
      return {
        monthly: [...new Set(dto.monthlyDays ?? [])].sort((a, b) => a - b),
      };
    }

    return {
      yearly: (dto.yearlyDays ?? []).map((entry) => ({
        month: entry.month,
        day: entry.day,
      })),
    };
  }

  private buildScheduleDaysFromUpdate(
    frequency: string | null,
    dto: UpdatePlannedTransactionDto,
  ): ScheduleDays | null {
    if (frequency === 'weekly' && dto.weeklyDays) {
      return { weekly: [...new Set(dto.weeklyDays)].sort((a, b) => a - b) };
    }

    if (frequency === 'monthly' && dto.monthlyDays) {
      return {
        monthly: [...new Set(dto.monthlyDays)].sort((a, b) => a - b),
      };
    }

    if (frequency === 'yearly' && dto.yearlyDays) {
      return {
        yearly: dto.yearlyDays.map((entry) => ({
          month: entry.month,
          day: entry.day,
        })),
      };
    }

    return null;
  }

  private toRuleInput(rule: {
    id: string;
    kind: string;
    type: string;
    amount: Prisma.Decimal | number;
    scheduledDate: Date | string | null;
    frequency: string | null;
    scheduleDays: Prisma.JsonValue | ScheduleDays | null;
    startDate: Date | string | null;
    endDate: Date | string | null;
    active: boolean;
  }) {
    return {
      id: rule.id,
      kind: rule.kind as PlannedKind,
      type: rule.type as TransactionType,
      amount: Number(rule.amount),
      scheduledDate: rule.scheduledDate
        ? typeof rule.scheduledDate === 'string'
          ? rule.scheduledDate
          : formatDateKeyUtc(rule.scheduledDate)
        : null,
      frequency: rule.frequency as PlannedFrequency | null,
      scheduleDays: (rule.scheduleDays as ScheduleDays | null) ?? null,
      startDate: rule.startDate
        ? typeof rule.startDate === 'string'
          ? rule.startDate
          : formatDateKeyUtc(rule.startDate)
        : null,
      endDate: rule.endDate
        ? typeof rule.endDate === 'string'
          ? rule.endDate
          : formatDateKeyUtc(rule.endDate)
        : null,
      active: rule.active,
    };
  }

  private serializeRule(rule: PlannedWithWallets) {
    return {
      id: rule.id,
      type: rule.type,
      amount: rule.amount.toString(),
      note: rule.note,
      fromWalletId: rule.fromWalletId,
      toWalletId: rule.toWalletId,
      kind: rule.kind,
      scheduledDate: rule.scheduledDate
        ? formatDateKeyUtc(rule.scheduledDate)
        : null,
      frequency: rule.frequency,
      scheduleDays: rule.scheduleDays,
      startDate: rule.startDate ? formatDateKeyUtc(rule.startDate) : null,
      endDate: rule.endDate ? formatDateKeyUtc(rule.endDate) : null,
      active: rule.active,
      createdAt: rule.createdAt,
      fromWallet: rule.fromWallet,
      toWallet: rule.toWallet,
    };
  }

  private formatProjectionLabel(
    date: string,
    unit: 'week' | 'month' | 'year',
    count: number,
  ) {
    const parsed = parseDateKey(date);

    if (unit === 'year' || (unit === 'month' && count > 1)) {
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        timeZone: 'UTC',
      };
      if (unit === 'year' && count > 1) {
        options.year = '2-digit';
      }
      return parsed.toLocaleDateString(undefined, options);
    }

    if (unit === 'month') {
      return parsed.toLocaleDateString(undefined, {
        day: 'numeric',
        timeZone: 'UTC',
      });
    }

    if (count === 1) {
      return parsed.toLocaleDateString(undefined, {
        weekday: 'short',
        timeZone: 'UTC',
      });
    }

    return parsed.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }

  private async getWalletBalances(userId: string) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        currency: string;
        balance: Prisma.Decimal;
      }>
    >`
      SELECT
        w.id,
        w.currency,
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
      currency: row.currency,
      balance: row.balance.toString(),
    }));
  }

  private readonly include = {
    fromWallet: { select: { id: true, name: true, currency: true } },
    toWallet: { select: { id: true, name: true, currency: true } },
    occurrences: { select: { dueDate: true, transactionId: true } },
  } as const;

  private async ensureOwnership(userId: string, plannedId: string) {
    const rule = await this.prisma.plannedTransaction.findUnique({
      where: { id: plannedId },
    });

    if (!rule) {
      throw new NotFoundException('Planned transaction not found');
    }

    if (rule.userId !== userId) {
      throw new ForbiddenException();
    }

    return rule;
  }

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

  private async ensureTransferWallets(
    userId: string,
    fromWalletId: string,
    toWalletId: string,
  ) {
    if (fromWalletId === toWalletId) {
      throw new BadRequestException('Cannot transfer to the same wallet');
    }

    const fromWallet = await this.ensureWalletOwnership(userId, fromWalletId);
    const toWallet = await this.ensureWalletOwnership(userId, toWalletId);

    if (fromWallet.currency !== toWallet.currency) {
      throw new BadRequestException(
        'Transfers require wallets with the same currency',
      );
    }
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    (error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002') ||
    (typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002')
  );
}
