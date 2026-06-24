"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectPickerProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
  placeholder?: string;
}

export function SelectPicker({
  value,
  onChange,
  options,
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
  placeholder = "Select…",
}: SelectPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listboxId = `${triggerId}-listbox`;
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", handlePointerDown);
    }, 0);

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleSelect(nextValue: string) {
    if (nextValue !== value) onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={triggerId}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full min-h-11 items-center justify-between gap-2 rounded-md border bg-transparent px-3 text-left text-sm transition-colors sm:min-h-12",
          "border-[var(--color-border)] hover:border-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/50",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <span className="truncate">
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 opacity-60 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={ariaLabel ? undefined : triggerId}
          aria-label={ariaLabel}
          className="absolute top-[calc(100%+0.375rem)] left-0 z-50 max-h-60 w-full overflow-y-auto rounded-lg border p-1 shadow-lg"
          style={{
            background: "var(--color-base)",
            color: "var(--color-inverse)",
            borderColor: "var(--color-border)",
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
              >
                <button
                  type="button"
                  disabled={option.disabled}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                    isSelected
                      ? "chip-active"
                      : "hover:bg-[var(--color-accent-surface)]",
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
