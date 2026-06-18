export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getTodayKey(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return toLocalDateKey(today);
}

export function isPastDateKey(dateKey: string): boolean {
  return dateKey < getTodayKey();
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return toLocalDateKey(date);
}

export function getTomorrowKey(): string {
  return addDaysToDateKey(getTodayKey(), 1);
}

export function logToDateKey(completedDate: string): string {
  return completedDate.slice(0, 10);
}

export function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function getMonthCalendarDays(month: Date): (Date | null)[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const leadingEmpty = firstDay.getDay();
  const days: (Date | null)[] = Array.from({ length: leadingEmpty }, () => null);

  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, monthIndex, day));
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}
