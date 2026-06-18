"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  CalendarClock,
  Repeat,
} from "lucide-react";
import { HoloCard } from "@/components/holo-card";
import {
  TablePagination,
  useTablePagination,
} from "@/components/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlannedQueueItem, Wallet } from "@/lib/api";
import {
  formatMoney,
  resolveCurrency,
  type CurrencyCode,
} from "@/lib/currencies";
import { cn } from "@/lib/utils";

const typeConfig = {
  income: { icon: ArrowDownLeft, color: "#00ff88", label: "Income" },
  expense: { icon: ArrowUpRight, color: "#ff3366", label: "Expense" },
  transfer: { icon: ArrowRightLeft, color: "var(--color-accent)", label: "Transfer" },
} as const;

function queueCurrency(item: PlannedQueueItem): CurrencyCode {
  const wallet =
    item.type === "income"
      ? item.toWallet
      : item.type === "expense"
        ? item.fromWallet
        : item.toWallet ?? item.fromWallet;
  return resolveCurrency(wallet?.currency);
}

function walletLabel(item: PlannedQueueItem): string {
  if (item.type === "transfer") {
    return `${item.fromWallet?.name ?? "?"} → ${item.toWallet?.name ?? "?"}`;
  }
  if (item.type === "income") return item.toWallet?.name ?? "—";
  return item.fromWallet?.name ?? "—";
}

function formatQueueDate(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString();
}

function planKindLabel(item: PlannedQueueItem): string {
  if (item.kind === "scheduled") return "Scheduled";
  if (item.frequency === "weekly") return "Weekly";
  if (item.frequency === "monthly") return "Monthly";
  if (item.frequency === "yearly") return "Yearly";
  return "Recurring";
}

interface PlannedQueueTableProps {
  queue: PlannedQueueItem[];
  wallets: Wallet[];
  onDeactivate: (plannedTransactionId: string) => void;
}

export function PlannedQueueTable({
  queue,
  wallets,
  onDeactivate,
}: PlannedQueueTableProps) {
  const [kindFilter, setKindFilter] = useState<"all" | "scheduled" | "recurring">(
    "all",
  );

  const filteredQueue = useMemo(() => {
    if (kindFilter === "all") return queue;
    return queue.filter((item) => item.kind === kindFilter);
  }, [queue, kindFilter]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems,
  } = useTablePagination(filteredQueue, [kindFilter, queue.length]);

  if (wallets.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium opacity-60 sm:text-base">
          Scheduled & recurring plans
        </h2>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { value: "all", label: "All" },
              { value: "scheduled", label: "Scheduled" },
              { value: "recurring", label: "Recurring" },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setKindFilter(value)}
              className={cn(
                "min-h-9 rounded-md border px-3 py-1.5 text-xs transition-colors sm:text-sm",
                kindFilter === value
                  ? "chip-active"
                  : "border-[var(--color-border)] opacity-70 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <HoloCard className="overflow-hidden p-0">
        {filteredQueue.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm opacity-60 sm:text-base">
            No active scheduled or recurring plans.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--color-border)] hover:bg-transparent">
                <TableHead className="pl-4 text-xs opacity-60 sm:text-sm">
                  When
                </TableHead>
                <TableHead className="text-xs opacity-60 sm:text-sm">
                  Type
                </TableHead>
                <TableHead className="text-xs opacity-60 sm:text-sm">
                  Schedule
                </TableHead>
                <TableHead className="hidden text-xs opacity-60 sm:table-cell sm:text-sm">
                  Wallet
                </TableHead>
                <TableHead className="text-right text-xs opacity-60 sm:text-sm">
                  Amount
                </TableHead>
                <TableHead className="pr-4 text-right text-xs opacity-60 sm:text-sm">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => {
                const config = typeConfig[item.type];
                const Icon = config.icon;
                const currency = queueCurrency(item);
                const PlanIcon = item.kind === "scheduled" ? CalendarClock : Repeat;

                return (
                  <TableRow
                    key={item.plannedTransactionId}
                    className="border-[var(--color-border)] hover:bg-[var(--color-accent-surface)]"
                  >
                    <TableCell className="pl-4 font-data text-xs tabular-nums sm:text-sm">
                      <div className="text-[11px] uppercase tracking-wide opacity-45 sm:text-xs">
                        {item.kind === "scheduled" ? "Due" : "Started"}
                      </div>
                      <div>{formatQueueDate(item.anchorDate)}</div>
                      {item.kind === "recurring" && item.nextDueDate && (
                        <div className="mt-0.5 text-[11px] opacity-50 sm:text-xs">
                          Next: {formatQueueDate(item.nextDueDate)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium sm:text-sm"
                        style={{
                          color: config.color,
                          background: `color-mix(in srgb, ${config.color} 15%, transparent)`,
                        }}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {config.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium sm:text-sm">
                          <PlanIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
                          {planKindLabel(item)}
                        </span>
                        <p className="max-w-[14rem] text-xs leading-snug opacity-60 sm:max-w-none sm:text-sm">
                          {item.scheduleSummary}
                        </p>
                        {item.note && (
                          <p className="max-w-[14rem] truncate text-xs opacity-45 sm:max-w-none sm:text-sm">
                            {item.note}
                          </p>
                        )}
                        {item.endDate && (
                          <p className="text-[11px] opacity-45 sm:text-xs">
                            Until {formatQueueDate(item.endDate)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-48 truncate opacity-70 sm:table-cell">
                      {walletLabel(item)}
                    </TableCell>
                    <TableCell
                      className="text-right font-data text-xs font-medium tabular-nums sm:text-sm"
                      style={{ color: config.color }}
                    >
                      {item.type === "expense"
                        ? "-"
                        : item.type === "income"
                          ? "+"
                          : ""}
                      {formatMoney(item.amount, currency)}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <button
                        type="button"
                        onClick={() => onDeactivate(item.plannedTransactionId)}
                        className="text-xs text-[#ff3366] opacity-80 transition-opacity hover:opacity-100 sm:text-sm"
                      >
                        Cancel plan
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <TablePagination
          totalItems={filteredQueue.length}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </HoloCard>
    </section>
  );
}
