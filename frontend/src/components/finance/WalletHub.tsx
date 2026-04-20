import { useEffect, useMemo, useState } from 'react';
import { User } from '@/types';
import {
  addMoneyToBackend,
  getWallet,
  listWalletTxns,
  requestWithdrawalFromBackend,
  syncWalletFromBackend,
  type WithdrawalMethod,
} from '@/lib/wallet';
import {
  createSip,
  getUserSipPlans,
  stopSip,
  syncRoleSipPlansFromBackend,
  type RoleSipPlan,
  type SipInterval,
} from '@/lib/roleSip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BackButton } from '@/components/BackButton';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type WalletHubProps = {
  user: User;
  title: string;
  subtitle: string;
  showBackButton?: boolean;
  highlights?: Array<{
    label: string;
    value: string;
    helper?: string;
  }>;
};

const WITHDRAWAL_METHODS: Array<{ value: WithdrawalMethod; label: string; placeholder: string }> = [
  { value: 'BANK_ACCOUNT', label: 'Bank Account', placeholder: 'Account number' },
  { value: 'UPI', label: 'UPI', placeholder: 'yourname@upi' },
  { value: 'GPAY', label: 'GPay', placeholder: 'GPay UPI ID or mobile number' },
  { value: 'PAYTM', label: 'Paytm', placeholder: 'Paytm mobile number or UPI ID' },
  { value: 'PHONEPE', label: 'PhonePe', placeholder: 'PhonePe UPI ID or mobile number' },
  { value: 'OTHER_WALLET', label: 'Other Wallet', placeholder: 'Wallet ID or payout handle' },
];

const SIP_INTERVAL_OPTIONS: Array<{ value: SipInterval; label: string; helper: string }> = [
  { value: 'DAILY', label: 'Daily', helper: 'Small daily auto debit' },
  { value: 'WEEKLY', label: 'Weekly', helper: 'Weekly recurring contribution' },
  { value: 'FIFTEEN_DAYS', label: '15 Days', helper: 'Every fifteen days' },
  { value: 'MONTHLY', label: 'Monthly', helper: 'Standard monthly SIP' },
];

function formatCurrency(amount: number) {
  return `Rs. ${Math.round(Number(amount || 0)).toLocaleString('en-IN')}`;
}

function intervalLabel(interval?: SipInterval) {
  return SIP_INTERVAL_OPTIONS.find((item) => item.value === interval)?.label || 'Monthly';
}

export function WalletHub({
  user,
  title,
  subtitle,
  showBackButton = true,
  highlights = [],
}: WalletHubProps) {
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [wallet, setWallet] = useState(() => getWallet(user.id));
  const [transactions, setTransactions] = useState(() => listWalletTxns(user.id));
  const [sipPlans, setSipPlans] = useState<RoleSipPlan[]>(() => getUserSipPlans(user.id));
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawalMethod>('BANK_ACCOUNT');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [payoutDestination, setPayoutDestination] = useState('');
  const [sipAmount, setSipAmount] = useState('50');
  const [sipYears, setSipYears] = useState('1');
  const [sipGoal, setSipGoal] = useState('');
  const [sipInterval, setSipInterval] = useState<SipInterval>('MONTHLY');
  const [autoDebitEnabled, setAutoDebitEnabled] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const selectedMethod = useMemo(
    () => WITHDRAWAL_METHODS.find((method) => method.value === withdrawMethod)!,
    [withdrawMethod],
  );

  const refresh = () => setRefreshTick((value) => value + 1);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const [walletSnapshot, backendSipPlans] = await Promise.all([
          syncWalletFromBackend(user),
          syncRoleSipPlansFromBackend(user.id),
        ]);

        if (!mounted) return;
        setWallet(walletSnapshot.wallet);
        setTransactions(walletSnapshot.transactions);
        setSipPlans(backendSipPlans);
      } catch {
        if (!mounted) return;
        setWallet(getWallet(user.id));
        setTransactions(listWalletTxns(user.id));
        setSipPlans(getUserSipPlans(user.id));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      mounted = false;
    };
  }, [user, refreshTick]);

  const handleAddMoney = async () => {
    const amount = Number(addMoneyAmount || 0);

    if (amount <= 0) {
      toast.error('Enter a valid amount to add to the wallet.');
      return;
    }

    setBusyKey('add-money');
    try {
      const snapshot = await addMoneyToBackend(user, amount);
      setWallet(snapshot.wallet);
      setTransactions(snapshot.transactions);
      setAddMoneyAmount('');
      toast.success('Money added to your wallet.');
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to add money right now.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleWithdrawal = async () => {
    const amount = Number(withdrawAmount || 0);

    try {
      const destination =
        withdrawMethod === 'BANK_ACCOUNT'
          ? `${accountNumber.trim()} / ${ifsc.trim()}`
          : payoutDestination.trim();

      if (withdrawMethod === 'BANK_ACCOUNT' && (!accountName.trim() || !accountNumber.trim() || !ifsc.trim())) {
        toast.error('Enter account holder name, account number, and IFSC.');
        return;
      }

      if (withdrawMethod !== 'BANK_ACCOUNT' && !destination) {
        toast.error(`Enter a valid ${selectedMethod.label} destination.`);
        return;
      }

      setBusyKey('withdraw');
      const snapshot = await requestWithdrawalFromBackend(user, amount, {
        method: withdrawMethod,
        label: selectedMethod.label,
        destination,
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        ifsc: ifsc.trim(),
      });

      setWallet(snapshot.wallet);
      setTransactions(snapshot.transactions);
      setWithdrawAmount('');
      setAccountName('');
      setAccountNumber('');
      setIfsc('');
      setPayoutDestination('');
      toast.success(`Withdrawal request submitted through ${selectedMethod.label}.`);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create withdrawal request.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleCreateSip = async () => {
    const amount = Number(sipAmount || 0);
    const tenureYears = Number(sipYears || 0);

    if (amount < 50) {
      toast.error('Minimum SIP amount is Rs. 50.');
      return;
    }

    if (![1, 3, 5].includes(tenureYears)) {
      toast.error('Choose a 1 year, 3 year, or 5 year SIP term.');
      return;
    }

    if (!termsAccepted) {
      toast.error('Please accept the SIP terms and conditions.');
      return;
    }

    setBusyKey('sip-create');
    try {
      await createSip({
        userId: user.id,
        projectId: `wallet_sip_${user.id}`,
        amount,
        role: user.role,
        tenureYears,
        goalLabel: sipGoal.trim() || 'Goal-based savings',
        termsAccepted,
        interval: sipInterval,
        autoDebitEnabled,
      });

      const plans = await syncRoleSipPlansFromBackend(user.id);
      setSipPlans(plans);
      setSipGoal('');
      setSipAmount('50');
      setSipYears('1');
      setSipInterval('MONTHLY');
      setAutoDebitEnabled(true);
      setTermsAccepted(false);
      toast.success(autoDebitEnabled ? 'SIP created with auto debit.' : 'Manual SIP plan saved successfully.');
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to start SIP.');
    } finally {
      setBusyKey(null);
    }
  };

  const handleStopSip = async (sipId: string) => {
    setBusyKey(`stop-${sipId}`);
    try {
      await stopSip(sipId);
      const plans = await syncRoleSipPlansFromBackend(user.id);
      setSipPlans(plans);
      toast.success('SIP plan cancelled.');
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to cancel SIP right now.');
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        {showBackButton && <BackButton />}
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-gray-600">{subtitle}</p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {[
            ['Wallet Balance', wallet.balance],
            ['Principal', wallet.principal],
            ['Profits & Salary', wallet.profits],
            ['Refunds', wallet.refunds],
          ].map(([label, value]) => (
            <Card key={String(label)}>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600">{label}</p>
                <p className="mt-2 text-2xl font-bold">{formatCurrency(Number(value))}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {highlights.length > 0 && (
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {highlights.map((item) => (
              <Card key={item.label} className="border-green-100 bg-green-50/50">
                <CardContent className="p-6">
                  <p className="text-sm text-green-700">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
                  {item.helper && <p className="mt-2 text-sm text-slate-600">{item.helper}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add Money to Wallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wallet-add">Amount</Label>
                <Input
                  id="wallet-add"
                  value={addMoneyAmount}
                  onChange={(event) => setAddMoneyAmount(event.target.value)}
                  placeholder="Enter amount"
                  type="number"
                  min="1"
                />
              </div>
              <Button onClick={handleAddMoney} className="w-full" disabled={busyKey === 'add-money'}>
                {busyKey === 'add-money' ? 'Adding...' : 'Add Money'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Withdraw to Bank / UPI / Wallets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Amount</Label>
                <Input
                  id="withdraw-amount"
                  value={withdrawAmount}
                  onChange={(event) => setWithdrawAmount(event.target.value)}
                  placeholder="Enter withdrawal amount"
                  type="number"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label>Payout Method</Label>
                <Select value={withdrawMethod} onValueChange={(value) => setWithdrawMethod(value as WithdrawalMethod)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose payout method" />
                  </SelectTrigger>
                  <SelectContent>
                    {WITHDRAWAL_METHODS.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {withdrawMethod === 'BANK_ACCOUNT' ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="account-name">Account Holder</Label>
                    <Input
                      id="account-name"
                      value={accountName}
                      onChange={(event) => setAccountName(event.target.value)}
                      placeholder="Account holder name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account-number">Account Number</Label>
                    <Input
                      id="account-number"
                      value={accountNumber}
                      onChange={(event) => setAccountNumber(event.target.value)}
                      placeholder="Account number"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="ifsc">IFSC</Label>
                    <Input
                      id="ifsc"
                      value={ifsc}
                      onChange={(event) => setIfsc(event.target.value.toUpperCase())}
                      placeholder="IFSC code"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="payout-destination">{selectedMethod.label} Handle</Label>
                  <Input
                    id="payout-destination"
                    value={payoutDestination}
                    onChange={(event) => setPayoutDestination(event.target.value)}
                    placeholder={selectedMethod.placeholder}
                  />
                </div>
              )}

              <Button onClick={handleWithdrawal} className="w-full" variant="outline" disabled={busyKey === 'withdraw'}>
                {busyKey === 'withdraw' ? 'Submitting...' : 'Request Withdrawal'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Flexible SIP from Rs. 50</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sip-amount">Installment Amount</Label>
                  <Input
                    id="sip-amount"
                    value={sipAmount}
                    onChange={(event) => setSipAmount(event.target.value)}
                    type="number"
                    min="50"
                    placeholder="Minimum Rs. 50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SIP Term</Label>
                  <Select value={sipYears} onValueChange={setSipYears}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Year</SelectItem>
                      <SelectItem value="3">3 Years</SelectItem>
                      <SelectItem value="5">5 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Debit Interval</Label>
                  <Select value={sipInterval} onValueChange={(value) => setSipInterval(value as SipInterval)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose interval" />
                    </SelectTrigger>
                    <SelectContent>
                      {SIP_INTERVAL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    {SIP_INTERVAL_OPTIONS.find((option) => option.value === sipInterval)?.helper}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">Auto debit</p>
                      <p className="text-sm text-slate-600">
                        Enable automatic recurring debits, or keep this off and cancel anytime.
                      </p>
                    </div>
                    <Switch checked={autoDebitEnabled} onCheckedChange={setAutoDebitEnabled} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sip-goal">Goal / Purpose</Label>
                <Input
                  id="sip-goal"
                  value={sipGoal}
                  onChange={(event) => setSipGoal(event.target.value)}
                  placeholder="College savings, harvest reserve, equipment fund..."
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-emerald-700">Min Amount</p>
                  <p className="mt-1 text-xl font-bold text-emerald-900">Rs. 50</p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-blue-700">Interval</p>
                  <p className="mt-1 text-xl font-bold text-blue-900">{intervalLabel(sipInterval)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Mode</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {autoDebitEnabled ? 'Auto Debit' : 'Manual'}
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                <input
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                  type="checkbox"
                  className="mt-1"
                />
                <span>
                  I understand these are estimated SIP projections and I agree to the AgriInvest SIP terms and conditions.
                </span>
              </label>

              <Button onClick={handleCreateSip} className="w-full" disabled={busyKey === 'sip-create'}>
                {busyKey === 'sip-create' ? 'Saving SIP...' : 'Start SIP'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Active SIP Plans</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-gray-600">Loading wallet and SIP plans...</p>
              ) : sipPlans.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No SIP plans yet. Start one from Rs. 50 to build disciplined savings.
                </p>
              ) : (
                <div className="space-y-3">
                  {sipPlans.map((plan) => (
                    <div key={plan.id} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{plan.goalLabel}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(plan.monthlyAmount)} every {intervalLabel(plan.interval).toLowerCase()} for {plan.tenureYears} year(s)
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                          plan.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {plan.status}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-gray-600">
                        <p>Provider: {plan.provider}</p>
                        <p>Expected annual return: {plan.expectedAnnualReturn}%</p>
                        <p>Estimated maturity: {formatCurrency(plan.estimatedMaturity)}</p>
                        <p>Next debit: {new Date(plan.nextDebitDate).toLocaleDateString('en-IN')}</p>
                        <p>Auto debit: {plan.autoDebitEnabled ? 'Enabled' : 'Disabled'}</p>
                        <p>Status note: {plan.autoDebitStatus || (plan.autoDebitEnabled ? 'Scheduled' : 'Manual plan')}</p>
                      </div>
                      {plan.status === 'ACTIVE' && (
                        <Button
                          variant="outline"
                          className="mt-4 w-full"
                          onClick={() => void handleStopSip(plan.id)}
                          disabled={busyKey === `stop-${plan.id}`}
                        >
                          {busyKey === `stop-${plan.id}` ? 'Cancelling...' : 'Cancel SIP'}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Wallet Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-gray-600">No transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex flex-col gap-2 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">{transaction.type.replaceAll('_', ' ')}</p>
                      <p className="text-sm text-gray-600">
                        {transaction.note || 'Wallet transaction'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(Math.abs(transaction.amount))}</p>
                      <p className="text-xs uppercase tracking-wide text-gray-500">{transaction.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
