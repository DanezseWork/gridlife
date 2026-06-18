"use client";

import { useEffect, useState } from "react";
import { HoloCard } from "@/components/holo-card";
import {
  ACCENT_PRESETS,
  isAccentPresetActive,
  normalizeAccentColor,
  resolveAccentPreset,
  useThemeStore,
} from "@/store/theme";
import { cn } from "@/lib/utils";

interface ThemePickerProps {
  compact?: boolean;
  onChange?: (baseColor: string, accentColor: string) => void;
}

export function ThemePicker({ compact = false, onChange }: ThemePickerProps) {
  const { baseColor, accentColor, setBaseColor, setAccentColor } =
    useThemeStore();
  const [customAccent, setCustomAccent] = useState(accentColor);

  useEffect(() => {
    setCustomAccent(accentColor);
  }, [accentColor]);

  function handleBaseSelect(color: "#ffffff" | "#000000") {
    if (baseColor === color) return;
    setBaseColor(color);
    onChange?.(color, useThemeStore.getState().accentColor);
  }

  function handleAccentSelect(preset: string) {
    const resolved = resolveAccentPreset(preset, baseColor);
    const normalized = normalizeAccentColor(resolved, baseColor);
    setAccentColor(normalized);
    setCustomAccent(normalized);
    onChange?.(baseColor, normalized);
  }

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      <HoloCard className={cn("space-y-3", compact && "space-y-2 p-3")}>
        <h2 className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
          Base color
        </h2>
        <div className="flex gap-2">
          {(["#ffffff", "#000000"] as const).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleBaseSelect(color)}
              className={cn(
                "flex flex-1 items-center justify-center rounded-md border text-sm capitalize transition-all",
                compact ? "h-10 text-xs" : "h-12",
                baseColor === color && "chip-active",
              )}
              style={{
                background: color,
                color: color === "#ffffff" ? "#000" : "#fff",
                ...(baseColor !== color && { borderColor: "var(--color-border)" }),
              }}
            >
              {color === "#ffffff" ? "White" : "Black"}
            </button>
          ))}
        </div>
      </HoloCard>

      <HoloCard className={cn("space-y-3", compact && "space-y-2 p-3")}>
        <h2 className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
          Accent color
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-4 md:grid-cols-8 md:gap-3">
          {ACCENT_PRESETS.map((preset) => {
            const displayColor = resolveAccentPreset(preset, baseColor);

            return (
            <button
              key={preset}
              type="button"
              onClick={() => handleAccentSelect(preset)}
              className={cn(
                "aspect-square rounded-md border-2 transition-all",
                isAccentPresetActive(preset, accentColor, baseColor) &&
                  "chip-active scale-105",
                displayColor === "#ffffff" && "ring-1 ring-inset ring-black/10",
                displayColor === "#000000" && "ring-1 ring-inset ring-white/20",
              )}
              style={{
                background: displayColor,
                ...(!isAccentPresetActive(preset, accentColor, baseColor) && {
                  borderColor: "var(--color-border)",
                }),
              }}
              aria-label={`Accent ${displayColor}`}
            />
            );
          })}
        </div>

        <div className="space-y-1">
          <label className="text-xs opacity-60">Custom</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customAccent}
              onChange={(e) => handleAccentSelect(e.target.value)}
              className={cn(
                "cursor-pointer rounded-md border bg-transparent",
                compact ? "h-10 w-14" : "h-11 w-16",
              )}
              style={{ borderColor: "var(--color-border)" }}
            />
            <div
              className="h-10 flex-1 rounded-md border hud-border"
              style={{
                background: `linear-gradient(135deg, ${baseColor}, ${accentColor})`,
                borderColor: "var(--color-accent)",
              }}
            />
          </div>
        </div>
      </HoloCard>
    </div>
  );
}
