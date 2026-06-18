export type HabitFrequency = "daily" | "weekly" | "monthly" | "yearly" | "custom";

export type HabitWeeklySchedule = { weekly: number[] };
export type HabitMonthlySchedule = { monthly: number[] };
export type HabitYearlySchedule = {
  yearly: Array<{ month: number; day: number }>;
};
export type HabitCustomSchedule = { intervalDays: number };

export type HabitScheduleDays =
  | HabitWeeklySchedule
  | HabitMonthlySchedule
  | HabitYearlySchedule
  | HabitCustomSchedule
  | null;

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
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

function daysBetween(fromKey: string, toKey: string): number {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  const ms = to.getTime() - from.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function addDaysToKey(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateKey(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isHabitScheduleDays(value: unknown): value is HabitScheduleDays {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if ("weekly" in record && Array.isArray(record.weekly)) return true;
  if ("monthly" in record && Array.isArray(record.monthly)) return true;
  if ("yearly" in record && Array.isArray(record.yearly)) return true;
  if ("intervalDays" in record && typeof record.intervalDays === "number") {
    return true;
  }
  return false;
}

export function habitAnchorDateKey(createdAt: string): string {
  const date = new Date(createdAt);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isHabitDueOnDate(
  frequency: HabitFrequency,
  scheduleDays: HabitScheduleDays,
  dateKey: string,
  anchorDateKey: string,
): boolean {
  if (frequency === "daily") return true;

  const date = parseDateKey(dateKey);

  if (frequency === "weekly" && scheduleDays && "weekly" in scheduleDays) {
    return scheduleDays.weekly.includes(date.getDay());
  }

  if (frequency === "monthly" && scheduleDays && "monthly" in scheduleDays) {
    return scheduleDays.monthly.includes(date.getDate());
  }

  if (frequency === "yearly" && scheduleDays && "yearly" in scheduleDays) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return scheduleDays.yearly.some(
      (entry) => entry.month === month && entry.day === day,
    );
  }

  if (
    frequency === "custom" &&
    scheduleDays &&
    "intervalDays" in scheduleDays &&
    scheduleDays.intervalDays > 0
  ) {
    const diff = daysBetween(anchorDateKey, dateKey);
    return diff >= 0 && diff % scheduleDays.intervalDays === 0;
  }

  return false;
}

export function findPreviousDueDate(
  frequency: HabitFrequency,
  scheduleDays: HabitScheduleDays,
  fromDateKey: string,
  anchorDateKey: string,
  maxLookback = 400,
): string | null {
  for (let i = 0; i <= maxLookback; i++) {
    const candidate = addDaysToKey(fromDateKey, -i);
    if (isHabitDueOnDate(frequency, scheduleDays, candidate, anchorDateKey)) {
      return candidate;
    }
  }
  return null;
}

export function formatHabitScheduleSummary(
  frequency: HabitFrequency,
  scheduleDays: HabitScheduleDays,
): string {
  if (frequency === "daily") return "Every day";

  if (frequency === "weekly" && scheduleDays && "weekly" in scheduleDays) {
    const days = scheduleDays.weekly
      .map((day) => WEEKDAY_LABELS[day] ?? String(day))
      .join(", ");
    return days ? `Weekly · ${days}` : "Weekly";
  }

  if (frequency === "monthly" && scheduleDays && "monthly" in scheduleDays) {
    const days = scheduleDays.monthly.map((day) => ordinal(day)).join(", ");
    return days ? `Monthly · ${days}` : "Monthly";
  }

  if (frequency === "yearly" && scheduleDays && "yearly" in scheduleDays) {
    const dates = scheduleDays.yearly
      .map(
        (entry) =>
          `${MONTH_LABELS[entry.month - 1] ?? entry.month} ${entry.day}`,
      )
      .join(", ");
    return dates ? `Yearly · ${dates}` : "Yearly";
  }

  if (
    frequency === "custom" &&
    scheduleDays &&
    "intervalDays" in scheduleDays
  ) {
    const n = scheduleDays.intervalDays;
    return n === 1 ? "Every day" : `Every ${n} days`;
  }

  return frequency;
}

export function getHabitFrequencyLabel(frequency: HabitFrequency): string {
  switch (frequency) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "yearly":
      return "Yearly";
    case "custom":
      return "Custom";
  }
}

export function getHabitFrequencyShortLabel(
  frequency: HabitFrequency,
  scheduleDays: HabitScheduleDays,
): string {
  switch (frequency) {
    case "daily":
      return "Daily";
    case "weekly":
      if (scheduleDays && "weekly" in scheduleDays && scheduleDays.weekly.length) {
        return scheduleDays.weekly
          .map((day) => WEEKDAY_LABELS[day] ?? String(day))
          .join(", ");
      }
      return "Weekly";
    case "monthly":
      if (scheduleDays && "monthly" in scheduleDays && scheduleDays.monthly.length) {
        return scheduleDays.monthly.map((day) => ordinal(day)).join(", ");
      }
      return "Monthly";
    case "yearly":
      if (scheduleDays && "yearly" in scheduleDays && scheduleDays.yearly.length) {
        return scheduleDays.yearly
          .map(
            (entry) =>
              `${MONTH_LABELS[entry.month - 1] ?? entry.month} ${entry.day}`,
          )
          .join(", ");
      }
      return "Yearly";
    case "custom":
      if (scheduleDays && "intervalDays" in scheduleDays) {
        const n = scheduleDays.intervalDays;
        return n === 1 ? "Daily" : `Every ${n}d`;
      }
      return "Custom";
  }
}

export function defaultScheduleDays(
  frequency: HabitFrequency,
  referenceDate = new Date(),
): HabitScheduleDays {
  switch (frequency) {
    case "daily":
      return null;
    case "weekly":
      return { weekly: [referenceDate.getDay()] };
    case "monthly":
      return { monthly: [referenceDate.getDate()] };
    case "yearly":
      return {
        yearly: [
          { month: referenceDate.getMonth() + 1, day: referenceDate.getDate() },
        ],
      };
    case "custom":
      return { intervalDays: 3 };
  }
}

export function buildHabitScheduleDays(
  frequency: HabitFrequency,
  weeklyDays?: number[],
  monthlyDays?: number[],
  yearlyDays?: Array<{ month: number; day: number }>,
  intervalDays?: number,
): HabitScheduleDays {
  if (frequency === "daily") return null;

  if (frequency === "weekly") {
    return {
      weekly: [...new Set(weeklyDays ?? [])].sort((a, b) => a - b),
    };
  }

  if (frequency === "monthly") {
    return {
      monthly: [...new Set(monthlyDays ?? [])].sort((a, b) => a - b),
    };
  }

  if (frequency === "yearly") {
    return {
      yearly: (yearlyDays ?? []).map((entry) => ({
        month: entry.month,
        day: entry.day,
      })),
    };
  }

  return { intervalDays: intervalDays ?? 3 };
}

export function scheduleDaysFromHabit(
  scheduleDays: unknown,
): HabitScheduleDays {
  return isHabitScheduleDays(scheduleDays) ? scheduleDays : null;
}

export function isHabitDueToday(
  frequency: HabitFrequency,
  scheduleDays: HabitScheduleDays,
  todayKey: string,
  anchorDateKey: string,
): boolean {
  return isHabitDueOnDate(frequency, scheduleDays, todayKey, anchorDateKey);
}
