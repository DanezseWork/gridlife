export const ALLOWED_WALLET_CURRENCIES = [
  'PHP',
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'SGD',
  'INR',
  'CNY',
  'KRW',
  'THB',
  'MYR',
  'IDR',
  'VND',
  'HKD',
  'NZD',
  'CHF',
] as const;

export type WalletCurrency = (typeof ALLOWED_WALLET_CURRENCIES)[number];
