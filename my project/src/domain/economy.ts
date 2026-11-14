export type PaymentMethod = 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK_TRANSFER';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type CurrencyBucket = 'PURCHASED_COINS' | 'PRACTICE_POINTS';

export interface WalletBalance {
  purchasedCoins: number;
  practicePoints: number;
}

export interface CoinPackage {
  id: string;
  nameEn: string;
  nameBn: string;
  coinAmount: number;
  priceBdt: number;
  isMembership: boolean;
  membershipDays?: number;
  active: boolean;
}

export interface PaymentSubmission {
  id: string;
  userId: string;
  packageId: string;
  method: PaymentMethod;
  transactionId: string;
  senderLastFour: string;
  amountBdt: number;
  status: PaymentStatus;
  reviewedByAdminId?: string;
  reviewNote?: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  bucket: CurrencyBucket;
  delta: number;
  reason:
    | 'PACKAGE_PURCHASE'
    | 'DAILY_REWARD'
    | 'REFERRAL_REWARD'
    | 'TASK_REWARD'
    | 'ITEM_PURCHASE'
    | 'MATCH_ENTRY_PRACTICE'
    | 'MATCH_WIN_PRACTICE'
    | 'ADMIN_ADJUSTMENT';
  referenceId: string;
  createdAtMs: number;
}

export interface StoreItem {
  id: string;
  nameEn: string;
  nameBn: string;
  gameId: string;
  priceBucket: CurrencyBucket;
  priceAmount: number;
}

export class EconomyPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EconomyPolicyError';
  }
}

export function assertNoCashOutOrTransfer(operation: string): never {
  throw new EconomyPolicyError(
    `Operation "${operation}" is permanently disabled: FUN OFFLINE prohibits cash-out, withdrawals, and user-to-user coin transfers.`
  );
}

export function assertNoPurchasedCoinWagering(bucket: CurrencyBucket): void {
  if (bucket === 'PURCHASED_COINS') {
    throw new EconomyPolicyError(
      'Purchased Coins cannot be used for wagering. Friendly 1v1 matches use non-purchasable Practice Points only.'
    );
  }
}

export function validateTransactionId(method: PaymentMethod, txId: string): boolean {
  const trimmed = txId.trim();
  if (trimmed.length < 6 || trimmed.length > 40) return false;
  if (!/^[A-Za-z0-9\-_]+$/.test(trimmed)) return false;
  if (method === 'BKASH' || method === 'NAGAD' || method === 'ROCKET') {
    return trimmed.length >= 8;
  }
  return true;
}

export function applyLedgerMutation(
  wallet: WalletBalance,
  bucket: CurrencyBucket,
  delta: number
): WalletBalance {
  if (!Number.isInteger(delta)) {
    throw new EconomyPolicyError('Ledger delta must be an integer.');
  }
  const current =
    bucket === 'PURCHASED_COINS' ? wallet.purchasedCoins : wallet.practicePoints;
  const next = current + delta;
  if (next < 0) {
    throw new EconomyPolicyError(
      `Insufficient ${bucket === 'PURCHASED_COINS' ? 'Purchased Coins' : 'Practice Points'}.`
    );
  }
  return bucket === 'PURCHASED_COINS'
    ? { ...wallet, purchasedCoins: next }
    : { ...wallet, practicePoints: next };
}

export function reviewPaymentSubmission(
  submission: PaymentSubmission,
  decision: 'APPROVED' | 'REJECTED',
  adminId: string,
  pkg: CoinPackage,
  wallet: WalletBalance,
  nowMs: number,
  note?: string
): { submission: PaymentSubmission; wallet: WalletBalance; ledgerEntry?: LedgerEntry } {
  if (submission.status !== 'PENDING') {
    throw new EconomyPolicyError(
      `Cannot review submission ${submission.id}: already in terminal state ${submission.status}.`
    );
  }
  if (!adminId.trim()) {
    throw new EconomyPolicyError('Server-verified adminId is required.');
  }
  const updatedSubmission: PaymentSubmission = {
    ...submission,
    status: decision,
    reviewedByAdminId: adminId,
    reviewNote: note?.trim() || undefined,
    updatedAtMs: nowMs,
  };
  if (decision === 'REJECTED') {
    return { submission: updatedSubmission, wallet };
  }
  const nextWallet = pkg.coinAmount > 0
    ? applyLedgerMutation(wallet, 'PURCHASED_COINS', pkg.coinAmount)
    : wallet;

  const ledgerEntry: LedgerEntry | undefined =
    pkg.coinAmount > 0
      ? {
          id: `led_${submission.id}`,
          userId: submission.userId,
          bucket: 'PURCHASED_COINS',
          delta: pkg.coinAmount,
          reason: 'PACKAGE_PURCHASE',
          referenceId: submission.id,
          createdAtMs: nowMs,
        }
      : undefined;

  return { submission: updatedSubmission, wallet: nextWallet, ledgerEntry };
}

export function purchaseInventoryItem(
  wallet: WalletBalance,
  ownedItemIds: ReadonlySet<string>,
  item: StoreItem
): { wallet: WalletBalance; ownedItemIds: Set<string> } {
  if (ownedItemIds.has(item.id)) {
    throw new EconomyPolicyError(`Item ${item.id} is already owned.`);
  }
  if (item.priceAmount <= 0) {
    throw new EconomyPolicyError('Item price must be positive.');
  }
  const nextWallet = applyLedgerMutation(wallet, item.priceBucket, -item.priceAmount);
  const nextOwned = new Set(ownedItemIds);
  nextOwned.add(item.id);
  return { wallet: nextWallet, ownedItemIds: nextOwned };
}
