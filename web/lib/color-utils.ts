export function getLuminance(hex: string): number {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return 0;

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const toLinear = (channel: number) =>
    channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function getOnAccentColor(accentColor: string): string {
  return getLuminance(accentColor) > 0.55 ? "#000000" : "#ffffff";
}

export function getAccentGlow(accentColor: string): string {
  const strength = getLuminance(accentColor) > 0.55 ? "18%" : "40%";
  return `color-mix(in srgb, ${accentColor} ${strength}, transparent)`;
}

export function getAccentSurface(accentColor: string): string {
  return `color-mix(in srgb, ${accentColor} 14%, transparent)`;
}
