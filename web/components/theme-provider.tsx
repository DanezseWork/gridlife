"use client";

import { useEffect } from "react";
import { applyThemeCssVars } from "@/lib/theme-css";
import { useThemeStore } from "@/store/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { baseColor, accentColor } = useThemeStore();

  useEffect(() => {
    applyThemeCssVars(document.documentElement, baseColor, accentColor);
  }, [baseColor, accentColor]);

  return <>{children}</>;
}
