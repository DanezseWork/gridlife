export type PlannedKind = 'scheduled' | 'recurring';
export type PlannedFrequency = 'weekly' | 'monthly' | 'yearly';
export type TransactionType = 'income' | 'expense' | 'transfer';

export type WeeklyScheduleDays = { weekly: number[] };
export type MonthlyScheduleDays = { monthly: number[] };
export type YearlyScheduleDays = {
  yearly: Array<{ month: number; day: number }>;
};

export type ScheduleDays =
  | WeeklyScheduleDays
  | MonthlyScheduleDays
  | YearlyScheduleDays;

export interface PlannedQueueItem {
  plannedTransactionId: string;
  kind: PlannedKind;
  type: TransactionType;
  amount: string;
  note: string | null;
  fromWalletId: string | null;
  toWalletId: string | null;
  fromWallet: { id: string; name: string; currency: string } | null;
  toWallet: { id: string; name: string; currency: string } | null;
  anchorDate: string;
  scheduledDate: string | null;
  frequency: PlannedFrequency | null;
  scheduleDays: ScheduleDays | null;
  startDate: string | null;
  endDate: string | null;
  nextDueDate: string | null;
  scheduleSummary: string;
}
