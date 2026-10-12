import React, { useState, useEffect, useMemo } from 'react';
import GoldCoin from './GoldCoin';
import {
  getRewardsSummary,
  listRewards,
  listTransactions,
  RewardRecord,
  RewardsSummary,
  TransactionRecord,
} from '@/lib/cashtokenApi';

interface ConsumerDashboardProps {
  walletBalance: number;
  onUpdateBalance: (amount: number) => void;
  userName?: string;
}

type WithdrawStep = 'dashboard' | 'amount' | 'bank' | 'account' | 'pin' | 'success';

const ConsumerDashboard: React.FC<ConsumerDashboardProps> = ({ walletBalance, onUpdateBalance, userName }) => {
  const [step, setStep] = useState<WithdrawStep>('dashboard');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const displayName = userName || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const banks = [
    { name: 'HSBC', color: '#DB0011' },
    { name: 'Barclays', color: '#00AEEF' },
    { name: 'Revolut', color: '#0666EB' },
    { name: 'Tranzfa', color: '#7B0F14' },
    { name: 'Volume', color: '#000' },
  ];

  // ─── Live data: rewards summary + transactions + recent rewards ───
  // All three are user-scoped (Bearer). Demo / signed-out users get 401s that
  // are swallowed here, so `hasRealData` stays false and the illustrative
  // sample below is shown instead (keeps the demo showcase populated).
  const [summary, setSummary] = useState<RewardsSummary | null>(null);
  const [txns, setTxns] = useState<TransactionRecord[]>([]);
  const [recentRewards, setRecentRewards] = useState<RewardRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s, t, r] = await Promise.all([
        getRewardsSummary('GB').catch(() => null),
        listTransactions({ countryCode: 'GB', limit: 200, sort: 'createdAt:desc' }).catch(() => [] as TransactionRecord[]),
        listRewards({ market: 'GB', limit: 6 }).catch(() => [] as RewardRecord[]),
      ]);
      if (cancelled) return;
      setSummary(s);
      setTxns(t);
      setRecentRewards(r);
    })();
    return () => { cancelled = true; };
  }, []);

  const hasRealData = summary != null || txns.length > 0 || recentRewards.length > 0;
  const fmtMoney = (n: number) => `£${(Number.isFinite(n) ? n : 0).toFixed(2)}`;

  // Month buckets for the Spending vs Rewards chart (last 8 months incl. current).
  const chart = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 8 }, (_, k) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (7 - k), 1);
      return { label: d.toLocaleString('en-GB', { month: 'short' }), key: `${d.getFullYear()}-${d.getMonth()}`, spend: 0, reward: 0 };
    });
    const idx = new Map(buckets.map((b, k) => [b.key, k]));
    for (const t of txns) {
      const when = new Date((t.createdAt || t.created_at || '') as string);
      if (isNaN(when.getTime())) continue;
      const k = idx.get(`${when.getFullYear()}-${when.getMonth()}`);
      if (k == null) continue;
      if (t.mode === 'out') buckets[k].spend += Math.abs(Number(t.amount ?? 0)) || 0;
      buckets[k].reward += Number(t.cashback ?? 0) || 0;
    }
    return buckets;
  }, [txns]);

  const totalCashtokens = useMemo(
    () => txns.reduce((s, t) => s + (Number(t.cashtoken ?? 0) || 0), 0),
    [txns],
  );
  const thisMonthCashtokens = useMemo(() => {
    const now = new Date();
    return txns.reduce((s, t) => {
      const w = new Date((t.createdAt || t.created_at || '') as string);
      if (isNaN(w.getTime()) || w.getFullYear() !== now.getFullYear() || w.getMonth() !== now.getMonth()) return s;
      return s + (Number(t.cashtoken ?? 0) || 0);
    }, 0);
  }, [txns]);

  // Static sample for the demo / signed-out showcase.
  const demoSpend = [320, 450, 280, 520, 390, 610, 480, 350];
  const demoReward = [32, 45, 28, 52, 39, 61, 48, 35];
  const demoMonths = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const demoRecentRewards: RewardRecord[] = [
    { brand: 'Tesco',   value: 5.0, category: 'cashback', createdAt: new Date(Date.now() - 2 * 864e5).toISOString() },
    { brand: 'Airtime', value: 0.5, category: 'cashback', createdAt: new Date(Date.now() - 4 * 864e5).toISOString() },
    { brand: 'Amazon',  value: 2.5, category: 'cashback', createdAt: new Date(Date.now() - 7 * 864e5).toISOString() },
    { brand: 'Vue',     value: 1.2, category: 'cashback', createdAt: new Date(Date.now() - 9 * 864e5).toISOString() },
  ];

  const spendData  = hasRealData ? chart.map((b) => b.spend)  : demoSpend;
  const rewardData = hasRealData ? chart.map((b) => b.reward) : demoReward;
  const months     = hasRealData ? chart.map((b) => b.label)  : demoMonths;
  const maxVal = Math.max(1, ...spendData, ...rewardData);
  const rewardsToShow = hasRealData ? recentRewards : demoRecentRewards;

  const stats = hasRealData
    ? [
        { label: 'Total CashTokens',    value: String(totalCashtokens),                                 change: thisMonthCashtokens > 0 ? `+${thisMonthCashtokens} this month` : 'All time' },
        { label: 'Total Rewards',       value: fmtMoney(Number(summary?.totalEarned ?? walletBalance)),  change: summary?.cashbackReceived ? `${fmtMoney(Number(summary.cashbackReceived))} cashback` : 'All time' },
        { label: 'Brands Used',         value: String(summary?.brandCount ?? 0),                         change: 'All time' },
        { label: 'Weekly Draw Entries', value: String(summary?.entriesThisWeek ?? 0),                    change: 'This week' },
      ]
    : [
        { label: 'Total CashTokens',    value: '247',                   change: '+12 this month' },
        { label: 'Total Rewards',       value: fmtMoney(walletBalance), change: '+£85.00 this week' },
        { label: 'Brands Used',         value: '18',                    change: '+3 new' },
        { label: 'Weekly Draw Entries', value: '52',                    change: 'Next draw: Friday' },
      ];

  const handleWithdraw = () => {
    if (pin.length !== 4) {
      setPinError('Please enter a 4-digit PIN');
      return;
    }
    const amount = parseFloat(withdrawAmount);
    if (amount > 0 && amount <= walletBalance) {
      onUpdateBalance(-amount);
      setStep('success');
    }
  };

  const resetWithdraw = () => {
    setStep('dashboard');
    setWithdrawAmount('');
    setSelectedBank('');
    setAccountNumber('');
    setPin('');
    setPinError('');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 'dashboard' && (
          <>
            {/* Profile & Balance */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#7B0F14] to-[#4A0A0D] flex items-center justify-center text-white font-bold text-xl border-2 border-[#DAA520]">
                  {initials}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Welcome back, {displayName.split(' ')[0]}</h1>
                  <p className="text-gray-500">My Universal Reward Balance</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Balance</p>
                  <p className="text-3xl font-bold text-[#7B0F14]">£{walletBalance.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => setStep('amount')}
                  className="bg-[#7B0F14] text-white px-6 py-3 rounded-2xl font-semibold hover:bg-[#5A0B10] transition-colors shadow-lg"
                >
                  Withdraw
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-green-600 font-medium mt-1">{stat.change}</p>
                </div>
              ))}
            </div>

            {/* Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Spending vs Rewards</h3>
                <div className="flex items-end gap-3 h-48">
                  {months.map((month, i) => (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col items-center gap-1" style={{ height: '160px', justifyContent: 'flex-end' }}>
                        <div className="w-full bg-[#7B0F14] rounded-t-lg transition-all duration-500" style={{ height: `${(spendData[i] / maxVal) * 100}%`, maxWidth: '24px' }} />
                        <div className="w-full bg-[#DAA520] rounded-t-lg transition-all duration-500" style={{ height: `${(rewardData[i] / maxVal) * 100}%`, maxWidth: '24px' }} />
                      </div>
                      <span className="text-xs text-gray-500">{month}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-4">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#7B0F14]" /><span className="text-xs text-gray-500">Spending</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#DAA520]" /><span className="text-xs text-gray-500">Rewards</span></div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Recent Rewards</h3>
                {rewardsToShow.length === 0 ? (
                  <p className="text-sm text-gray-500 py-8 text-center">Your rewards will appear here as you shop with partner brands.</p>
                ) : (
                  <div className="space-y-4">
                    {rewardsToShow.map((r, i) => {
                      const amt = Number(r.value ?? r.cashback ?? 0) || 0;
                      const name = r.brand || r.title || 'Reward';
                      const when = r.createdAt ? new Date(r.createdAt) : null;
                      return (
                        <div key={r.ref || `${name}-${i}`} className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#DAA52020' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DAA520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{name}</p>
                              {when && <p className="text-xs text-gray-400">{when.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>}
                            </div>
                          </div>
                          <span className="font-bold text-green-600 flex-shrink-0">+{fmtMoney(amt)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Withdrawal Flow */}
        {step === 'amount' && (
          <div className="max-w-md mx-auto">
            <button onClick={resetWithdraw} className="flex items-center gap-2 text-gray-600 hover:text-[#7B0F14] mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              <span className="text-sm font-medium">Back</span>
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Withdraw Funds</h2>
            <p className="text-gray-500 mb-6">Available: £{walletBalance.toFixed(2)}</p>
            <input type="number" placeholder="Enter amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full p-4 rounded-2xl border border-gray-200 focus:border-[#7B0F14] focus:ring-2 focus:ring-[#7B0F14]/20 outline-none text-2xl font-bold text-center" />
            <button
              onClick={() => parseFloat(withdrawAmount) > 0 && parseFloat(withdrawAmount) <= walletBalance && setStep('bank')}
              disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > walletBalance}
              className={`w-full mt-6 py-4 rounded-2xl font-semibold text-white transition-all ${
                withdrawAmount && parseFloat(withdrawAmount) > 0 && parseFloat(withdrawAmount) <= walletBalance ? 'bg-[#7B0F14] hover:bg-[#5A0B10] shadow-lg' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >Continue</button>
          </div>
        )}

        {step === 'bank' && (
          <div className="max-w-md mx-auto">
            <button onClick={() => setStep('amount')} className="flex items-center gap-2 text-gray-600 hover:text-[#7B0F14] mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              <span className="text-sm font-medium">Back</span>
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Select Bank</h2>
            <div className="space-y-3">
              {banks.map((bank) => (
                <button key={bank.name} onClick={() => { setSelectedBank(bank.name); setStep('account'); }}
                  className={`w-full p-5 rounded-2xl border-2 text-left flex items-center gap-4 transition-all hover:border-[#7B0F14] ${selectedBank === bank.name ? 'border-[#7B0F14] bg-[#F4E6E6]' : 'border-gray-200'}`}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: bank.color }}>{bank.name.substring(0, 2)}</div>
                  <span className="font-semibold text-gray-900">{bank.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'account' && (
          <div className="max-w-md mx-auto">
            <button onClick={() => setStep('bank')} className="flex items-center gap-2 text-gray-600 hover:text-[#7B0F14] mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              <span className="text-sm font-medium">Back</span>
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Account Details</h2>
            <p className="text-gray-500 mb-6">Withdrawing to {selectedBank}</p>
            <input type="text" placeholder="Enter account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
              className="w-full p-4 rounded-2xl border border-gray-200 focus:border-[#7B0F14] focus:ring-2 focus:ring-[#7B0F14]/20 outline-none text-lg tracking-wider text-center" />
            <button onClick={() => accountNumber.length >= 6 && setStep('pin')} disabled={accountNumber.length < 6}
              className={`w-full mt-6 py-4 rounded-2xl font-semibold text-white transition-all ${accountNumber.length >= 6 ? 'bg-[#7B0F14] hover:bg-[#5A0B10] shadow-lg' : 'bg-gray-300 cursor-not-allowed'}`}>
              Continue
            </button>
          </div>
        )}

        {step === 'pin' && (
          <div className="max-w-md mx-auto">
            <button onClick={() => setStep('account')} className="flex items-center gap-2 text-gray-600 hover:text-[#7B0F14] mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              <span className="text-sm font-medium">Back</span>
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Enter PIN</h2>
            <p className="text-gray-500 mb-6">Confirm your 4-digit PIN</p>
            <input type="password" placeholder="****" value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(''); }}
              className="w-full p-4 rounded-2xl border border-gray-200 focus:border-[#7B0F14] focus:ring-2 focus:ring-[#7B0F14]/20 outline-none text-3xl tracking-[1em] text-center" maxLength={4} />
            {pinError && <p className="text-red-500 text-sm mt-2">{pinError}</p>}
            <button onClick={handleWithdraw} className="w-full mt-6 py-4 rounded-2xl font-semibold bg-[#7B0F14] text-white hover:bg-[#5A0B10] transition-colors shadow-lg">
              Confirm Withdrawal
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="animate-bounce mb-6">
              <svg width="80" height="80" viewBox="0 0 80 80" className="mx-auto">
                <circle cx="40" cy="40" r="38" fill="#22C55E" />
                <path d="M25 40L35 50L55 30" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Withdrawal Successful</h2>
            <p className="text-gray-500 mt-2">£{withdrawAmount} sent to {selectedBank}</p>
            <div className="bg-[#F4E6E6] rounded-2xl p-6 mt-6">
              <p className="text-sm text-gray-600">New Balance</p>
              <p className="text-3xl font-bold text-[#7B0F14]">£{walletBalance.toFixed(2)}</p>
            </div>
            <button onClick={resetWithdraw} className="w-full mt-8 py-4 rounded-2xl font-semibold bg-[#7B0F14] text-white hover:bg-[#5A0B10] transition-colors shadow-lg">
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumerDashboard;
