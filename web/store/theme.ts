import { create } from "zustand";
import { persist } from "zustand/middleware";
import { applyThemeCssVars, getBaseInverseColor } from "@/lib/theme-css";

interface ThemeState {
  baseColor: string;
  accentColor: string;
  setBaseColor: (color: string) => void;
  setAccentColor: (color: string) => void;
  applyTheme: (baseColor: string, accentColor: string) => void;
}

export const INVERSE_ACCENT_PRESET = "inverse" as const;

export { getBaseInverseColor } from "@/lib/theme-css";

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

function applyThemeToDocument(baseColor: string, accentColor: string) {
  if (typeof document === "undefined") return;
  applyThemeCssVars(document.documentElement, baseColor, accentColor);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      baseColor: "#000000",
      accentColor: "#ffffff",
      setBaseColor: (baseColor) => {
        set((state) => {
          const accentColor = syncAccentForBaseChange(
            state.accentColor,
            state.baseColor,
            baseColor,
          );
          applyThemeToDocument(baseColor, accentColor);
          return { baseColor, accentColor };
        });
      },
      setAccentColor: (accentColor) => {
        set((state) => {
          const normalized = normalizeAccentColor(accentColor, state.baseColor);
          applyThemeToDocument(state.baseColor, normalized);
          return { accentColor: normalized };
        });
      },
      applyTheme: (baseColor, accentColor) => {
        const normalized = normalizeAccentColor(accentColor, baseColor);
        applyThemeToDocument(baseColor, normalized);
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
