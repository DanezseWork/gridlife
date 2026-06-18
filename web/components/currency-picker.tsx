"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { CURRENCIES, getCurrency, type CurrencyCode } from "@/lib/currencies";
import { cn } from "@/lib/utils";

interface CurrencyPickerProps {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  disabled?: boolean;
  className?: string;
  currencies?: CurrencyCode[];
}

export function CurrencyPicker({
  value,
  onChange,
  disabled,
  className,
  currencies,
}: CurrencyPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = getCurrency(value);
  const options = useMemo(
    () =>
      currencies
        ? CURRENCIES.filter((currency) => currencies.includes(currency.code))
        : CURRENCIES,
    [currencies],
  );

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

    // Defer so the opening click doesn't immediately close the menu.
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

  function handleSelect(code: CurrencyCode) {
    if (code !== value) onChange(code);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <label id="finance-currency-label" className="sr-only">
        Currency
      </label>
      <button
        type="button"
        id="finance-currency"
        aria-labelledby="finance-currency-label"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "btn-accent-outline flex min-h-10 w-full min-w-[11rem] items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:min-h-11 sm:min-w-[13rem]",
          disabled && "opacity-50",
        )}
      >
        <span className="truncate text-left">
          {selected
            ? `${selected.symbol} ${selected.code} · ${selected.label}`
            : value}
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
          role="listbox"
          aria-labelledby="finance-currency-label"
          className="absolute top-[calc(100%+0.375rem)] right-0 z-50 max-h-60 w-full min-w-[13rem] overflow-y-auto rounded-lg border p-1 shadow-lg"
          style={{
            background: "var(--color-base)",
            color: "var(--color-inverse)",
            borderColor: "var(--color-border)",
          }}
        >
          {options.map((currency) => {
            const isSelected = currency.code === value;
            return (
              <li key={currency.code} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(currency.code)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "chip-active"
                      : "hover:bg-[var(--color-accent-surface)]",
                  )}
                >
                  <span className="truncate">
                    {currency.symbol} {currency.code} · {currency.label}
                  </span>
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
