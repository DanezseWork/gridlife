import { useEffect, useState } from "react";

export const HABIT_GRID_BREAKPOINTS = [
  { minWidth: 1280, weeks: 52 },
  { minWidth: 1024, weeks: 32 },
  { minWidth: 768, weeks: 20 },
  { minWidth: 640, weeks: 12 },
] as const;

export const HABIT_GRID_WEEKS_DEFAULT = 8;

export function getHabitGridWeekCount(width: number): number {
  for (const breakpoint of HABIT_GRID_BREAKPOINTS) {
    if (width >= breakpoint.minWidth) {
      return breakpoint.weeks;
    }
  }

  return HABIT_GRID_WEEKS_DEFAULT;
}

export function isCompactHabitGrid(weekCount: number): boolean {
  return weekCount > 20;
}

export function useHabitGridWeekCount(): number {
  const [weekCount, setWeekCount] = useState(HABIT_GRID_WEEKS_DEFAULT);

  useEffect(() => {
    const sync = () => setWeekCount(getHabitGridWeekCount(window.innerWidth));

    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return weekCount;
}
