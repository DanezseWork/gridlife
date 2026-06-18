import type { Transaction, Wallet } from "@/lib/api";
import { resolveCurrency, type CurrencyCode } from "@/lib/currencies";

export type NetworkRange = "week" | "month" | "year";

export interface NetworkDataPoint {
  date: string;
  label: string;
  totals: Partial<Record<CurrencyCode, number>>;
}

const CURRENCY_COLORS: Partial<Record<CurrencyCode, string>> = {
  PHP: "var(--color-accent)",
  USD: "#00ff88",
  EUR: "#a78bfa",
  GBP: "#f472b6",
  JPY: "#fbbf24",
};

export function getCurrencyLineColor(currency: CurrencyCode): string {
  return CURRENCY_COLORS[currency] ?? "var(--color-accent)";
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatPointLabel(date: Date, range: NetworkRange): string {
  if (range === "year") {
    return date.toLocaleDateString(undefined, { month: "short" });
  }

  if (range === "month") {
    return date.toLocaleDateString(undefined, { day: "numeric" });
  }

  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function getRangePoints(range: NetworkRange): Date[] {
  const today = startOfDay(new Date());

  if (range === "week") {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - index));
      return date;
    });
  }

  if (range === "month") {
    return Array.from({ length: 30 }, (_, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (29 - index));
      return date;
    });
  }

  return Array.from({ length: 12 }, (_, index) => {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - (11 - index), 1);
    const isCurrentMonth =
      monthStart.getFullYear() === today.getFullYear() &&
      monthStart.getMonth() === today.getMonth();

    if (isCurrentMonth) {
      return today;
    }

    return startOfDay(
      new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0),
    );
  });
}

function applyTransactionDelta(
  balances: Map<string, number>,
  tx: Transaction,
  multiplier: 1 | -1,
) {
  const amount = Number(tx.amount) * multiplier;

  if (tx.fromWalletId) {
    balances.set(
      tx.fromWalletId,
      (balances.get(tx.fromWalletId) ?? 0) - amount,
    );
  }

  if (tx.toWalletId) {
    balances.set(tx.toWalletId, (balances.get(tx.toWalletId) ?? 0) + amount);
  }
}

function totalsAtBalances(
  wallets: Wallet[],
  balances: Map<string, number>,
): Partial<Record<CurrencyCode, number>> {
  const totals: Partial<Record<CurrencyCode, number>> = {};

  for (const wallet of wallets) {
    const currency = resolveCurrency(wallet.currency);
    totals[currency] = (totals[currency] ?? 0) + (balances.get(wallet.id) ?? 0);
  }

  return totals;
}

export function computeNetworkHistory(
  wallets: Wallet[],
  transactions: Transaction[],
  range: NetworkRange,
): NetworkDataPoint[] {
  const points = getRangePoints(range);
  if (points.length === 0 || wallets.length === 0) {
    return [];
  }

  const balances = new Map(wallets.map((wallet) => [wallet.id, Number(wallet.balance)]));
  const sortedTransactions = [...transactions].sort((left, right) => {
    const leftDate = startOfDay(new Date(left.date)).getTime();
    const rightDate = startOfDay(new Date(right.date)).getTime();
    if (rightDate !== leftDate) {
      return rightDate - leftDate;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

  const history: NetworkDataPoint[] = [];
  let transactionIndex = 0;

  for (let index = points.length - 1; index >= 0; index -= 1) {
    const pointDate = points[index];
    const pointTime = pointDate.getTime();

    while (transactionIndex < sortedTransactions.length) {
      const transaction = sortedTransactions[transactionIndex];
      const transactionDate = startOfDay(new Date(transaction.date));

      if (transactionDate.getTime() <= pointTime) {
        break;
      }

      applyTransactionDelta(balances, transaction, -1);
      transactionIndex += 1;
    }

    history.unshift({
      date: pointDate.toISOString().slice(0, 10),
      label: formatPointLabel(pointDate, range),
      totals: totalsAtBalances(wallets, balances),
    });
  }

  return history;
}

export function getActiveCurrencies(
  data: NetworkDataPoint[],
  wallets: Wallet[],
): CurrencyCode[] {
  const currencies = new Set<CurrencyCode>();

  for (const wallet of wallets) {
    currencies.add(resolveCurrency(wallet.currency));
  }

  for (const point of data) {
    for (const [currency, total] of Object.entries(point.totals)) {
      if ((total ?? 0) !== 0) {
        currencies.add(currency as CurrencyCode);
      }
    }
  }

  return Array.from(currencies).sort((left, right) => left.localeCompare(right));
}
