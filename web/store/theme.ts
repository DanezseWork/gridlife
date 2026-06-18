import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  baseColor: string;
  accentColor: string;
  setBaseColor: (color: string) => void;
  setAccentColor: (color: string) => void;
  applyTheme: (baseColor: string, accentColor: string) => void;
}

export const INVERSE_ACCENT_PRESET = "inverse" as const;

export function getBaseInverseColor(baseColor: string): string {
  return baseColor === "#ffffff" ? "#000000" : "#ffffff";
}

export function resolveAccentPreset(preset: string, baseColor: string): string {
  if (preset === INVERSE_ACCENT_PRESET) return getBaseInverseColor(baseColor);
  return preset;
}

/** Keep accent visible by flipping it when it matches the base color. */
export function normalizeAccentColor(color: string, baseColor: string): string {
  return color.toLowerCase() === baseColor.toLowerCase()
    ? getBaseInverseColor(baseColor)
    : color;
}

export function isAccentPresetActive(
  preset: string,
  accentColor: string,
  baseColor: string,
): boolean {
  return accentColor === resolveAccentPreset(preset, baseColor);
}

function syncAccentForBaseChange(
  accentColor: string,
  oldBaseColor: string,
  newBaseColor: string,
): string {
  const oldInverse = getBaseInverseColor(oldBaseColor);
  const newInverse = getBaseInverseColor(newBaseColor);

  if (
    accentColor === oldInverse ||
    accentColor === newBaseColor ||
    accentColor === oldBaseColor
  ) {
    return newInverse;
  }

  return normalizeAccentColor(accentColor, newBaseColor);
}

function applyCssVars(baseColor: string, accentColor: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--color-base", baseColor);
  root.style.setProperty("--color-inverse", baseColor === "#ffffff" ? "#000000" : "#ffffff");
  root.style.setProperty("--color-accent", accentColor);
  root.style.setProperty(
    "--color-accent-glow",
    `color-mix(in srgb, ${accentColor} 40%, transparent)`,
  );
  root.style.setProperty(
    "--color-surface",
    `color-mix(in srgb, ${baseColor} 5%, transparent)`,
  );
  root.style.setProperty(
    "--color-border",
    `color-mix(in srgb, ${baseColor} 15%, transparent)`,
  );
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      baseColor: "#ffffff",
      accentColor: "#00ffff",
      setBaseColor: (baseColor) => {
        set((state) => {
          const accentColor = syncAccentForBaseChange(
            state.accentColor,
            state.baseColor,
            baseColor,
          );
          applyCssVars(baseColor, accentColor);
          return { baseColor, accentColor };
        });
      },
      setAccentColor: (accentColor) => {
        set((state) => {
          const normalized = normalizeAccentColor(accentColor, state.baseColor);
          applyCssVars(state.baseColor, normalized);
          return { accentColor: normalized };
        });
      },
      applyTheme: (baseColor, accentColor) => {
        const normalized = normalizeAccentColor(accentColor, baseColor);
        applyCssVars(baseColor, normalized);
        set({ baseColor, accentColor: normalized });
      },
    }),
    {
      name: "gridlife-theme",
      onRehydrateStorage: () => (state) => {
        if (state) {
          const accentColor = normalizeAccentColor(
            state.accentColor,
            state.baseColor,
          );
          if (accentColor !== state.accentColor) {
            state.accentColor = accentColor;
          }
          applyCssVars(state.baseColor, accentColor);
        }
      },
    },
  ),
);

export const ACCENT_PRESETS = [
  "#00ffff",
  INVERSE_ACCENT_PRESET,
  "#ff00ff",
  "#00ff88",
  "#ff6600",
  "#8866ff",
  "#ff3366",
  "#ffff00",
] as const;
