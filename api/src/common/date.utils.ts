export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDateKeyUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayDateKey(): string {
  return formatDateKey(new Date());
}

export function yesterdayDateKey(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateKey(yesterday);
}

export function isLoggableHabitDateKey(dateKey: string): boolean {
  return dateKey === todayDateKey() || dateKey === yesterdayDateKey();
}

export function todayDateKeyUtc(): string {
  return formatDateKeyUtc(new Date());
}
