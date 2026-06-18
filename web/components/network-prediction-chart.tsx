"use client";

import { useEffect, useMemo, useState } from "react";
import { HoloCard } from "@/components/holo-card";
import {
  api,
  type NetworkProjectionPoint,
  type NetworkProjectionRange,
  type ProjectionUnit,
  type Wallet,
} from "@/lib/api";
import { formatMoney, resolveCurrency, type CurrencyCode } from "@/lib/currencies";
import { getCurrencyLineColor } from "@/lib/network-history";
import { cn } from "@/lib/utils";

const PRESETS: Array<{ label: string; unit: ProjectionUnit; count: number }> = [
  { label: "Week", unit: "week", count: 1 },
  { label: "Month", unit: "month", count: 1 },
  { label: "Year", unit: "year", count: 1 },
];

const MAX_PROJECTION_COUNT: Record<ProjectionUnit, number> = {
  week: 104,
  month: 120,
  year: 10,
};

const UNIT_LABELS: Record<ProjectionUnit, string> = {
  week: "Weeks",
  month: "Months",
  year: "Years",
};

const CHART_WIDTH = 640;
const CHART_HEIGHT = 180;
const CHART_PADDING = { top: 16, right: 12, bottom: 28, left: 12 };

interface NetworkPredictionChartProps {
  wallets: Wallet[];
  refreshKey?: number | string;
}

function clampCount(unit: ProjectionUnit, count: number): number {
  return Math.max(1, Math.min(Math.floor(count), MAX_PROJECTION_COUNT[unit]));
}

function buildLinePath(
  values: number[],
  min: number,
  max: number,
  width: number,
  height: number,
): string {
  if (values.length === 0) return "";

  const span = max - min || 1;
  const innerWidth = width - CHART_PADDING.left - CHART_PADDING.right;
  const innerHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

  return values
    .map((value, index) => {
      const x =
        CHART_PADDING.left +
        (values.length === 1
          ? innerWidth / 2
          : (index / (values.length - 1)) * innerWidth);
      const normalized = (value - min) / span;
      const y = CHART_PADDING.top + innerHeight - normalized * innerHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function getActiveCurrencies(
  data: NetworkProjectionPoint[],
  wallets: Wallet[],
): CurrencyCode[] {
  const currencies = new Set<CurrencyCode>();
  for (const wallet of wallets) {
    currencies.add(resolveCurrency(wallet.currency));
  }
  for (const point of data) {
    for (const [currency, total] of Object.entries(point.totals)) {
      if ((total ?? 0) !== 0) {
        currencies.add(currency as CurrencyCode);
      }
    }
  }
  return Array.from(currencies).sort((left, right) => left.localeCompare(right));
}

function shouldShowAxisLabel(index: number, total: number): boolean {
  if (total <= 7) return true;
  if (total <= 31) return index % 5 === 0 || index === total - 1;
  if (total <= 52) return index % 2 === 0 || index === total - 1;

  const step = Math.max(1, Math.ceil(total / 12));
  return index % step === 0 || index === total - 1;
}

function isPresetRange(range: NetworkProjectionRange): boolean {
  return PRESETS.some(
    (preset) => preset.unit === range.unit && preset.count === range.count,
  );
}

export function NetworkPredictionChart({
  wallets,
  refreshKey = 0,
}: NetworkPredictionChartProps) {
  const [range, setRange] = useState<NetworkProjectionRange>({
    unit: "month",
    count: 1,
  });
  const [customMode, setCustomMode] = useState(false);
  const [customCountInput, setCustomCountInput] = useState("1");
  const [data, setData] = useState<NetworkProjectionPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getNetworkProjection(range)
      .then((projection) => {
        if (!cancelled) setData(projection);
      })
      .catch(() => {
        if (!cancelled) setData([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range, wallets, refreshKey]);

  const currencies = useMemo(
    () => getActiveCurrencies(data, wallets),
    [data, wallets],
  );

  const latestTotals = data.at(-1)?.totals ?? {};

  const applyCustomRange = (unit: ProjectionUnit, rawCount: string) => {
    const parsed = Number.parseInt(rawCount, 10);
    const count = clampCount(unit, Number.isFinite(parsed) ? parsed : 1);
    setCustomCountInput(String(count));
    setRange({ unit, count });
  };

  if (wallets.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium opacity-60 sm:text-base">
          Network prediction
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map(({ label, unit, count }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setCustomMode(false);
                setRange({ unit, count });
                setCustomCountInput(String(count));
              }}
              className={cn(
                "min-h-9 rounded-md border px-3 py-1.5 text-xs transition-colors sm:text-sm",
                !customMode && range.unit === unit && range.count === count
                  ? "chip-active"
                  : "border-[var(--color-border)] opacity-70 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
              )}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setCustomMode(true);
              if (isPresetRange(range)) {
                setCustomCountInput("2");
                setRange({ unit: range.unit, count: 2 });
              } else {
                setCustomCountInput(String(range.count));
              }
            }}
            className={cn(
              "min-h-9 rounded-md border px-3 py-1.5 text-xs transition-colors sm:text-sm",
              customMode
                ? "chip-active"
                : "border-[var(--color-border)] opacity-70 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
            )}
          >
            Custom
          </button>
        </div>
      </div>

      {customMode && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs opacity-70 sm:text-sm">
            <span>Look ahead</span>
            <input
              type="number"
              min={1}
              max={MAX_PROJECTION_COUNT[range.unit]}
              value={customCountInput}
              onChange={(event) => {
                setCustomCountInput(event.target.value);
              }}
              onBlur={() => applyCustomRange(range.unit, customCountInput)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applyCustomRange(range.unit, customCountInput);
                }
              }}
              className="h-9 w-20 rounded-md border border-[var(--color-border)] bg-transparent px-2 font-data tabular-nums"
            />
          </label>
          <select
            value={range.unit}
            onChange={(event) => {
              const unit = event.target.value as ProjectionUnit;
              applyCustomRange(unit, customCountInput);
            }}
            className="h-9 rounded-md border border-[var(--color-border)] bg-transparent px-2 text-xs sm:text-sm"
          >
            {(Object.keys(UNIT_LABELS) as ProjectionUnit[]).map((unit) => (
              <option key={unit} value={unit}>
                {UNIT_LABELS[unit]}
              </option>
            ))}
          </select>
        </div>
      )}

      <HoloCard className="overflow-hidden">
        {loading ? (
          <p className="text-center text-sm opacity-60 sm:text-base">
            Loading projection…
          </p>
        ) : data.length === 0 ? (
          <p className="text-center text-sm opacity-60 sm:text-base">
            Add scheduled or recurring transactions to see predictions.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                className="h-[180px] w-full min-w-[280px]"
                role="img"
                aria-label="Network balance prediction chart"
              >
                {[0.25, 0.5, 0.75].map((ratio) => {
                  const y =
                    CHART_PADDING.top +
                    (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom) *
                      ratio;

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

                  const innerWidth =
                    CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
                  const lastIndex = values.length - 1;
                  const lastX =
                    CHART_PADDING.left +
                    (values.length === 1
                      ? innerWidth / 2
                      : (lastIndex / lastIndex) * innerWidth);
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
                        strokeDasharray="6 4"
                      />
                      {values.length > 0 && (
                        <circle cx={lastX} cy={lastY} r={4} fill={color} />
                      )}
                    </g>
                  );
                })}

                {data.map((point, index) => {
                  if (!shouldShowAxisLabel(index, data.length)) {
                    return null;
                  }

                  const innerWidth =
                    CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
                  const x =
                    CHART_PADDING.left +
                    (data.length === 1
                      ? innerWidth / 2
                      : (index / (data.length - 1)) * innerWidth);

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
