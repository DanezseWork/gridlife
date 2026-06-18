"use client";

import { useMemo, useState } from "react";
import { HoloCard } from "@/components/holo-card";
import type { Transaction, Wallet } from "@/lib/api";
import { formatMoney, type CurrencyCode } from "@/lib/currencies";
import {
  computeNetworkHistory,
  getActiveCurrencies,
  getCurrencyLineColor,
  type NetworkRange,
} from "@/lib/network-history";
import { cn } from "@/lib/utils";

const RANGES: Array<{ value: NetworkRange; label: string }> = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const CHART_WIDTH = 640;
const CHART_HEIGHT = 180;
const CHART_PADDING = { top: 16, right: 12, bottom: 28, left: 12 };

interface NetworkChartProps {
  wallets: Wallet[];
  transactions: Transaction[];
}

function buildLinePath(
  values: number[],
  min: number,
  max: number,
  width: number,
  height: number,
): string {
  if (values.length === 0) {
    return "";
  }

  const span = max - min || 1;
  const innerWidth = width - CHART_PADDING.left - CHART_PADDING.right;
  const innerHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

  return values
    .map((value, index) => {
      const x =
        CHART_PADDING.left +
        (values.length === 1 ? innerWidth / 2 : (index / (values.length - 1)) * innerWidth);
      const normalized = (value - min) / span;
      const y = CHART_PADDING.top + innerHeight - normalized * innerHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function NetworkChart({ wallets, transactions }: NetworkChartProps) {
  const [range, setRange] = useState<NetworkRange>("month");

  const data = useMemo(
    () => computeNetworkHistory(wallets, transactions, range),
    [wallets, transactions, range],
  );

  const currencies = useMemo(
    () => getActiveCurrencies(data, wallets),
    [data, wallets],
  );

  const latestTotals = data.at(-1)?.totals ?? {};

  if (wallets.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium opacity-60 sm:text-base">Network trend</h2>
        <div className="flex flex-wrap gap-2">
          {RANGES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={cn(
                "min-h-9 rounded-md border px-3 py-1.5 text-xs transition-colors sm:text-sm",
                range === value
                  ? "chip-active"
                  : "border-[var(--color-border)] opacity-70 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <HoloCard className="overflow-hidden">
        {data.length === 0 ? (
          <p className="text-center text-sm opacity-60 sm:text-base">
            Add wallets to see your network trend.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                className="h-[180px] w-full min-w-[280px]"
                role="img"
                aria-label="Network balance trend chart"
              >
                {[0.25, 0.5, 0.75].map((ratio) => {
                  const y =
                    CHART_PADDING.top +
                    (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom) * ratio;

                  return (
                    <line
                      key={ratio}
                      x1={CHART_PADDING.left}
                      x2={CHART_WIDTH - CHART_PADDING.right}
                      y1={y}
                      y2={y}
                      stroke="var(--color-border)"
                      strokeDasharray="4 6"
                    />
                  );
                })}

                {currencies.map((currency) => {
                  const values = data.map((point) => point.totals[currency] ?? 0);
                  const min = Math.min(...values);
                  const max = Math.max(...values);
                  const paddedMin = min === max ? min - 1 : min;
                  const paddedMax = min === max ? max + 1 : max;
                  const path = buildLinePath(
                    values,
                    paddedMin,
                    paddedMax,
                    CHART_WIDTH,
                    CHART_HEIGHT,
                  );
                  const color = getCurrencyLineColor(currency);

                  const innerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
                  const lastIndex = values.length - 1;
                  const lastX =
                    CHART_PADDING.left +
                    (values.length === 1 ? innerWidth / 2 : (lastIndex / lastIndex) * innerWidth);
                  const lastY =
                    CHART_PADDING.top +
                    (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom) -
                    ((values.at(-1)! - paddedMin) / (paddedMax - paddedMin)) *
                      (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom);

                  return (
                    <g key={currency}>
                      <path
                        d={path}
                        fill="none"
                        stroke={color}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {values.length > 0 && (
                        <circle cx={lastX} cy={lastY} r={4} fill={color} />
                      )}
                    </g>
                  );
                })}

                {data.map((point, index) => {
                  if (range === "month" && index % 5 !== 0 && index !== data.length - 1) {
                    return null;
                  }

                  if (range === "year" && index % 2 !== 0 && index !== data.length - 1) {
                    return null;
                  }

                  const innerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
                  const x =
                    CHART_PADDING.left +
                    (data.length === 1 ? innerWidth / 2 : (index / (data.length - 1)) * innerWidth);

                  return (
                    <text
                      key={point.date}
                      x={x}
                      y={CHART_HEIGHT - 8}
                      textAnchor="middle"
                      className="fill-current text-[10px] opacity-45"
                    >
                      {point.label}
                    </text>
                  );
                })}
              </svg>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {currencies.map((currency) => (
                <div key={currency} className="flex items-center gap-2 text-xs sm:text-sm">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: getCurrencyLineColor(currency) }}
                  />
                  <span className="opacity-60">{currency}</span>
                  <span className="font-data font-medium tabular-nums">
                    {formatMoney(latestTotals[currency] ?? 0, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </HoloCard>
    </section>
  );
}
