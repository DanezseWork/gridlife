import {
  formatDateKeyUtc,
  parseDateKey,
  todayDateKeyUtc,
} from '../common/date.utils';
import type {
  PlannedFrequency,
  PlannedKind,
  ScheduleDays,
  TransactionType,
} from './schedule.types';

export interface PlannedRuleInput {
  id: string;
  kind: PlannedKind;
  type: TransactionType;
  amount: number;
  scheduledDate: string | null;
  frequency: PlannedFrequency | null;
  scheduleDays: ScheduleDays | null;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
}

function dateKeyToUtcDate(dateKey: string): Date {
  return parseDateKey(dateKey);
}

function addDays(dateKey: string, days: number): string {
  const date = dateKeyToUtcDate(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateKeyUtc(date);
}

function compareDateKeys(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function utcDayOfWeek(dateKey: string): number {
  return dateKeyToUtcDate(dateKey).getUTCDay();
}

function utcYear(dateKey: string): number {
  return dateKeyToUtcDate(dateKey).getUTCFullYear();
}

function utcMonth(dateKey: string): number {
  return dateKeyToUtcDate(dateKey).getUTCMonth() + 1;
}

function utcDay(dateKey: string): number {
  return dateKeyToUtcDate(dateKey).getUTCDate();
}

function clampDay(year: number, month: number, day: number): string {
  const maxDay = daysInMonth(year, month);
  const safeDay = Math.min(day, maxDay);
  const monthText = String(month).padStart(2, '0');
  const dayText = String(safeDay).padStart(2, '0');
  return `${year}-${monthText}-${dayText}`;
}

function recurringStartDate(rule: PlannedRuleInput): string {
  return rule.startDate ?? todayDateKeyUtc();
}

function recurringEndDate(rule: PlannedRuleInput, horizon: string): string {
  if (rule.endDate && compareDateKeys(rule.endDate, horizon) < 0) {
    return rule.endDate;
  }
  return horizon;
}

function weeklyOccurrences(
  rule: PlannedRuleInput,
  fromDate: string,
  toDate: string,
): string[] {
  const days =
    rule.scheduleDays && 'weekly' in rule.scheduleDays
      ? rule.scheduleDays.weekly
      : [];
  if (days.length === 0) return [];

  const start =
    compareDateKeys(recurringStartDate(rule), fromDate) > 0
      ? recurringStartDate(rule)
      : fromDate;
  const end = recurringEndDate(rule, toDate);
  const dates: string[] = [];
  let cursor = start;

  while (compareDateKeys(cursor, end) <= 0) {
    if (days.includes(utcDayOfWeek(cursor))) {
      dates.push(cursor);
    }
    cursor = addDays(cursor, 1);
  }

  return dates;
}

function monthlyOccurrences(
  rule: PlannedRuleInput,
  fromDate: string,
  toDate: string,
): string[] {
  const days =
    rule.scheduleDays && 'monthly' in rule.scheduleDays
      ? rule.scheduleDays.monthly
      : [];
  if (days.length === 0) return [];

  const start =
    compareDateKeys(recurringStartDate(rule), fromDate) > 0
      ? recurringStartDate(rule)
      : fromDate;
  const end = recurringEndDate(rule, toDate);
  const dates: string[] = [];

  let year = utcYear(start);
  let month = utcMonth(start);

  while (true) {
    for (const day of days.sort((a, b) => a - b)) {
      const candidate = clampDay(year, month, day);
      if (compareDateKeys(candidate, start) < 0) continue;
      if (compareDateKeys(candidate, end) > 0) return dates;
      dates.push(candidate);
    }

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }

    const nextMonthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    if (compareDateKeys(nextMonthStart, end) > 0) {
      break;
    }
  }

  return dates;
}

function yearlyOccurrences(
  rule: PlannedRuleInput,
  fromDate: string,
  toDate: string,
): string[] {
  const entries =
    rule.scheduleDays && 'yearly' in rule.scheduleDays
      ? rule.scheduleDays.yearly
      : [];
  if (entries.length === 0) return [];

  const start =
    compareDateKeys(recurringStartDate(rule), fromDate) > 0
      ? recurringStartDate(rule)
      : fromDate;
  const end = recurringEndDate(rule, toDate);
  const startYear = utcYear(start);
  const endYear = utcYear(end);
  const dates: string[] = [];

  for (let year = startYear; year <= endYear; year += 1) {
    for (const entry of entries) {
      const candidate = clampDay(year, entry.month, entry.day);
      if (compareDateKeys(candidate, start) < 0) continue;
      if (compareDateKeys(candidate, end) > 0) continue;
      dates.push(candidate);
    }
  }

  return dates.sort((left, right) => compareDateKeys(left, right));
}

export function generateOccurrenceDates(
  rule: PlannedRuleInput,
  fromDate: string,
  toDate: string,
): string[] {
  if (!rule.active) return [];

  if (rule.kind === 'scheduled') {
    if (!rule.scheduledDate) return [];
    if (
      compareDateKeys(rule.scheduledDate, fromDate) >= 0 &&
      compareDateKeys(rule.scheduledDate, toDate) <= 0
    ) {
      return [rule.scheduledDate];
    }
    return [];
  }

  if (!rule.frequency) return [];

  switch (rule.frequency) {
    case 'weekly':
      return weeklyOccurrences(rule, fromDate, toDate);
    case 'monthly':
      return monthlyOccurrences(rule, fromDate, toDate);
    case 'yearly':
      return yearlyOccurrences(rule, fromDate, toDate);
    default:
      return [];
  }
}

export function projectionHorizon(range: 'week' | 'month' | 'year'): string {
  const today = todayDateKeyUtc();
  if (range === 'week') return addDays(today, 6);
  if (range === 'month') return addDays(today, 29);
  return addDays(today, 364);
}

export function projectionPoints(range: 'week' | 'month' | 'year'): string[] {
  const today = todayDateKeyUtc();
  const horizon = projectionHorizon(range);

  if (range === 'week') {
    return Array.from({ length: 7 }, (_, index) => addDays(today, index));
  }

  if (range === 'month') {
    return Array.from({ length: 30 }, (_, index) => addDays(today, index));
  }

  const points: string[] = [];
  let year = utcYear(today);
  let month = utcMonth(today);

  for (let index = 0; index < 12; index += 1) {
    if (index === 0) {
      points.push(today);
    } else {
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
      const monthEnd = clampDay(year, month, daysInMonth(year, month));
      points.push(compareDateKeys(monthEnd, horizon) <= 0 ? monthEnd : horizon);
    }
  }

  return points;
}

const WEEKDAY_LABELS = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

export function formatScheduleSummary(
  kind: PlannedKind,
  frequency: PlannedFrequency | null,
  scheduleDays: ScheduleDays | null,
): string {
  if (kind === 'scheduled') {
    return 'One-time payment';
  }

  if (!frequency || !scheduleDays) {
    return 'Recurring';
  }

  if (frequency === 'weekly' && 'weekly' in scheduleDays) {
    const days = scheduleDays.weekly
      .map((day) => WEEKDAY_LABELS[day] ?? String(day))
      .join(', ');
    return `Every week on ${days || '—'}`;
  }

  if (frequency === 'monthly' && 'monthly' in scheduleDays) {
    const days = scheduleDays.monthly.map((day) => ordinal(day)).join(', ');
    return `Every month on the ${days || '—'}`;
  }

  if (frequency === 'yearly' && 'yearly' in scheduleDays) {
    const dates = scheduleDays.yearly
      .map(
        (entry) =>
          `${MONTH_LABELS[entry.month - 1] ?? entry.month} ${entry.day}`,
      )
      .join(', ');
    return `Every year on ${dates || '—'}`;
  }

  return 'Recurring';
}
