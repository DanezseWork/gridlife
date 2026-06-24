import {
  getAccentGlow,
  getAccentSurface,
  getOnAccentColor,
} from "@/lib/color-utils";

export function getBaseInverseColor(baseColor: string): string {
  return baseColor === "#ffffff" ? "#000000" : "#ffffff";
}

export function applyThemeCssVars(
  root: HTMLElement,
  baseColor: string,
  accentColor: string,
) {
  const inverse = getBaseInverseColor(baseColor);

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

  const normalizedBase = baseColor.trim().toLowerCase();
  const isLightBase =
    normalizedBase === "#ffffff" || normalizedBase === "#fff";
  root.style.setProperty("color-scheme", isLightBase ? "light" : "dark");
}
