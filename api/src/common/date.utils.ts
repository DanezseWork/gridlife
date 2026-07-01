import { getTimezoneOffsetMinutes } from './timezone/timezone.context';

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

function dateKeyForInstant(
  instant: Date,
  timezoneOffsetMinutes = getTimezoneOffsetMinutes(),
): string {
  const localMs = instant.getTime() - timezoneOffsetMinutes * 60_000;
  return formatDateKeyUtc(new Date(localMs));
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return formatDateKeyUtc(new Date(Date.UTC(y, m - 1, d + days)));
}

export function todayDateKey(timezoneOffsetMinutes?: number): string {
  return dateKeyForInstant(new Date(), timezoneOffsetMinutes);
}

export function yesterdayDateKey(timezoneOffsetMinutes?: number): string {
  return addDaysToDateKey(todayDateKey(timezoneOffsetMinutes), -1);
}

export function isLoggableHabitDateKey(dateKey: string): boolean {
  return dateKey === todayDateKey() || dateKey === yesterdayDateKey();
}

export function todayDateKeyUtc(): string {
  return formatDateKeyUtc(new Date());
}
