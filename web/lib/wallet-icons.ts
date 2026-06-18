import {
  BadgeDollarSign,
  Banknote,
  Building2,
  CircleDollarSign,
  Coins,
  CreditCard,
  Landmark,
  PiggyBank,
  Wallet,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

export const WALLET_ICON_IDS = [
  "wallet",
  "piggy-bank",
  "credit-card",
  "banknote",
  "landmark",
  "coins",
  "circle-dollar-sign",
  "building-2",
  "wallet-cards",
  "badge-dollar-sign",
] as const;

export type WalletIconId = (typeof WALLET_ICON_IDS)[number];

const ICON_MAP: Record<WalletIconId, LucideIcon> = {
  wallet: Wallet,
  "piggy-bank": PiggyBank,
  "credit-card": CreditCard,
  banknote: Banknote,
  landmark: Landmark,
  coins: Coins,
  "circle-dollar-sign": CircleDollarSign,
  "building-2": Building2,
  "wallet-cards": WalletCards,
  "badge-dollar-sign": BadgeDollarSign,
};

export function isWalletIconId(value: string): value is WalletIconId {
  return (WALLET_ICON_IDS as readonly string[]).includes(value);
}

export function getWalletIconComponent(iconId: string): LucideIcon {
  if (isWalletIconId(iconId)) {
    return ICON_MAP[iconId];
  }
  return Wallet;
}

export const DEFAULT_WALLET_ICON: WalletIconId = "wallet";
