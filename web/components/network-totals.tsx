"use client";

import { useEffect, useMemo, useState } from "react";
import { HoloCard } from "@/components/holo-card";
import { CurrencyPicker } from "@/components/currency-picker";
import type { Wallet } from "@/lib/api";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  totalsByCurrency,
  type CurrencyCode,
} from "@/lib/currencies";
import {
  combineTotalsInCurrency,
  convertAmountToBase,
  fetchExchangeRates,
  formatExchangeRate,
  formatRateUpdatedAt,
  type ExchangeRates,
} from "@/lib/exchange-rates";
import { cn } from "@/lib/utils";

type NetworkView = "split" | "combined";

interface NetworkTotalsProps {
  wallets: Wallet[];
}

export function NetworkTotals({ wallets }: NetworkTotalsProps) {
  const totals = useMemo(() => totalsByCurrency(wallets), [wallets]);
  const presentCurrencies = useMemo(
    () => totals.map(({ currency }) => currency),
    [totals],
  );
  const [view, setView] = useState<NetworkView>("split");
  const [targetCurrency, setTargetCurrency] = useState<CurrencyCode>(
    () => presentCurrencies[0] ?? DEFAULT_CURRENCY,
  );
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  const canCombine = totals.length > 1;

  useEffect(() => {
    if (presentCurrencies.includes(targetCurrency)) return;
    setTargetCurrency(presentCurrencies[0] ?? DEFAULT_CURRENCY);
  }, [presentCurrencies, targetCurrency]);

  useEffect(() => {
    if (view !== "combined" || !canCombine) return;

    let cancelled = false;
    setRatesLoading(true);
    setRatesError(null);

    fetchExchangeRates(targetCurrency)
      .then((nextRates) => {
        if (!cancelled) setRates(nextRates);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setRates(null);
          setRatesError(
            error instanceof Error
              ? error.message
              : "Could not load exchange rates",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setRatesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [view, targetCurrency, canCombine]);

  const combinedTotal = useMemo(() => {
    if (!rates || totals.length === 0) return null;
    try {
      return combineTotalsInCurrency(totals, targetCurrency, rates.rates);
    } catch {
      return null;
    }
  }, [rates, totals, targetCurrency]);

  const breakdown = useMemo(() => {
    if (!rates || view !== "combined") return [];

    return totals.map(({ currency, total }) => {
      try {
        return {
          currency,
          original: total,
          converted: convertAmountToBase(
            total,
            currency,
            targetCurrency,
            rates.rates,
          ),
          rateLabel:
            currency === targetCurrency
              ? null
              : formatExchangeRate(currency, targetCurrency, rates.rates),
        };
      } catch {
        return {
          currency,
          original: total,
          converted: null,
          rateLabel: null,
        };
      }
    });
  }, [rates, totals, targetCurrency, view]);

  if (totals.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium opacity-60 sm:text-base">Network</h2>
        {canCombine && (
          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "split", label: "By currency" },
                { value: "combined", label: "Combined" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setView(value)}
                className={cn(
                  "min-h-9 rounded-md border px-3 py-1.5 text-xs transition-colors sm:text-sm",
                  view === value
                    ? "chip-active"
                    : "border-[var(--color-border)] opacity-70 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <HoloCard>
        {view === "split" || !canCombine ? (
          <div className="divide-y divide-[var(--color-border)]">
            {totals.map(({ currency, total }) => (
              <div
                key={currency}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0 sm:py-3.5"
              >
                <span className="text-sm opacity-60 sm:text-base">{currency}</span>
                <span
                  className="font-data text-lg font-bold tabular-nums sm:text-xl"
                  style={{ color: "var(--color-accent)" }}
                >
                  {formatMoney(total, currency)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-2">
                <p className="text-xs opacity-60 sm:text-sm">Display total in</p>
                <CurrencyPicker
                  value={targetCurrency}
                  onChange={setTargetCurrency}
                  currencies={presentCurrencies}
                  disabled={ratesLoading}
                  className="w-full sm:w-auto"
                />
              </div>
              <div className="text-right">
                {ratesLoading ? (
                  <p className="text-sm opacity-60">Loading rates…</p>
                ) : combinedTotal != null ? (
                  <p
                    className="font-data text-2xl font-bold tabular-nums sm:text-3xl"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {formatMoney(combinedTotal, targetCurrency)}
                  </p>
                ) : (
                  <p className="text-sm text-[#ff3366]">
                    {ratesError ?? "Could not calculate combined total"}
                  </p>
                )}
              </div>
            </div>

            {rates && combinedTotal != null && (
              <p className="text-xs opacity-50 sm:text-sm">
                Exchange rates as of {formatRateUpdatedAt(rates.updatedAt)}
              </p>
            )}

            {ratesError && (
              <p className="text-xs text-[#ff3366] sm:text-sm">{ratesError}</p>
            )}

            {breakdown.length > 0 && combinedTotal != null && (
              <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
                {breakdown.map(({ currency, original, converted, rateLabel }) => (
                  <div
                    key={currency}
                    className="flex items-start justify-between gap-4 text-xs sm:text-sm"
                  >
                    <div className="min-w-0">
                      <span className="opacity-60">{currency}</span>
                      {rateLabel && (
                        <p className="mt-0.5 font-data text-[11px] tabular-nums opacity-45 sm:text-xs">
                          {rateLabel}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-data tabular-nums opacity-80">
                        {formatMoney(original, currency)}
                      </span>
                      {converted != null && currency !== targetCurrency && (
                        <span className="ml-2 font-data tabular-nums opacity-50">
                          → {formatMoney(converted, targetCurrency)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </HoloCard>
    </section>
  );
}
