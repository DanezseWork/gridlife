"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Search,
  X,
} from "lucide-react";
import { HoloCard } from "@/components/holo-card";
import { Input } from "@/components/ui/input";
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
import type { Transaction, Wallet } from "@/lib/api";
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

type TypeFilter = "all" | Transaction["type"];

function transactionCurrency(tx: Transaction): CurrencyCode {
  const wallet =
    tx.type === "income"
      ? tx.toWallet
      : tx.type === "expense"
        ? tx.fromWallet
        : tx.toWallet ?? tx.fromWallet;
  return resolveCurrency(wallet?.currency);
}

function walletLabel(tx: Transaction): string {
  if (tx.type === "transfer") {
    return `${tx.fromWallet?.name ?? "?"} → ${tx.toWallet?.name ?? "?"}`;
  }
  if (tx.type === "income") return tx.toWallet?.name ?? "—";
  return tx.fromWallet?.name ?? "—";
}

function matchesWallet(tx: Transaction, walletId: string): boolean {
  return tx.fromWalletId === walletId || tx.toWalletId === walletId;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  wallets: Wallet[];
}

export function TransactionsTable({
  transactions,
  wallets,
}: TransactionsTableProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [walletFilter, setWalletFilter] = useState("");
  const [search, setSearch] = useState("");

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (walletFilter && !matchesWallet(tx, walletFilter)) return false;
      if (!query) return true;

      const haystack = [
        tx.note,
        typeConfig[tx.type].label,
        walletLabel(tx),
        tx.fromWallet?.name,
        tx.toWallet?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [transactions, typeFilter, walletFilter, search]);

  const hasActiveFilters =
    typeFilter !== "all" || walletFilter !== "" || search.trim() !== "";

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedItems,
  } = useTablePagination(filteredTransactions, [
    typeFilter,
    walletFilter,
    search,
    transactions.length,
  ]);

  function clearFilters() {
    setTypeFilter("all");
    setWalletFilter("");
    setSearch("");
  }

  if (transactions.length === 0) {
    return (
      <HoloCard>
        <p className="text-center text-sm opacity-60 sm:text-base">
          No transactions yet.
        </p>
      </HoloCard>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 opacity-40" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, wallets…"
            className="min-h-10 border-[var(--color-border)] bg-transparent pl-9"
          />
        </div>

        <select
          value={walletFilter}
          onChange={(e) => setWalletFilter(e.target.value)}
          aria-label="Filter by wallet"
          className="min-h-10 rounded-md border bg-transparent px-3 text-sm"
          style={{ borderColor: "var(--color-border)" }}
        >
          <option value="">All wallets</option>
          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-md border px-3 text-sm opacity-70 transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            style={{ borderColor: "var(--color-border)" }}
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { value: "all", label: "All" },
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
            { value: "transfer", label: "Transfer" },
          ] as const
        ).map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTypeFilter(value)}
            className={cn(
              "min-h-9 rounded-md border px-3 py-1.5 text-xs transition-colors sm:text-sm",
              typeFilter === value
                ? "chip-active"
                : "border-[var(--color-border)] opacity-70 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <HoloCard className="overflow-hidden p-0">
        {filteredTransactions.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm opacity-60 sm:text-base">
            No transactions match your filters.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-[var(--color-border)] hover:bg-transparent">
                <TableHead className="pl-4 text-xs opacity-60 sm:text-sm">
                  Date
                </TableHead>
                <TableHead className="text-xs opacity-60 sm:text-sm">
                  Type
                </TableHead>
                <TableHead className="text-xs opacity-60 sm:text-sm">
                  Description
                </TableHead>
                <TableHead className="hidden text-xs opacity-60 sm:table-cell sm:text-sm">
                  Wallet
                </TableHead>
                <TableHead className="pr-4 text-right text-xs opacity-60 sm:text-sm">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((tx) => {
                const config = typeConfig[tx.type];
                const Icon = config.icon;
                const currency = transactionCurrency(tx);

                return (
                  <TableRow
                    key={tx.id}
                    className="border-[var(--color-border)] hover:bg-[var(--color-accent-surface)]"
                  >
                    <TableCell className="pl-4 font-data text-xs tabular-nums sm:text-sm">
                      {new Date(tx.date).toLocaleDateString()}
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
                    <TableCell className="max-w-[10rem] truncate sm:max-w-none">
                      {tx.note || config.label}
                    </TableCell>
                    <TableCell className="hidden max-w-[12rem] truncate opacity-70 sm:table-cell">
                      {walletLabel(tx)}
                    </TableCell>
                    <TableCell
                      className="pr-4 text-right font-data text-xs font-medium tabular-nums sm:text-sm"
                      style={{ color: config.color }}
                    >
                      {tx.type === "expense"
                        ? "-"
                        : tx.type === "income"
                          ? "+"
                          : ""}
                      {formatMoney(tx.amount, currency)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        <TablePagination
          totalItems={filteredTransactions.length}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </HoloCard>

      {hasActiveFilters && filteredTransactions.length > 0 && (
        <p className="text-xs opacity-50 sm:text-sm">
          {filteredTransactions.length} of {transactions.length} transactions
          match your filters
        </p>
      )}
    </div>
  );
}
