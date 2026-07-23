import React, { useState, useRef, useEffect } from 'react';
import GoldCoin from './GoldCoin';
import {
  initializeUkAirtimeOrder,
  getPaymentMethods,
  setPaymentMethod,
  getOrderSummary,
  isTerminalOrderStatus,
  isSuccessfulOrderStatus,
  CashtokenApiError,
  type Order,
  type PaymentMethod,
} from '../../lib/cashtokenApi';

interface AirtimeDetailsProps {
  provider: any;
  walletBalance: number;
  onUpdateBalance: (amount: number) => void;
  onBack: () => void;
  userName?: string;
}

type Step = 'phone' | 'amount' | 'preview' | 'payment' | 'success' | 'rate';

// Poll cadence for the order summary after payment is set (docs §15 step 9).
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40; // ~2 minutes

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const UK_AirtimeDetails: React.FC<AirtimeDetailsProps> = ({ provider, walletBalance, onUpdateBalance, onBack, userName }) => {
  const [step, setStep] = useState<Step>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [showBounce, setShowBounce] = useState(false);
  const [rating, setRating] = useState<number | null>(null);

  // ─── Real order/payment state ───
  const [order, setOrder] = useState<Order | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);        // network in-flight (init / set / poll)
  const [statusText, setStatusText] = useState('');     // e.g. "Waiting for payment…"
  const [error, setError] = useState<string | null>(null);

  // Guard async work against unmount / navigation.
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; };
  }, []);

  const amounts = [5, 10, 15, 20, 30, 50];
  const isValidPhone = phoneNumber.replace(/\s/g, '').length >= 10;

  // provider.id carries the real provider.code (e.g. "9457:67") — see UK_BrandsPage.
  const providerCode: string = provider?.code || provider?.id || '';
  // GB airtime recipient is the target line in E.164-ish form.
  const recipient = `+44${phoneNumber.replace(/\D/g, '')}`;

  const isWalletMethod = (m: PaymentMethod) =>
    m.name === 'reward-wallet' || m.icon === 'reward-wallet' || m.mfaType === 'PIN';

  const errMsg = (e: unknown, fallback: string) =>
    e instanceof CashtokenApiError ? (e.errorDescription || e.message) : (e instanceof Error ? e.message : fallback);

  // preview → payment: create the order, then load its payment methods.
  const handleProceedToPayment = async () => {
    if (!selectedAmount) return;
    if (!providerCode) {
      setError('This provider is missing a service code and cannot be topped up right now.');
      return;
    }
    setError(null);
    setLoading(true);
    setStatusText('Creating your order…');
    try {
      const created = await initializeUkAirtimeOrder({
        providerCode,
        amount: selectedAmount,
        recipient,
      });
      if (!aliveRef.current) return;
      setOrder(created);
      setStatusText('Loading payment methods…');
      const pms = await getPaymentMethods(created.ref);
      if (!aliveRef.current) return;
      setMethods(pms.filter((m) => m.enabled));
      setStep('payment');
    } catch (e) {
      if (aliveRef.current) setError(errMsg(e, 'Could not start the payment. Please try again.'));
    } finally {
      if (aliveRef.current) { setLoading(false); setStatusText(''); }
    }
  };

  // Poll the order summary until it reaches a terminal status (or we time out).
  const pollUntilResolved = async (orderRef: string): Promise<Order | null> => {
    for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
      if (!aliveRef.current) return null;
      await delay(POLL_INTERVAL_MS);
      if (!aliveRef.current) return null;
      try {
        const summary = await getOrderSummary(orderRef);
        if (isTerminalOrderStatus(summary.status)) return summary;
      } catch {
        // transient — keep polling
      }
    }
    return null; // timed out; treat as still pending
  };

  // payment step: set the chosen method and drive it to completion.
  const handlePay = async () => {
    if (!order || !selectedMethod) return;
    const method = selectedMethod;
    const wallet = isWalletMethod(method);
    if (wallet && method.mfaLength && pin.length < method.mfaLength) return;

    setError(null);
    setLoading(true);
    setStatusText(wallet ? 'Processing payment…' : 'Starting secure payment…');
    try {
      const result = await setPaymentMethod(order.ref, {
        option: method.name,
        gateway: method.gateway,
        returnUrl: `${window.location.origin}/payment/return`,
        ...(wallet && pin ? { value: pin } : {}),
      });
      if (!aliveRef.current) return;

      // Card gateways return a continuationLink for 3-D Secure. On web we open it
      // in a new tab and poll the order summary in this tab until it resolves.
      if (result.continuationLink) {
        window.open(result.continuationLink, '_blank', 'noopener,noreferrer');
        setStatusText('Complete the payment in the opened tab. Waiting for confirmation…');
      } else {
        setStatusText('Confirming payment…');
      }

      const resolved = await pollUntilResolved(order.ref);
      if (!aliveRef.current) return;

      if (resolved && isSuccessfulOrderStatus(resolved.status)) {
        // Keep the demo wallet UI in sync when paying from the reward wallet.
        if (wallet && selectedAmount) onUpdateBalance(-selectedAmount);
        setStep('success');
        setShowBounce(true);
        setTimeout(() => setShowBounce(false), 2000);
      } else if (resolved) {
        setError('Payment was not successful. No charge has been completed — please try again.');
      } else {
        setError('We could not confirm your payment in time. Check your transaction history before retrying.');
      }
    } catch (e) {
      if (aliveRef.current) setError(errMsg(e, 'Payment failed. Please try again.'));
    } finally {
      if (aliveRef.current) { setLoading(false); setStatusText(''); }
    }
  };

  const walletUnaffordable =
    selectedMethod != null && isWalletMethod(selectedMethod) &&
    selectedAmount != null && walletBalance < selectedAmount;
  const belowMin =
    selectedMethod?.minimumAmount != null && selectedAmount != null &&
    selectedAmount < selectedMethod.minimumAmount;
  const pinIncomplete =
    selectedMethod != null && isWalletMethod(selectedMethod) &&
    selectedMethod.mfaLength != null && pin.length < selectedMethod.mfaLength;
  const payDisabled = loading || !selectedMethod || walletUnaffordable || belowMin || pinIncomplete;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Back button */}
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-[#7B0F14] transition-colors mb-6">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="text-sm font-medium">Back to Airtime</span>
        </button>

        {/* Provider Header */}
        <div className="rounded-3xl overflow-hidden mb-8" style={{ backgroundColor: provider.color }}>
          <div className="p-8 text-center">
            <span className="text-4xl font-bold" style={{ color: provider.textColor }}>{provider.logo}</span>
            <p className="text-white/80 mt-2 text-sm">{provider.name} Top Up</p>
          </div>
        </div>

        {/* Inline error banner */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* STEP: Phone Number */}
        {step === 'phone' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Enter Phone Number</h2>
            <p className="text-gray-500 text-sm mb-6">Enter the {provider.name} number to top up</p>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-lg">🇬🇧</span>
                <span className="text-gray-500 font-medium">+44</span>
              </div>
              <input
                type="tel"
                placeholder="7XXX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s]/g, '').slice(0, 13))}
                className="w-full pl-24 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-[#7B0F14] focus:ring-2 focus:ring-[#7B0F14]/20 outline-none text-lg tracking-wider"
              />
            </div>
            <button
              onClick={() => isValidPhone && setStep('amount')}
              disabled={!isValidPhone}
              className={`w-full mt-6 py-4 rounded-2xl font-semibold text-white transition-all ${
                isValidPhone ? 'bg-[#7B0F14] hover:bg-[#5A0B10] shadow-lg' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP: Amount Selection */}
        {step === 'amount' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Select Top Up Amount</h2>
            <p className="text-gray-500 text-sm mb-6">Topping up: +44 {phoneNumber}</p>
            <div className="grid grid-cols-3 gap-3">
              {amounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setSelectedAmount(amt)}
                  className={`py-4 rounded-2xl text-lg font-bold transition-all ${
                    selectedAmount === amt
                      ? 'bg-[#7B0F14] text-white shadow-lg scale-105'
                      : 'bg-[#F4E6E6] text-[#7B0F14] hover:bg-[#E8D4D4]'
                  }`}
                >
                  £{amt}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep('phone')} className="flex-1 py-4 rounded-2xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                Back
              </button>
              <button
                onClick={() => selectedAmount && setStep('preview')}
                disabled={!selectedAmount}
                className={`flex-1 py-4 rounded-2xl font-semibold text-white transition-all ${
                  selectedAmount ? 'bg-[#7B0F14] hover:bg-[#5A0B10] shadow-lg' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Continue — £{selectedAmount || 0}
              </button>
            </div>
          </div>
        )}

        {/* STEP: Preview */}
        {step === 'preview' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Confirm Top Up</h2>
            <div className="bg-[#F4E6E6] rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Provider</span>
                <span className="font-semibold text-gray-900">{provider.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Phone Number</span>
                <span className="font-semibold text-gray-900">+44 {phoneNumber}</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#E8D4D4] pt-4">
                <span className="text-gray-600 font-medium">Amount</span>
                <span className="text-2xl font-bold text-[#7B0F14]">£{selectedAmount}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep('amount')}
                disabled={loading}
                className="flex-1 py-4 rounded-2xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-60"
              >
                Back
              </button>
              <button
                onClick={handleProceedToPayment}
                disabled={loading}
                className="flex-1 py-4 rounded-2xl font-semibold bg-[#7B0F14] text-white hover:bg-[#5A0B10] transition-colors shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (statusText || 'Please wait…') : 'Proceed to Payment'}
              </button>
            </div>
          </div>
        )}

        {/* STEP: Payment */}
        {step === 'payment' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
            <p className="text-gray-600 mb-6">
              Total: <span className="text-2xl font-bold text-[#7B0F14]">£{order?.total ?? selectedAmount}</span>
              {order?.fee ? <span className="text-sm text-gray-500"> (incl. £{order.fee} fee)</span> : null}
            </p>

            {methods.length === 0 ? (
              <p className="text-gray-500 text-sm">No payment methods are available for this order right now.</p>
            ) : (
              <div className="space-y-3">
                {methods.map((m) => {
                  const wallet = isWalletMethod(m);
                  const active = selectedMethod?.ref === m.ref;
                  return (
                    <button
                      key={m.ref}
                      onClick={() => { setSelectedMethod(m); setPin(''); setError(null); }}
                      disabled={loading}
                      className={`w-full p-5 rounded-2xl border-2 text-left flex items-center gap-4 transition-all disabled:opacity-60 ${
                        active ? 'border-[#7B0F14] bg-[#F4E6E6]' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${wallet ? 'bg-[#DAA520]' : 'bg-[#7B0F14]'}`}>
                        {wallet ? (
                          <GoldCoin size={28} />
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{m.title}</p>
                        <p className="text-sm text-gray-500">
                          {wallet ? `Balance: £${walletBalance.toFixed(2)}` : (m.subtitleValue || 'Visa · Mastercard')}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* PIN entry for reward-wallet / MFA methods */}
            {selectedMethod && isWalletMethod(selectedMethod) && selectedMethod.mfaLength ? (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedMethod.mfaLabel || `Enter your ${selectedMethod.mfaLength}-digit transaction PIN`}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, selectedMethod.mfaLength!))}
                  placeholder={'•'.repeat(selectedMethod.mfaLength)}
                  className="w-full px-4 py-4 rounded-2xl border border-gray-200 focus:border-[#7B0F14] focus:ring-2 focus:ring-[#7B0F14]/20 outline-none text-lg tracking-[0.4em]"
                />
              </div>
            ) : null}

            {walletUnaffordable && (
              <p className="text-red-500 text-sm mt-3 font-medium">Insufficient wallet balance. Please top up or use a debit card.</p>
            )}
            {belowMin && (
              <p className="text-red-500 text-sm mt-3 font-medium">
                This method requires a minimum of £{selectedMethod?.minimumAmount}.
              </p>
            )}
            {loading && statusText && (
              <p className="text-gray-600 text-sm mt-3 flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-[#7B0F14] border-t-transparent rounded-full animate-spin" />
                {statusText}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep('preview')}
                disabled={loading}
                className="flex-1 py-4 rounded-2xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-60"
              >
                Back
              </button>
              <button
                onClick={handlePay}
                disabled={payDisabled}
                className={`flex-1 py-4 rounded-2xl font-semibold text-white transition-all ${
                  !payDisabled ? 'bg-[#7B0F14] hover:bg-[#5A0B10] shadow-lg' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {loading ? 'Processing…' : `Pay £${selectedAmount}`}
              </button>
            </div>
          </div>
        )}

        {/* STEP: Success */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className={`text-6xl mb-4 ${showBounce ? 'animate-bounce' : ''}`}>
              <svg width="80" height="80" viewBox="0 0 80 80" className="mx-auto">
                <circle cx="40" cy="40" r="38" fill="#22C55E" />
                <path d="M25 40L35 50L55 30" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Top Up Successful!</h2>
            <p className="text-gray-500 mt-2">Your {provider.name} top up has been processed!</p>
            <div className="bg-[#F4E6E6] rounded-2xl p-6 mt-6 inline-block">
              <p className="text-sm text-gray-600">Amount topped up</p>
              <p className="text-3xl font-bold text-[#7B0F14]">£{selectedAmount}</p>
              <p className="text-sm text-gray-500 mt-1">to +44 {phoneNumber}</p>
              <p className="text-sm text-gray-500 mt-1">via {selectedMethod?.title || 'Payment'}</p>
            </div>
            <button
              onClick={() => setStep('rate')}
              className="w-full mt-8 py-4 rounded-2xl font-semibold bg-[#7B0F14] text-white hover:bg-[#5A0B10] transition-colors shadow-lg"
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP: Rate */}
        {step === 'rate' && (
          <div className="text-center py-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Rate your experience</h2>
            <p className="text-gray-500 mb-8">How was your airtime purchase?</p>
            <div className="flex justify-center gap-6">
              {[
                { label: 'Terrible', value: 1, icon: 'frown' },
                { label: 'Okay', value: 2, icon: 'meh' },
                { label: 'Good', value: 3, icon: 'smile' },
                { label: 'Amazing', value: 4, icon: 'heart' },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRating(r.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
                    rating === r.value ? 'bg-[#F4E6E6] scale-110 shadow-lg' : 'hover:bg-gray-50'
                  }`}
                >
                  <svg width="40" height="40" viewBox="0 0 40 40" className="mx-auto">
                    <circle cx="20" cy="20" r="18" fill={rating === r.value ? '#7B0F14' : '#E5E7EB'} />
                    {r.icon === 'frown' && (
                      <>
                        <circle cx="14" cy="16" r="2" fill="white" />
                        <circle cx="26" cy="16" r="2" fill="white" />
                        <path d="M13 28C15 24 25 24 27 28" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
                      </>
                    )}
                    {r.icon === 'meh' && (
                      <>
                        <circle cx="14" cy="16" r="2" fill="white" />
                        <circle cx="26" cy="16" r="2" fill="white" />
                        <line x1="13" y1="26" x2="27" y2="26" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      </>
                    )}
                    {r.icon === 'smile' && (
                      <>
                        <circle cx="14" cy="16" r="2" fill="white" />
                        <circle cx="26" cy="16" r="2" fill="white" />
                        <path d="M13 24C15 28 25 28 27 24" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
                      </>
                    )}
                    {r.icon === 'heart' && (
                      <>
                        <circle cx="14" cy="16" r="2" fill="white" />
                        <circle cx="26" cy="16" r="2" fill="white" />
                        <path d="M13 23C15 29 25 29 27 23" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
                      </>
                    )}
                  </svg>
                  <span className="text-xs text-gray-600">{r.label}</span>
                </button>
              ))}
            </div>
            {rating && (
              <div className="mt-8">
                <p className="text-[#7B0F14] font-semibold mb-4">Thank you for your feedback!</p>
                <button
                  onClick={onBack}
                  className="w-full py-4 rounded-2xl font-semibold bg-[#DAA520] text-white hover:bg-[#B8860B] transition-colors shadow-lg"
                >
                  Continue life-changing experience
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UK_AirtimeDetails;
