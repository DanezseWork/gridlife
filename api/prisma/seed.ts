import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

async function main() {
  const password = await bcrypt.hash('password123', 10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.user.findUnique({
    where: { email: 'demo@gridlife.app' },
    select: { id: true },
  });

  if (existing) {
    if (process.env.NODE_ENV === 'production') {
      console.log('Demo user already exists, skipping seed.');
      return;
    }

    await prisma.plannedOccurrence.deleteMany({
      where: { plannedTransaction: { userId: existing.id } },
    });
    await prisma.plannedTransaction.deleteMany({ where: { userId: existing.id } });
    await prisma.transaction.deleteMany({ where: { userId: existing.id } });
    await prisma.wallet.deleteMany({ where: { userId: existing.id } });
    await prisma.habitLog.deleteMany({
      where: { habit: { userId: existing.id } },
    });
    await prisma.habit.deleteMany({ where: { userId: existing.id } });
    await prisma.userSettings.deleteMany({ where: { userId: existing.id } });
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const user = await prisma.user.create({
    data: {
      email: 'demo@gridlife.app',
      password,
      name: 'Demo User',
      settings: {
        create: {
          baseColor: '#000000',
          accentColor: '#ffffff',
          currency: 'PHP',
        },
      },
      habits: {
        create: [
          { name: 'Morning Run', color: '#00ffff', icon: 'activity' },
          { name: 'Read 30 min', color: '#ff00ff', icon: 'book-open' },
          {
            name: 'Gym Session',
            color: '#ffff00',
            icon: 'dumbbell',
            frequency: 'weekly',
            scheduleDays: { weekly: [1, 3, 5] },
          },
        ],
      },
      wallets: {
        create: [
          {
            name: 'Cash',
            currency: 'PHP',
            color: '#00ffff',
            icon: 'wallet',
          },
          {
            name: 'Savings',
            currency: 'PHP',
            color: '#ff00ff',
            icon: 'piggy-bank',
          },
          {
            name: 'USD Travel',
            currency: 'USD',
            color: '#00ff88',
            icon: 'circle-dollar-sign',
          },
        ],
      },
    },
    include: { wallets: true },
  });

  const [cash, savings, usdTravel] = user.wallets;

  const historicalTransactions = [
    {
      type: 'income',
      amount: 50000,
      date: addDays(today, -45),
      note: 'Paycheck',
      toWalletId: cash.id,
    },
    {
      type: 'expense',
      amount: 8500,
      date: addDays(today, -40),
      note: 'Rent',
      fromWalletId: cash.id,
    },
    {
      type: 'transfer',
      amount: 10000,
      date: addDays(today, -35),
      note: 'Move to savings',
      fromWalletId: cash.id,
      toWalletId: savings.id,
    },
    {
      type: 'expense',
      amount: 2500,
      date: addDays(today, -20),
      note: 'Groceries',
      fromWalletId: cash.id,
    },
    {
      type: 'income',
      amount: 50000,
      date: addDays(today, -15),
      note: 'Paycheck',
      toWalletId: cash.id,
    },
    {
      type: 'expense',
      amount: 1200,
      date: addDays(today, -10),
      note: 'Utilities',
      fromWalletId: cash.id,
    },
    {
      type: 'income',
      amount: 500,
      date: addDays(today, -7),
      note: 'Freelance payout',
      toWalletId: usdTravel.id,
    },
    {
      type: 'expense',
      amount: 1800,
      date: addDays(today, -3),
      note: 'Dining out',
      fromWalletId: cash.id,
    },
    {
      type: 'transfer',
      amount: 2500,
      date: addDays(today, -1),
      note: 'Move to savings',
      fromWalletId: cash.id,
      toWalletId: savings.id,
    },
  ] as const;

  for (const tx of historicalTransactions) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: tx.type,
        amount: tx.amount,
        date: tx.date,
        note: tx.note,
        fromWalletId: 'fromWalletId' in tx ? tx.fromWalletId : null,
        toWalletId: 'toWalletId' in tx ? tx.toWalletId : null,
      },
    });
  }

  await prisma.plannedTransaction.createMany({
    data: [
      {
        userId: user.id,
        type: 'expense',
        amount: 8500,
        note: 'Next rent payment',
        fromWalletId: cash.id,
        kind: 'scheduled',
        scheduledDate: parseDateKey(dateKey(addDays(today, 5))),
      },
      {
        userId: user.id,
        type: 'income',
        amount: 50000,
        note: 'Salary deposit',
        toWalletId: cash.id,
        kind: 'scheduled',
        scheduledDate: parseDateKey(dateKey(addDays(today, 12))),
      },
      {
        userId: user.id,
        type: 'transfer',
        amount: 5000,
        note: 'Auto-save to savings',
        fromWalletId: cash.id,
        toWalletId: savings.id,
        kind: 'recurring',
        frequency: 'monthly',
        scheduleDays: { monthly: [1, 15] },
        startDate: parseDateKey(dateKey(today)),
      },
      {
        userId: user.id,
        type: 'expense',
        amount: 1500,
        note: 'Weekly groceries',
        fromWalletId: cash.id,
        kind: 'recurring',
        frequency: 'weekly',
        scheduleDays: { weekly: [6] },
        startDate: parseDateKey(dateKey(today)),
      },
      {
        userId: user.id,
        type: 'income',
        amount: 50000,
        note: 'Bi-weekly paycheck',
        toWalletId: cash.id,
        kind: 'recurring',
        frequency: 'weekly',
        scheduleDays: { weekly: [1, 5] },
        startDate: parseDateKey(dateKey(addDays(today, -30))),
      },
      {
        userId: user.id,
        type: 'expense',
        amount: 300,
        note: 'Annual travel insurance',
        fromWalletId: usdTravel.id,
        kind: 'recurring',
        frequency: 'yearly',
        scheduleDays: { yearly: [{ month: 6, day: 20 }, { month: 12, day: 1 }] },
        startDate: parseDateKey(dateKey(today)),
      },
      {
        userId: user.id,
        type: 'transfer',
        amount: 1000,
        note: 'Monthly savings sweep',
        fromWalletId: cash.id,
        toWalletId: savings.id,
        kind: 'recurring',
        frequency: 'monthly',
        scheduleDays: { monthly: [28] },
        startDate: parseDateKey(dateKey(today)),
        endDate: parseDateKey(dateKey(addDays(today, 365))),
      },
    ],
  });

  console.log(`Seeded user: ${user.email} (password: password123)`);
  console.log('Finance demo includes:');
  console.log('- 3 wallets (PHP cash/savings + USD travel)');
  console.log('- 9 historical transactions');
  console.log('- 2 scheduled future transactions');
  console.log('- 5 recurring plans (weekly, monthly, yearly)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
