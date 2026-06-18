export type HabitFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom';

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
  | HabitCustomSchedule;
