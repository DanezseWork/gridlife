"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CurrencyPicker } from "@/components/currency-picker";
import { CollapsibleIconPicker } from "@/components/collapsible-icon-picker";
import { HABIT_COLORS } from "@/lib/habit-colors";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  resolveCurrency,
  type CurrencyCode,
} from "@/lib/currencies";
import type { Wallet } from "@/lib/api";
import {
  DEFAULT_WALLET_ICON,
  getWalletIconComponent,
  WALLET_ICON_IDS,
  isWalletIconId,
  type WalletIconId,
} from "@/lib/wallet-icons";
import { cn } from "@/lib/utils";

export interface WalletForm {
  name: string;
  color: string;
  icon: WalletIconId;
  currency: CurrencyCode;
  initialAmount: string;
}

interface WalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wallet?: Wallet | null;
  onCreate?: (data: {
    name: string;
    color: string;
    icon: string;
    currency: string;
    initialAmount?: number;
  }) => Promise<void>;
  onUpdate?: (
    walletId: string,
    data: {
      name: string;
      color: string;
      icon: string;
      currency: string;
    },
  ) => Promise<void>;
  onDelete?: (walletId: string) => Promise<void>;
  defaultColor: string;
}

const DEFAULT_FORM: WalletForm = {
  name: "",
  color: HABIT_COLORS[0],
  icon: DEFAULT_WALLET_ICON,
  currency: DEFAULT_CURRENCY,
  initialAmount: "",
};

export function WalletDialog({
  open,
  onOpenChange,
  wallet,
  onCreate,
  onUpdate,
  onDelete,
  defaultColor,
}: WalletDialogProps) {
  const isEditing = wallet != null;
  const [form, setForm] = useState<WalletForm>({
    ...DEFAULT_FORM,
    color: defaultColor,
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) {
      setConfirmDelete(false);
      return;
    }
    if (wallet) {
      setForm({
        name: wallet.name,
        color: wallet.color,
        icon: isWalletIconId(wallet.icon) ? wallet.icon : DEFAULT_WALLET_ICON,
        currency: resolveCurrency(wallet.currency),
        initialAmount: "",
      });
    } else {
      setForm({
        ...DEFAULT_FORM,
        color: defaultColor,
      });
    }
  }, [open, defaultColor, wallet]);

  async function handleSubmit() {
    if (!form.name.trim() || submitting || deleting) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        color: form.color,
        icon: form.icon,
        currency: form.currency,
      };
      if (isEditing && onUpdate && wallet) {
        await onUpdate(wallet.id, payload);
      } else if (onCreate) {
        const initialAmount = form.initialAmount.trim()
          ? parseFloat(form.initialAmount)
          : undefined;
        await onCreate({
          ...payload,
          initialAmount:
            initialAmount != null &&
            !Number.isNaN(initialAmount) &&
            initialAmount !== 0
              ? initialAmount
              : undefined,
        });
      }
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!isEditing || !onDelete || !wallet || deleting || submitting) return;
    setDeleting(true);
    try {
      await onDelete(wallet.id);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  }

  const PreviewIcon = getWalletIconComponent(form.icon);
  const previewBalance = isEditing
    ? wallet?.balance ?? "0"
    : form.initialAmount.trim() || "0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-md"
        style={{
          background: "var(--color-base)",
          color: "var(--color-inverse)",
          borderColor: "var(--color-border)",
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit wallet" : "New wallet"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div
            className="flex items-center gap-3 rounded-xl p-3"
            style={{
              background:
                "color-mix(in srgb, var(--color-inverse) 8%, var(--color-base))",
              border:
                "1px solid color-mix(in srgb, var(--color-inverse) 10%, transparent)",
            }}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: `color-mix(in srgb, ${form.color} 18%, var(--color-base))`,
              }}
            >
              <PreviewIcon className="h-5 w-5" style={{ color: form.color }} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">
                {form.name.trim() || "Wallet name"}
              </p>
              <p className="font-data text-sm opacity-70">
                {formatMoney(previewBalance, form.currency)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wallet-name">Name</Label>
            <Input
              id="wallet-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Emergency fund"
              className="min-h-11 border-[var(--color-border)] bg-transparent sm:min-h-12"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSubmit();
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Currency</Label>
            <CurrencyPicker
              value={form.currency}
              onChange={(currency) => setForm((f) => ({ ...f, currency }))}
              disabled={submitting || deleting}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Select color ${color}`}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  className={cn(
                    "h-9 w-9 rounded-full transition-transform active:scale-95",
                    form.color === color &&
                      "ring-2 ring-offset-2 ring-offset-[var(--color-base)]",
                  )}
                  style={{
                    background: color,
                    ...(form.color === color
                      ? { boxShadow: `0 0 0 2px ${color}` }
                      : {}),
                  }}
                />
              ))}
            </div>
          </div>

          <CollapsibleIconPicker
            iconIds={WALLET_ICON_IDS}
            selectedIcon={form.icon}
            onSelect={(icon) => setForm((f) => ({ ...f, icon: icon as WalletIconId }))}
            getIconComponent={getWalletIconComponent}
            accentColor={form.color}
            columns={5}
            resetKey={open ? wallet?.id ?? "new" : undefined}
          />

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="wallet-initial">
                Initial amount (optional, negative for debt)
              </Label>
              <Input
                id="wallet-initial"
                type="number"
                step="0.01"
                value={form.initialAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, initialAmount: e.target.value }))
                }
                placeholder="0.00 or -500.00"
                className="font-data min-h-11 border-[var(--color-border)] bg-transparent sm:min-h-12"
              />
            </div>
          )}

          <Button
            onClick={() => void handleSubmit()}
            disabled={!form.name.trim() || submitting || deleting}
            variant="accent"
            className="w-full min-h-11 sm:min-h-12"
          >
            {submitting
              ? isEditing
                ? "Saving…"
                : "Creating…"
              : isEditing
                ? "Save changes"
                : "Create wallet"}
          </Button>

          {isEditing && onDelete && (
            <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
              {confirmDelete ? (
                <div className="space-y-3">
                  <p className="text-center text-sm opacity-60">
                    Delete &ldquo;{wallet.name}&rdquo;? This can&apos;t be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => setConfirmDelete(false)}
                      className="min-h-11 flex-1 rounded-lg border text-sm opacity-70 transition-colors hover:opacity-100"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => void handleDelete()}
                      className="min-h-11 flex-1 rounded-lg bg-[#ff3366] text-sm font-medium text-white transition-opacity disabled:opacity-50"
                    >
                      {deleting ? "Deleting…" : "Delete wallet"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={submitting || deleting}
                  onClick={() => setConfirmDelete(true)}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border text-sm text-[#ff3366] transition-colors hover:bg-[#ff3366]/10"
                  style={{ borderColor: "color-mix(in srgb, #ff3366 40%, transparent)" }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete wallet
                </button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
