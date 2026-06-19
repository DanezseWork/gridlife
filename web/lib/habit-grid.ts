import { useEffect, useState } from "react";

export const HABIT_GRID_BREAKPOINTS = [
  { minWidth: 1280, weeks: 52 },
  { minWidth: 1024, weeks: 52 },
  { minWidth: 768, weeks: 50 },
  { minWidth: 640, weeks: 44 },
] as const;

export const HABIT_GRID_WEEKS_DEFAULT = 36;

export function getHabitGridWeekCount(width: number): number {
  for (const breakpoint of HABIT_GRID_BREAKPOINTS) {
    if (width >= breakpoint.minWidth) {
      return breakpoint.weeks;
    }
  }

  return HABIT_GRID_WEEKS_DEFAULT;
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
