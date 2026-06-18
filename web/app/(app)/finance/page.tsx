"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { NetworkChart } from "@/components/network-chart";
import { NetworkPredictionChart } from "@/components/network-prediction-chart";
import { NetworkTotals } from "@/components/network-totals";
import { PlannedQueueTable } from "@/components/planned-queue-table";
import { ScheduleFields } from "@/components/schedule-fields";
import { TransactionsTable } from "@/components/transactions-table";
import { HoloCard } from "@/components/holo-card";
import { PageContainer } from "@/components/page-container";
import { ScanlineSkeleton } from "@/components/scanline-skeleton";
import { WalletDialog } from "@/components/wallet-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, type PlannedQueueItem, type Transaction, type Wallet } from "@/lib/api";
import { formatMoney, resolveCurrency } from "@/lib/currencies";
import { getTodayKey, getTomorrowKey, parseDateKey } from "@/lib/dates";
import { nextHabitColor } from "@/lib/habit-colors";
import { getWalletIconComponent } from "@/lib/wallet-icons";
import { cn } from "@/lib/utils";

function formatTodayLabel(): string {
  const date = parseDateKey(getTodayKey());
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function WalletGrid({
  wallets,
  onAddWallet,
  onEditWallet,
}: {
  wallets: Wallet[];
  onAddWallet: () => void;
  onEditWallet: (wallet: Wallet) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-1 xl:grid-cols-2">
      {wallets.map((wallet) => {
        const Icon = getWalletIconComponent(wallet.icon);
        const walletCurrency = resolveCurrency(wallet.currency);
        return (
          <button
            key={wallet.id}
            type="button"
            onClick={() => onEditWallet(wallet)}
            className="group text-left transition-transform active:scale-[0.99]"
          >
            <HoloCard
              className="wallet-hud-border min-h-[120px] min-w-0 transition-shadow group-hover:shadow-[0_0_16px_var(--color-accent-glow)]"
              style={{ "--wallet-color": wallet.color } as React.CSSProperties}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: `color-mix(in srgb, ${wallet.color} 18%, var(--color-base))`,
                    }}
                  >
                    <Icon className="h-4 w-4" style={{ color: wallet.color }} />
                  </div>
                  <span className="min-w-0 break-words text-sm leading-snug opacity-70 sm:text-base">
                    {wallet.name}
                  </span>
                </div>
                <p
                  className="font-data text-xl font-bold tabular-nums sm:text-2xl"
                  style={{ color: wallet.color }}
                >
                  {formatMoney(wallet.balance, walletCurrency)}
                </p>
                <p className="text-xs opacity-50 sm:text-sm">{walletCurrency}</p>
              </div>
            </HoloCard>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAddWallet}
        className="btn-accent-outline group flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-lg transition-all hover:shadow-[0_0_16px_var(--color-accent-glow)] sm:min-h-[140px]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-surface)] transition-transform group-hover:scale-105">
          <Plus className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <span className="text-sm font-medium sm:text-base">Add Wallet</span>
      </button>
    </div>
  );
}

export default function FinancePage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plannedQueue, setPlannedQueue] = useState<PlannedQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [txDialogOpen, setTxDialogOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  const [txTiming, setTxTiming] = useState<"now" | "scheduled" | "recurring">("now");
  const [txType, setTxType] = useState<"income" | "expense" | "transfer">("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getTodayKey());
  const [scheduledDate, setScheduledDate] = useState(getTomorrowKey());
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [weeklyDays, setWeeklyDays] = useState<number[]>([1]);
  const [monthlyDays, setMonthlyDays] = useState<number[]>([1]);
  const [yearlyDays, setYearlyDays] = useState<Array<{ month: number; day: number }>>([
    { month: 1, day: 1 },
  ]);
  const [recurringStartDate, setRecurringStartDate] = useState(getTodayKey());
  const [recurringEndDate, setRecurringEndDate] = useState("");
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [overdraftConfirmOpen, setOverdraftConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [w, t, queue] = await Promise.all([
        api.getWallets(),
        api.getTransactions(),
        api.getPlannedQueue(),
      ]);
      setWallets(w);
      setTransactions(t);
      setPlannedQueue(queue);
      setEditingWallet((current) =>
        current ? w.find((wallet) => wallet.id === current.id) ?? null : null,
      );
      if (w.length > 0 && !fromWalletId) setFromWalletId(w[0].id);
      if (w.length > 1 && !toWalletId) setToWalletId(w[1].id);
    } finally {
      setLoading(false);
    }
  }, [fromWalletId, toWalletId]);

  const fromWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === fromWalletId),
    [wallets, fromWalletId],
  );
  const toWallet = useMemo(
    () => wallets.find((wallet) => wallet.id === toWalletId),
    [wallets, toWalletId],
  );
  const fromCurrency = resolveCurrency(fromWallet?.currency);
  const toCurrency = resolveCurrency(toWallet?.currency);
  const txCurrency =
    txType === "expense"
      ? fromCurrency
      : txType === "income"
        ? toCurrency
        : fromCurrency;
  const transferTargets = useMemo(
    () =>
      wallets.filter(
        (wallet) =>
          wallet.id !== fromWalletId &&
          resolveCurrency(wallet.currency) === fromCurrency,
      ),
    [wallets, fromWalletId, fromCurrency],
  );
  const effectiveToWalletId = useMemo(() => {
    if (txType !== "transfer") return toWalletId;
    if (transferTargets.length === 0) return "";
    return transferTargets.some((wallet) => wallet.id === toWalletId)
      ? toWalletId
      : transferTargets[0].id;
  }, [txType, toWalletId, transferTargets]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateTransaction() {
    setSubmitting(true);
    try {
      if (txTiming === "now") {
        await api.createTransaction({
          type: txType,
          amount: parseFloat(amount),
          date,
          note: note || undefined,
          fromWalletId:
            txType === "expense" || txType === "transfer" ? fromWalletId : undefined,
          toWalletId:
            txType === "income"
              ? toWalletId
              : txType === "transfer"
                ? effectiveToWalletId
                : undefined,
        });
      } else {
        await api.createPlannedTransaction({
          type: txType,
          amount: parseFloat(amount),
          note: note || undefined,
          fromWalletId:
            txType === "expense" || txType === "transfer" ? fromWalletId : undefined,
          toWalletId:
            txType === "income"
              ? toWalletId
              : txType === "transfer"
                ? effectiveToWalletId
                : undefined,
          kind: txTiming === "scheduled" ? "scheduled" : "recurring",
          scheduledDate: txTiming === "scheduled" ? scheduledDate : undefined,
          frequency: txTiming === "recurring" ? frequency : undefined,
          weeklyDays: txTiming === "recurring" && frequency === "weekly" ? weeklyDays : undefined,
          monthlyDays:
            txTiming === "recurring" && frequency === "monthly" ? monthlyDays : undefined,
          yearlyDays:
            txTiming === "recurring" && frequency === "yearly" ? yearlyDays : undefined,
          startDate: txTiming === "recurring" ? recurringStartDate : undefined,
          endDate: txTiming === "recurring" && recurringEndDate ? recurringEndDate : undefined,
        });
      }
      setAmount("");
      setNote("");
      setOverdraftConfirmOpen(false);
      setTxDialogOpen(false);
      await loadData();
    } finally {
      setSubmitting(false);
    }
  }

  function handleCreateClick() {
    if (txTiming === "now" && expenseExceedsBalance) {
      setOverdraftConfirmOpen(true);
      return;
    }
    void handleCreateTransaction();
  }

  async function handleDeactivatePlanned(plannedTransactionId: string) {
    await api.updatePlannedTransaction(plannedTransactionId, { active: false });
    await loadData();
  }

  async function handleCreateWallet(data: {
    name: string;
    color: string;
    icon: string;
    currency: string;
    initialAmount?: number;
  }) {
    await api.createWallet(data);
    await loadData();
  }

  async function handleUpdateWallet(
    walletId: string,
    data: {
      name: string;
      color: string;
      icon: string;
      currency: string;
    },
  ) {
    await api.updateWallet(walletId, data);
    await loadData();
  }

  async function handleDeleteWallet(walletId: string) {
    await api.deleteWallet(walletId);
    setEditingWallet(null);
    await loadData();
  }

  const today = getTodayKey();
  const tomorrow = getTomorrowKey();
  const parsedAmount = parseFloat(amount);
  const isFutureDate = txTiming === "now" && date > today;
  const invalidScheduledDate =
    txTiming === "scheduled" && scheduledDate <= today;
  const invalidRecurringSchedule =
    txTiming === "recurring" &&
    ((frequency === "weekly" && weeklyDays.length === 0) ||
      (frequency === "monthly" && monthlyDays.length === 0) ||
      (frequency === "yearly" && yearlyDays.length === 0));
  const expenseExceedsBalance =
    txTiming === "now" &&
    txType === "expense" &&
    fromWallet != null &&
    !Number.isNaN(parsedAmount) &&
    parsedAmount > Number(fromWallet.balance);
  const projectedBalance =
    fromWallet != null && !Number.isNaN(parsedAmount)
      ? Number(fromWallet.balance) - parsedAmount
      : 0;

  const canCreateTransaction =
    Boolean(amount) &&
    !Number.isNaN(parsedAmount) &&
    parsedAmount >= 0.01 &&
    !isFutureDate &&
    !invalidScheduledDate &&
    !invalidRecurringSchedule &&
    !submitting &&
    !(txType === "transfer" && (transferTargets.length === 0 || !effectiveToWalletId));

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <header className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
          <div className="w-10" aria-hidden />

          <div className="min-w-0 flex-1 text-center">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              <span style={{ color: "var(--color-inverse)" }}>Fin</span>
              <span style={{ color: "var(--color-accent)" }}>ance</span>
            </h1>
            <p className="mt-0.5 text-xs opacity-50 sm:text-sm">
              {formatTodayLabel()}
            </p>
          </div>

          <button
            type="button"
            aria-label="Add transaction"
            onClick={() => setTxDialogOpen(true)}
            className="btn-accent flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-95"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </header>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ScanlineSkeleton className="h-28" />
              <ScanlineSkeleton className="h-28" />
            </div>
            <ScanlineSkeleton className="h-16" />
            <ScanlineSkeleton className="h-16" />
          </div>
        ) : (
          <>
            <div className="mb-8 space-y-8">
              <NetworkTotals wallets={wallets} />
              <NetworkChart wallets={wallets} transactions={transactions} />
              <NetworkPredictionChart
                wallets={wallets}
                refreshKey={plannedQueue.length}
              />
            </div>
            <div className="space-y-8">
              <section>
                <h2 className="mb-3 text-sm font-medium opacity-60 sm:text-base">
                  Wallets
                </h2>
                <WalletGrid
                  wallets={wallets}
                  onAddWallet={() => {
                    setEditingWallet(null);
                    setWalletDialogOpen(true);
                  }}
                  onEditWallet={setEditingWallet}
                />
              </section>

              <PlannedQueueTable
                queue={plannedQueue}
                wallets={wallets}
                onDeactivate={handleDeactivatePlanned}
              />

              <section className="space-y-3">
                <h2 className="text-sm font-medium opacity-60 sm:text-base">
                  Transactions
                </h2>
                <TransactionsTable transactions={transactions} wallets={wallets} />
              </section>
            </div>
          </>
        )}

        <Dialog
          open={txDialogOpen}
          onOpenChange={(open) => {
            setTxDialogOpen(open);
            if (!open) setOverdraftConfirmOpen(false);
          }}
        >
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md lg:max-w-lg">
            <DialogHeader>
              <DialogTitle>New transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { value: "now", label: "Now" },
                    { value: "scheduled", label: "Scheduled" },
                    { value: "recurring", label: "Recurring" },
                  ] as const
                ).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTxTiming(value)}
                    className={cn(
                      "min-h-11 flex-1 rounded-md border px-2 py-2 text-xs transition-colors sm:min-w-24 sm:text-sm",
                      txTiming === value
                        ? "chip-active"
                        : "border-[var(--color-border)] opacity-70 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                {(["expense", "income", "transfer"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTxType(t)}
                    className={cn(
                      "min-h-11 flex-1 rounded-md border px-2 py-2 text-xs capitalize transition-colors sm:text-sm",
                      txType === t
                        ? "chip-active"
                        : "border-[var(--color-border)] opacity-70 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Amount ({txCurrency})</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="font-data min-h-11 sm:min-h-12"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {(txType === "expense" || txType === "transfer") && (
                  <div className="space-y-2 sm:col-span-1">
                    <Label>From wallet</Label>
                    <select
                      value={fromWalletId}
                      onChange={(e) => setFromWalletId(e.target.value)}
                      className="w-full min-h-11 rounded-md border bg-transparent px-3 text-sm sm:min-h-12"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({resolveCurrency(w.currency)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(txType === "income" || txType === "transfer") && (
                  <div className="space-y-2 sm:col-span-1">
                    <Label>To wallet</Label>
                    <select
                      value={txType === "transfer" ? effectiveToWalletId : toWalletId}
                      onChange={(e) => setToWalletId(e.target.value)}
                      disabled={txType === "transfer" && transferTargets.length === 0}
                      className="w-full min-h-11 rounded-md border bg-transparent px-3 text-sm disabled:opacity-50 sm:min-h-12"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      {(txType === "transfer" ? transferTargets : wallets).map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({resolveCurrency(w.currency)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {txType === "transfer" && transferTargets.length === 0 && (
                <p className="text-xs text-[#ff3366]">
                  No other wallets share {fromCurrency}. Add another {fromCurrency}{" "}
                  wallet to transfer.
                </p>
              )}

              {txType === "expense" && txTiming === "now" && expenseExceedsBalance && (
                <p className="text-xs text-[#ff3366]">
                  This expense exceeds the wallet balance. You&apos;ll be asked to
                  confirm before creating it.
                </p>
              )}

              {txTiming === "now" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={date}
                      max={today}
                      onChange={(e) => setDate(e.target.value)}
                      className="min-h-11 sm:min-h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Note (optional)</Label>
                    <Input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="min-h-11 sm:min-h-12"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <ScheduleFields
                    timing={txTiming}
                    scheduledDate={scheduledDate}
                    onScheduledDateChange={setScheduledDate}
                    minScheduledDate={tomorrow}
                    frequency={frequency}
                    onFrequencyChange={setFrequency}
                    weeklyDays={weeklyDays}
                    onWeeklyDaysChange={setWeeklyDays}
                    monthlyDays={monthlyDays}
                    onMonthlyDaysChange={setMonthlyDays}
                    yearlyDays={yearlyDays}
                    onYearlyDaysChange={setYearlyDays}
                    startDate={recurringStartDate}
                    onStartDateChange={setRecurringStartDate}
                    endDate={recurringEndDate}
                    onEndDateChange={setRecurringEndDate}
                  />
                  <div className="space-y-2">
                    <Label>Note (optional)</Label>
                    <Input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="min-h-11 sm:min-h-12"
                    />
                  </div>
                </>
              )}

              {isFutureDate && (
                <p className="text-xs text-[#ff3366]">
                  Immediate transactions cannot be dated in the future.
                </p>
              )}

              {invalidScheduledDate && (
                <p className="text-xs text-[#ff3366]">
                  Scheduled transactions must use a future date.
                </p>
              )}

              {invalidRecurringSchedule && (
                <p className="text-xs text-[#ff3366]">
                  Select at least one day or date for this recurring plan.
                </p>
              )}

              <Button
                onClick={handleCreateClick}
                disabled={!canCreateTransaction}
                variant="accent"
                className="w-full min-h-11 sm:min-h-12"
              >
                {submitting
                  ? "Creating…"
                  : txTiming === "now"
                    ? "Create"
                    : txTiming === "scheduled"
                      ? "Schedule"
                      : "Set recurring"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={overdraftConfirmOpen} onOpenChange={setOverdraftConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm overdraft expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm opacity-70">
                This expense will put{" "}
                <span className="font-medium text-[var(--color-text)]">
                  {fromWallet?.name}
                </span>{" "}
                into a negative balance.
              </p>
              <div className="space-y-2 rounded-lg border border-[var(--color-border)] p-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="opacity-60">Current balance</span>
                  <span className="font-data tabular-nums">
                    {formatMoney(fromWallet?.balance ?? "0", fromCurrency)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="opacity-60">Expense</span>
                  <span className="font-data tabular-nums text-[#ff3366]">
                    −{formatMoney(parsedAmount, fromCurrency)}
                  </span>
                </div>
                <div className="flex justify-between gap-4 border-t border-[var(--color-border)] pt-2">
                  <span className="opacity-60">New balance</span>
                  <span className="font-data tabular-nums text-[#ff3366]">
                    {formatMoney(projectedBalance, fromCurrency)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={() => setOverdraftConfirmOpen(false)}
                  className="min-h-11 flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="accent"
                  disabled={submitting}
                  onClick={() => void handleCreateTransaction()}
                  className="min-h-11 flex-1"
                >
                  {submitting ? "Creating…" : "Confirm expense"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <WalletDialog
          open={walletDialogOpen || editingWallet !== null}
          onOpenChange={(open) => {
            if (!open) {
              setWalletDialogOpen(false);
              setEditingWallet(null);
            }
          }}
          wallet={editingWallet}
          onCreate={handleCreateWallet}
          onUpdate={handleUpdateWallet}
          onDelete={handleDeleteWallet}
          defaultColor={nextHabitColor(wallets.length)}
        />
      </motion.div>
    </PageContainer>
  );
}
