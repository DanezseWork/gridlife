"use client";

import { useEffect, useState } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CollapsibleIconPickerProps {
  label?: string;
  iconIds: readonly string[];
  selectedIcon: string;
  onSelect: (iconId: string) => void;
  getIconComponent: (iconId: string) => LucideIcon;
  accentColor: string;
  columns?: 5 | 6 | 7;
  resetKey?: string | boolean;
}

export function CollapsibleIconPicker({
  label = "Icon",
  iconIds,
  selectedIcon,
  onSelect,
  getIconComponent,
  accentColor,
  columns = 7,
  resetKey,
}: CollapsibleIconPickerProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [resetKey]);

  const SelectedIcon = getIconComponent(selectedIcon);
  const gridCols =
    columns === 5 ? "grid-cols-5" : columns === 6 ? "grid-cols-6" : "grid-cols-7";

  function handleSelect(iconId: string) {
    onSelect(iconId);
    setExpanded(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs opacity-60 transition-opacity hover:opacity-100"
        >
          {expanded ? "Hide icons" : `Browse ${iconIds.length} icons`}
          <ChevronDown
            className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")}
          />
        </button>
      </div>

      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors"
          style={{
            background:
              "color-mix(in srgb, var(--color-inverse) 8%, var(--color-base))",
            border:
              "1px solid color-mix(in srgb, var(--color-inverse) 10%, transparent)",
          }}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: `color-mix(in srgb, ${accentColor} 18%, var(--color-base))`,
            }}
          >
            <SelectedIcon className="h-5 w-5" style={{ color: accentColor }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium capitalize">{selectedIcon.replace(/-/g, " ")}</p>
            <p className="text-xs opacity-50">Tap to choose a different icon</p>
          </div>
        </button>
      ) : (
        <div className={cn("grid gap-2", gridCols)}>
          {iconIds.map((iconId) => {
            const Icon = getIconComponent(iconId);
            const selected = selectedIcon === iconId;
            return (
              <button
                key={iconId}
                type="button"
                aria-label={`Select ${iconId} icon`}
                onClick={() => handleSelect(iconId)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-xl transition-colors",
                  selected && "ring-2",
                )}
                style={{
                  background: selected
                    ? `color-mix(in srgb, ${accentColor} 20%, var(--color-base))`
                    : "color-mix(in srgb, var(--color-inverse) 8%, var(--color-base))",
                  color: selected ? accentColor : "var(--color-inverse)",
                  ...(selected ? { boxShadow: `0 0 0 2px ${accentColor}` } : {}),
                }}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
