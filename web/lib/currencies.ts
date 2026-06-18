export const CURRENCIES = [
  { code: "PHP", label: "Philippine Peso", symbol: "₱" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "CNY", label: "Chinese Yuan", symbol: "¥" },
  { code: "KRW", label: "South Korean Won", symbol: "₩" },
  { code: "THB", label: "Thai Baht", symbol: "฿" },
  { code: "MYR", label: "Malaysian Ringgit", symbol: "RM" },
  { code: "IDR", label: "Indonesian Rupiah", symbol: "Rp" },
  { code: "VND", label: "Vietnamese Dong", symbol: "₫" },
  { code: "HKD", label: "Hong Kong Dollar", symbol: "HK$" },
  { code: "NZD", label: "New Zealand Dollar", symbol: "NZ$" },
  { code: "CHF", label: "Swiss Franc", symbol: "CHF" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const DEFAULT_CURRENCY: CurrencyCode = "PHP";

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code);

export function isCurrencyCode(value: string): value is CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(value);
}

export function getCurrency(code: string) {
  return CURRENCIES.find((c) => c.code === code);
}

export function resolveCurrency(code: string | undefined | null): CurrencyCode {
  return code && isCurrencyCode(code) ? code : DEFAULT_CURRENCY;
}

export function formatMoney(amount: number | string, code: CurrencyCode) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: code,
  }).format(Number(amount));
}

export function totalsByCurrency(
  wallets: Array<{ currency: string; balance: string }>,
): Array<{ currency: CurrencyCode; total: number }> {
  const map = new Map<CurrencyCode, number>();

  for (const wallet of wallets) {
    const currency = resolveCurrency(wallet.currency);
    map.set(currency, (map.get(currency) ?? 0) + Number(wallet.balance));
  }

  return Array.from(map.entries())
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
}
