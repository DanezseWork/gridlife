import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

type HabitScheduleDays =
  | { weekly: number[] }
  | { monthly: number[] }
  | { yearly: { month: number; day: number }[] }
  | { intervalDays: number };

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

function daysBetween(fromKey: string, toKey: string): number {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

function habitAnchorDateKey(createdAt: Date): string {
  return dateKey(createdAt);
}

function isHabitDueOnDate(
  frequency: string,
  scheduleDays: HabitScheduleDays | null,
  dateStr: string,
  anchorDateKey: string,
): boolean {
  if (frequency === 'daily') return true;

  const date = parseDateKey(dateStr);

  if (frequency === 'weekly' && scheduleDays && 'weekly' in scheduleDays) {
    return scheduleDays.weekly.includes(date.getUTCDay());
  }

  if (frequency === 'monthly' && scheduleDays && 'monthly' in scheduleDays) {
    return scheduleDays.monthly.includes(date.getUTCDate());
  }

  if (frequency === 'yearly' && scheduleDays && 'yearly' in scheduleDays) {
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    return scheduleDays.yearly.some(
      (entry) => entry.month === month && entry.day === day,
    );
  }

  if (
    frequency === 'custom' &&
    scheduleDays &&
    'intervalDays' in scheduleDays &&
    scheduleDays.intervalDays > 0
  ) {
    const diff = daysBetween(anchorDateKey, dateStr);
    return diff >= 0 && diff % scheduleDays.intervalDays === 0;
  }

  return false;
}

function buildHabitLogs(
  habitId: string,
  frequency: string,
  scheduleDays: HabitScheduleDays | null,
  anchorDateKey: string,
  fromDate: Date,
  toDate: Date,
  shouldComplete: (dateStr: string, dayIndex: number) => boolean,
) {
  const logs: { habitId: string; completedDate: Date; count: number }[] = [];
  let dayIndex = 0;

  for (
    let cursor = new Date(fromDate);
    cursor <= toDate;
    cursor = addDays(cursor, 1), dayIndex++
  ) {
    const key = dateKey(cursor);
    if (
      !isHabitDueOnDate(frequency, scheduleDays, key, anchorDateKey)
    ) {
      continue;
    }

    if (shouldComplete(key, dayIndex)) {
      logs.push({
        habitId,
        completedDate: parseDateKey(key),
        count: 1,
      });
    }
  }

  return logs;
}

async function deleteDemoUser(userId: string) {
  await prisma.subtask.deleteMany({ where: { task: { userId } } });
  await prisma.task.deleteMany({ where: { userId } });
  await prisma.plannedOccurrence.deleteMany({
    where: { plannedTransaction: { userId } },
  });
  await prisma.plannedTransaction.deleteMany({ where: { userId } });
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.wallet.deleteMany({ where: { userId } });
  await prisma.habitLog.deleteMany({
    where: { habit: { userId } },
  });
  await prisma.habit.deleteMany({ where: { userId } });
  await prisma.userSettings.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
}

async function main() {
  const password = await bcrypt.hash('password123', 10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dateKey(today);
  const habitStart = addDays(today, -84);

  const existing = await prisma.user.findUnique({
    where: { email: 'demo@gridlife.app' },
    select: { id: true },
  });

  if (existing) {
    await deleteDemoUser(existing.id);
  }

  const user = await prisma.user.create({
    data: {
      email: 'demo@gridlife.app',
      password,
      name: 'Demo User',
      settings: {
        create: {
          baseColor: '#000000',
          accentColor: '#00ffff',
          currency: 'PHP',
        },
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

  const habitCreatedAt = parseDateKey(dateKey(habitStart));

  const habits = await Promise.all([
    prisma.habit.create({
      data: {
        userId: user.id,
        name: 'Morning Run',
        color: '#00ffff',
        icon: 'activity',
        frequency: 'daily',
        sortOrder: 0,
        createdAt: habitCreatedAt,
      },
    }),
    prisma.habit.create({
      data: {
        userId: user.id,
        name: 'Read 30 min',
        color: '#ff00ff',
        icon: 'book-open',
        frequency: 'daily',
        sortOrder: 1,
        createdAt: habitCreatedAt,
      },
    }),
    prisma.habit.create({
      data: {
        userId: user.id,
        name: 'Gym Session',
        color: '#ffff00',
        icon: 'dumbbell',
        frequency: 'weekly',
        scheduleDays: { weekly: [1, 3, 5] },
        sortOrder: 2,
        createdAt: habitCreatedAt,
      },
    }),
    prisma.habit.create({
      data: {
        userId: user.id,
        name: 'Evening Journal',
        color: '#00ff88',
        icon: 'pen-line',
        frequency: 'daily',
        sortOrder: 3,
        createdAt: habitCreatedAt,
      },
    }),
  ]);

  const [morningRun, readDaily, gymSession, eveningJournal] = habits;
  const anchorDateKey = dateKey(habitCreatedAt);

  const habitLogs = [
    ...buildHabitLogs(
      morningRun.id,
      'daily',
      null,
      anchorDateKey,
      habitStart,
      today,
      (key, dayIndex) => {
        const daysFromToday = daysBetween(key, todayKey);
        if (daysFromToday <= 14) return true;
        if (daysFromToday === 15) return false;
        return dayIndex % 6 !== 0;
      },
    ),
    ...buildHabitLogs(
      readDaily.id,
      'daily',
      null,
      anchorDateKey,
      habitStart,
      today,
      (key, dayIndex) => {
        const daysFromToday = daysBetween(key, todayKey);
        if (daysFromToday === 0 || daysFromToday === 1) return false;
        if (daysFromToday <= 10) return true;
        return dayIndex % 3 !== 0;
      },
    ),
    ...buildHabitLogs(
      gymSession.id,
      'weekly',
      { weekly: [1, 3, 5] },
      anchorDateKey,
      habitStart,
      today,
      (key) => {
        const daysFromToday = daysBetween(key, todayKey);
        if (daysFromToday === 0) return false;
        if (daysFromToday <= 21) return daysFromToday % 7 !== 4;
        return daysBetween(key, todayKey) % 14 !== 7;
      },
    ),
    ...buildHabitLogs(
      eveningJournal.id,
      'daily',
      null,
      anchorDateKey,
      habitStart,
      today,
      (key, dayIndex) => {
        const daysFromToday = daysBetween(key, todayKey);
        if (daysFromToday === 0) return true;
        if (daysFromToday <= 5) return daysFromToday % 2 === 0;
        return dayIndex % 2 === 0;
      },
    ),
  ];

  await prisma.habitLog.createMany({ data: habitLogs });

  const [cash, savings, usdTravel] = user.wallets;

  const historicalTransactions = [
    {
      type: 'income',
      amount: 50000,
      date: addDays(today, -45),
      note: 'Bi-weekly paycheck',
      toWalletId: cash.id,
    },
    {
      type: 'expense',
      amount: 8500,
      date: addDays(today, -42),
      note: 'Condo rent',
      fromWalletId: cash.id,
    },
    {
      type: 'transfer',
      amount: 10000,
      date: addDays(today, -40),
      note: 'Move to savings',
      fromWalletId: cash.id,
      toWalletId: savings.id,
    },
    {
      type: 'expense',
      amount: 2499,
      date: addDays(today, -38),
      note: 'Groceries — SM Supermarket',
      fromWalletId: cash.id,
    },
    {
      type: 'expense',
      amount: 549,
      date: addDays(today, -35),
      note: 'Netflix subscription',
      fromWalletId: cash.id,
    },
    {
      type: 'expense',
      amount: 320,
      date: addDays(today, -33),
      note: 'Grab ride to BGC',
      fromWalletId: cash.id,
    },
    {
      type: 'income',
      amount: 50000,
      date: addDays(today, -31),
      note: 'Bi-weekly paycheck',
      toWalletId: cash.id,
    },
    {
      type: 'expense',
      amount: 1850,
      date: addDays(today, -28),
      note: 'Meralco electricity bill',
      fromWalletId: cash.id,
    },
    {
      type: 'expense',
      amount: 150,
      date: addDays(today, -25),
      note: 'Mobile load (Globe)',
      fromWalletId: cash.id,
    },
    {
      type: 'expense',
      amount: 680,
      date: addDays(today, -22),
      note: 'Coffee + lunch — coworking day',
      fromWalletId: cash.id,
    },
    {
      type: 'income',
      amount: 750,
      date: addDays(today, -18),
      note: 'Freelance invoice — logo design',
      toWalletId: usdTravel.id,
    },
    {
      type: 'expense',
      amount: 1200,
      date: addDays(today, -14),
      note: 'Pluxee meal allowance top-up',
      fromWalletId: cash.id,
    },
    {
      type: 'income',
      amount: 50000,
      date: addDays(today, -17),
      note: 'Bi-weekly paycheck',
      toWalletId: cash.id,
    },
    {
      type: 'expense',
      amount: 8500,
      date: addDays(today, -12),
      note: 'Condo rent',
      fromWalletId: cash.id,
    },
    {
      type: 'transfer',
      amount: 5000,
      date: addDays(today, -10),
      note: 'Auto-save to savings',
      fromWalletId: cash.id,
      toWalletId: savings.id,
    },
    {
      type: 'expense',
      amount: 2100,
      date: addDays(today, -7),
      note: 'Dinner with friends',
      fromWalletId: cash.id,
    },
    {
      type: 'expense',
      amount: 199,
      date: addDays(today, -5),
      note: 'Spotify Premium',
      fromWalletId: cash.id,
    },
    {
      type: 'expense',
      amount: 1850,
      date: addDays(today, -3),
      note: 'Weekly groceries',
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
        note: 'Condo rent',
        fromWalletId: cash.id,
        kind: 'scheduled',
        scheduledDate: parseDateKey(dateKey(addDays(today, 5))),
      },
      {
        userId: user.id,
        type: 'income',
        amount: 50000,
        note: 'Bi-weekly paycheck',
        toWalletId: cash.id,
        kind: 'scheduled',
        scheduledDate: parseDateKey(dateKey(addDays(today, 3))),
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
        amount: 1850,
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

  await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Prepare Gridlife product demo',
      details: 'Walk through habits, tasks, and finance for the presentation.',
      date: parseDateKey(todayKey),
      sortOrder: 0,
      subtasks: {
        create: [
          { title: 'Test login on mobile', sortOrder: 0, completedAt: new Date() },
          { title: 'Review habits grid and streaks', sortOrder: 1, completedAt: new Date() },
          { title: 'Walk through task calendar', sortOrder: 2 },
          { title: 'Show finance wallets and plans', sortOrder: 3 },
        ],
      },
    },
  });

  await prisma.task.createMany({
    data: [
      {
        userId: user.id,
        title: 'Reply to investor follow-up',
        details: 'Send deck link and Q2 roadmap summary.',
        date: parseDateKey(todayKey),
        sortOrder: 1,
        completedAt: new Date(),
      },
      {
        userId: user.id,
        title: 'Review monthly budget',
        details: 'Check cash vs savings after rent and groceries.',
        date: parseDateKey(todayKey),
        sortOrder: 2,
      },
      {
        userId: user.id,
        title: 'Submit expense report',
        date: parseDateKey(dateKey(addDays(today, -1))),
        sortOrder: 0,
        completedAt: new Date(),
      },
      {
        userId: user.id,
        title: 'Pack gym bag for Friday session',
        date: parseDateKey(dateKey(addDays(today, -1))),
        sortOrder: 1,
        completedAt: new Date(),
      },
      {
        userId: user.id,
        title: 'Draft blog post outline',
        details: 'Topic: building a personal dashboard with Next.js.',
        date: parseDateKey(dateKey(addDays(today, -3))),
        sortOrder: 0,
        completedAt: new Date(),
      },
      {
        userId: user.id,
        title: 'Schedule dentist appointment',
        date: parseDateKey(dateKey(addDays(today, -5))),
        sortOrder: 0,
        completedAt: new Date(),
      },
      {
        userId: user.id,
        title: 'Team standup prep',
        details: 'Share habits/tasks progress and blockers.',
        date: parseDateKey(dateKey(addDays(today, 1))),
        sortOrder: 0,
      },
      {
        userId: user.id,
        title: 'Pay credit card bill',
        date: parseDateKey(dateKey(addDays(today, 4))),
        sortOrder: 0,
      },
    ],
  });

  console.log(`Seeded user: ${user.email} (password: password123)`);
  console.log('Demo data includes:');
  console.log('- 4 habits with 12 weeks of completion history');
  console.log(`- ${habitLogs.length} habit log entries`);
  console.log('- 9 standalone tasks (today, yesterday, past, and upcoming)');
  console.log('- 1 demo prep task with 4 subtasks (2 complete)');
  console.log('- 3 wallets (PHP cash/savings + USD travel)');
  console.log('- 19 historical transactions');
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
