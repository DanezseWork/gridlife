"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/theme";
import {
  getAccentGlow,
  getAccentSurface,
  getOnAccentColor,
} from "@/lib/color-utils";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { baseColor, accentColor } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    const inverse = baseColor === "#ffffff" ? "#000000" : "#ffffff";

    root.style.setProperty("--color-base", baseColor);
    root.style.setProperty("--color-inverse", inverse);
    root.style.setProperty("--color-accent", accentColor);
    root.style.setProperty("--color-on-accent", getOnAccentColor(accentColor));
    root.style.setProperty("--color-accent-glow", getAccentGlow(accentColor));
    root.style.setProperty(
      "--color-accent-surface",
      getAccentSurface(accentColor),
    );
    root.style.setProperty(
      "--color-surface",
      `color-mix(in srgb, ${baseColor} 5%, transparent)`,
    );
    root.style.setProperty(
      "--color-border",
      `color-mix(in srgb, ${inverse} 15%, transparent)`,
    );
  }, [baseColor, accentColor]);

  return <>{children}</>;
}
