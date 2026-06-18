import { type CurrencyCode } from "@/lib/currencies";

export interface ExchangeRates {
  base: CurrencyCode;
  rates: Record<string, number>;
  updatedAt: string;
}

const ratesCache = new Map<CurrencyCode, ExchangeRates>();

export async function fetchExchangeRates(
  base: CurrencyCode,
): Promise<ExchangeRates> {
  const cached = ratesCache.get(base);
  if (cached) return cached;

  const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
  if (!res.ok) {
    throw new Error("Failed to fetch exchange rates");
  }

  const data = (await res.json()) as {
    result?: string;
    base_code?: string;
    rates?: Record<string, number>;
    time_last_update_utc?: string;
  };

  if (data.result !== "success" || !data.rates || !data.time_last_update_utc) {
    throw new Error("Exchange rate lookup failed");
  }

  const result: ExchangeRates = {
    base,
    rates: data.rates,
    updatedAt: data.time_last_update_utc,
  };

  ratesCache.set(base, result);
  return result;
}

export function getExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode,
  rates: Record<string, number>,
): number | null {
  if (from === to) return 1;

  const fromRate = rates[from];
  if (fromRate == null || fromRate === 0) return null;

  return 1 / fromRate;
}

export function formatExchangeRate(
  from: CurrencyCode,
  to: CurrencyCode,
  rates: Record<string, number>,
): string | null {
  const rate = getExchangeRate(from, to, rates);
  if (rate == null) return null;

  const formattedRate = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: rate >= 100 ? 2 : rate >= 1 ? 4 : 6,
    maximumFractionDigits: rate >= 100 ? 2 : rate >= 1 ? 4 : 6,
  }).format(rate);

  return `1 ${from} = ${formattedRate} ${to}`;
}

export function convertAmountToBase(
  amount: number,
  from: CurrencyCode,
  base: CurrencyCode,
  rates: Record<string, number>,
): number {
  if (from === base) return amount;

  const fromRate = rates[from];
  if (fromRate == null || fromRate === 0) {
    throw new Error(`No exchange rate available for ${from}`);
  }

  return amount / fromRate;
}

export function combineTotalsInCurrency(
  totals: Array<{ currency: CurrencyCode; total: number }>,
  target: CurrencyCode,
  rates: Record<string, number>,
): number {
  return totals.reduce(
    (sum, { currency, total }) =>
      sum + convertAmountToBase(total, currency, target, rates),
    0,
  );
}

export function formatRateUpdatedAt(updatedAt: string): string {
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return updatedAt;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
