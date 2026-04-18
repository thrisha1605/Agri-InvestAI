import { WalletState, WalletTransaction, User } from '@/types';
import { apiRequest } from './api';
import { storage } from './storage';
import { userService } from './users';

const TXN_KEY_PREFIX = 'agriinvest_wallet_txns_';
const WALLET_KEY_PREFIX = 'agriinvest_wallet_';

export type WithdrawalMethod =
  | 'BANK_ACCOUNT'
  | 'UPI'
  | 'GPAY'
  | 'PAYTM'
  | 'PHONEPE'
  | 'OTHER_WALLET';

export interface WithdrawalDestination {
  method: WithdrawalMethod;
  label: string;
  destination: string;
  accountName?: string;
  accountNumber?: string;
  ifsc?: string;
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function walletKey(userId: string) {
  return `${WALLET_KEY_PREFIX}${userId}`;
}

function transactionKey(userId: string) {
  return `${TXN_KEY_PREFIX}${userId}`;
}

export function normalizeWalletState(payload: any): WalletState {
  const principal = Number(payload?.principal || 0);
  const profits = Number(payload?.profits || 0);
  const refunds = Number(payload?.refunds || 0);
  const sip = Number(payload?.sip || 0);
  const balance =
    payload?.balance !== undefined
      ? Number(payload.balance || 0)
      : principal + profits + refunds + sip;

  return {
    balance,
    principal,
    profits,
    refunds,
    sip,
  };
}

function normalizeWalletTransaction(payload: any): WalletTransaction {
  return {
    id: String(payload?.id || makeId('txn')),
    userId: String(payload?.userId || ''),
    type: String(payload?.type || 'ADD_MONEY') as WalletTransaction['type'],
    amount: Number(payload?.amount || 0),
    status: String(payload?.status || 'COMPLETED') as WalletTransaction['status'],
    note: payload?.note ? String(payload.note) : payload?.description ? String(payload.description) : '',
    refId: payload?.refId ? String(payload.refId) : payload?.referenceId ? String(payload.referenceId) : '',
    createdAt: String(payload?.createdAt || nowIso()),
    meta: payload?.meta || undefined,
  };
}

export function getWallet(userId: string): WalletState {
  return storage.getJSON<WalletState>(walletKey(userId), { balance: 0, principal: 0, profits: 0, refunds: 0, sip: 0 });
}

export function setWallet(userId: string, wallet: WalletState) {
  storage.setJSON(walletKey(userId), wallet);
}

export function listWalletTxns(userId: string): WalletTransaction[] {
  return storage.getJSON<WalletTransaction[]>(transactionKey(userId), []).map(normalizeWalletTransaction);
}

export function setWalletTransactions(userId: string, transactions: WalletTransaction[]) {
  storage.setJSON(transactionKey(userId), transactions.map(normalizeWalletTransaction));
}

export function addWalletTxn(userId: string, txn: Omit<WalletTransaction, 'id' | 'userId' | 'createdAt'>): WalletTransaction {
  const full: WalletTransaction = {
    id: makeId('txn'),
    userId,
    createdAt: nowIso(),
    ...txn,
  };
  const existing = listWalletTxns(userId);
  storage.setJSON(transactionKey(userId), [full, ...existing]);
  return full;
}

function syncUserWalletBalance(userOrId: User | string, wallet: WalletState) {
  const user = typeof userOrId === 'string' ? userService.getById(userOrId) : userOrId;
  if (!user) {
    return;
  }

  const nextUser: User = {
    ...user,
    walletBalance: wallet.balance,
    wallet,
  };

  userService.updateUser(nextUser);
}

export function syncWalletCache(userOrId: User | string, wallet: WalletState, transactions?: WalletTransaction[]) {
  const userId = typeof userOrId === 'string' ? userOrId : userOrId.id;
  setWallet(userId, wallet);
  if (transactions) {
    setWalletTransactions(userId, transactions);
  }
  syncUserWalletBalance(userOrId, wallet);
}

export async function fetchWalletFromBackend(user: User): Promise<WalletState> {
  const response = await apiRequest<any>({
    method: 'GET',
    url: '/api/wallet',
  });

  const wallet = normalizeWalletState(response);
  syncWalletCache(user, wallet);
  return wallet;
}

export async function fetchWalletTransactionsFromBackend(userId: string): Promise<WalletTransaction[]> {
  const response = await apiRequest<any[]>({
    method: 'GET',
    url: '/api/wallet/transactions',
  });

  const transactions = (response || []).map(normalizeWalletTransaction);
  setWalletTransactions(userId, transactions);
  return transactions;
}

export async function syncWalletFromBackend(user: User): Promise<{
  wallet: WalletState;
  transactions: WalletTransaction[];
}> {
  const [wallet, transactions] = await Promise.all([
    fetchWalletFromBackend(user),
    fetchWalletTransactionsFromBackend(user.id),
  ]);

  syncWalletCache(user, wallet, transactions);
  return { wallet, transactions };
}

export async function addMoneyToBackend(user: User, amount: number) {
  if (amount <= 0) {
    throw new Error('Enter a valid amount to add to the wallet.');
  }

  await apiRequest({
    method: 'POST',
    url: '/api/wallet/add-money/confirm',
    data: { amount },
  });

  return syncWalletFromBackend(user);
}

export async function requestWithdrawalFromBackend(user: User, amount: number, payout: WithdrawalDestination) {
  if (amount <= 0) {
    throw new Error('Enter a valid withdrawal amount.');
  }

  await apiRequest({
    method: 'POST',
    url: '/api/wallet/withdraw',
    data: {
      amount,
      payoutMethod: payout.method,
      payoutDestination: payout.method === 'BANK_ACCOUNT' ? payout.accountNumber || '' : payout.destination,
      holderName: payout.accountName || '',
      accountNumber: payout.accountNumber || '',
      ifsc: payout.ifsc || '',
    },
  });

  return syncWalletFromBackend(user);
}

export const walletService = {
  addMoney(user: User, amount: number, note?: string, refId?: string) {
    const wallet = getWallet(user.id);
    wallet.balance += amount;
    wallet.principal += amount;
    setWallet(user.id, wallet);
    addWalletTxn(user.id, { type: 'ADD_MONEY', amount, status: 'COMPLETED', note, refId });
    syncUserWalletBalance(user, wallet);
    return wallet;
  },

  debitForInvestment(user: User, amount: number, investmentId: string, note?: string) {
    const wallet = getWallet(user.id);
    wallet.balance -= amount;
    setWallet(user.id, wallet);
    addWalletTxn(user.id, { type: 'INVESTMENT', amount: -Math.abs(amount), status: 'COMPLETED', note, refId: investmentId });
    syncUserWalletBalance(user, wallet);
    return wallet;
  },

  creditProfit(user: User, amount: number, settlementId: string) {
    const wallet = getWallet(user.id);
    wallet.balance += amount;
    wallet.profits += amount;
    setWallet(user.id, wallet);
    addWalletTxn(user.id, { type: 'PROFIT_CREDIT', amount: Math.abs(amount), status: 'COMPLETED', refId: settlementId });
    syncUserWalletBalance(user, wallet);
    return wallet;
  },

  creditSalary(user: User, amount: number, payoutRef: string) {
    const wallet = getWallet(user.id);
    wallet.balance += amount;
    wallet.profits += amount;
    setWallet(user.id, wallet);
    addWalletTxn(user.id, {
      type: 'SALARY_CREDIT',
      amount: Math.abs(amount),
      status: 'COMPLETED',
      note: 'Partner salary payout',
      refId: payoutRef,
    });
    syncUserWalletBalance(user, wallet);
    return wallet;
  },

  refund(user: User, amount: number, refId: string, note?: string) {
    const wallet = getWallet(user.id);
    wallet.balance += amount;
    wallet.refunds += amount;
    setWallet(user.id, wallet);
    addWalletTxn(user.id, { type: 'REFUND', amount: Math.abs(amount), status: 'COMPLETED', refId, note });
    syncUserWalletBalance(user, wallet);
    return wallet;
  },

  requestWithdrawal(user: User, amount: number, payout: WithdrawalDestination) {
    if (amount <= 0) {
      throw new Error('Enter a valid withdrawal amount.');
    }

    const wallet = getWallet(user.id);
    if (wallet.balance < amount) {
      throw new Error('Insufficient wallet balance for this withdrawal.');
    }

    wallet.balance -= amount;
    setWallet(user.id, wallet);
    const txn = addWalletTxn(user.id, {
      type: 'WITHDRAWAL_REQUEST',
      amount: -Math.abs(amount),
      status: 'PENDING',
      note: `Withdrawal via ${payout.label}`,
      meta: { payout },
    });
    syncUserWalletBalance(user, wallet);
    return txn;
  },

  updateWithdrawalStatus(userId: string, txnId: string, status: WalletTransaction['status']) {
    const txns = listWalletTxns(userId);
    const idx = txns.findIndex(t => t.id === txnId);
    if (idx >= 0) {
      txns[idx] = { ...txns[idx], status };
      storage.setJSON(transactionKey(userId), txns);
    }
  }
};
