import React, { useState, useMemo, useRef, useEffect } from 'react';
import GoldCoin from './GoldCoin';
import {
  initializeUkVoucherOrder,
  getPaymentMethods,
  setPaymentMethod,
  getOrderSummary,
  isTerminalOrderStatus,
  isSuccessfulOrderStatus,
  CashtokenApiError,
  type Order,
  type PaymentMethod,
} from '../../lib/cashtokenApi';

interface BrandDetailsProps {
  brand: any;
  walletBalance: number;
  onUpdateBalance: (amount: number) => void;
  onBack: () => void;
  userName?: string;
}

type Step = 'amount' | 'message' | 'preview' | 'payment' | 'success' | 'rate';

// Poll cadence for the order summary after payment is set (docs §15 step 9).
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 40; // ~2 minutes

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

const UK_BrandDetails: React.FC<BrandDetailsProps> = ({ brand, walletBalance, onUpdateBalance, onBack, userName }) => {

  const [step, setStep] = useState<Step>('amount');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedMessage, setSelectedMessage] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [giftBoxOpened, setGiftBoxOpened] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [showBounce, setShowBounce] = useState(false);

  // ─── Real order/payment state ───
  const [order, setOrder] = useState<Order | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Guard async work against unmount / navigation.
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; };
  }, []);

  // Real denominations from the API gift-card products. Each product carries a
  // fixed denomination (min_purchase === max_purchase, e.g. £110/£210/£510);
  // we collect the distinct values. Fall back to defaults only if the brand
  // arrived without product data (e.g. a non-API/placeholder brand).
  const FALLBACK_AMOUNTS = [10, 25, 50, 100, 250, 500];
  const amounts = useMemo<number[]>(() => {
    const products = Array.isArray(brand?.products) ? brand.products : [];
    const denoms = products
      .map((p: any) => Number(p?.min_purchase))
      .filter((n: number) => Number.isFinite(n) && n > 0);
    const unique = Array.from(new Set<number>(denoms)).sort((a, b) => a - b);
    return unique.length > 0 ? unique : FALLBACK_AMOUNTS;
  }, [brand]);
  const messages = [
    'Happy Mother\'s Day',
    'Happy Father\'s Day',
    'Happy Birthday',
    'Congratulations',
    'Thank You',
    'AI Generate Message',
  ];

  const messageText = selectedMessage === 'AI Generate Message' ? customMessage : selectedMessage;
  const giftCardId = brand?.id;

  const isWalletMethod = (m: PaymentMethod) =>
    m.name === 'reward-wallet' || m.icon === 'reward-wallet' || m.mfaType === 'PIN';

  const errMsg = (e: unknown, fallback: string) =>
    e instanceof CashtokenApiError ? (e.errorDescription || e.message) : (e instanceof Error ? e.message : fallback);

  const handlePreviewClick = () => {
    if (!giftBoxOpened) {
      setGiftBoxOpened(true);
      setConfetti(true);
      setTimeout(() => setConfetti(false), 3000);
    }
  };

  // preview → payment: create the voucher order, then load its payment methods.
  const handleProceedToPayment = async () => {
    if (!selectedAmount) return;
    if (!giftCardId) {
      setError('This gift card is missing its catalog id and cannot be purchased right now.');
      return;
    }
    setError(null);
    setLoading(true);
    setStatusText('Creating your order…');
    try {
      const created = await initializeUkVoucherOrder({
        giftCardId,
        amount: selectedAmount,
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        message: messageText,
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

  const recipientOk = recipientName.trim().length > 0 && isValidEmail(recipientEmail);

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
          <span className="text-sm font-medium">Back to Brands</span>
        </button>

        {/* Brand Header */}
        <div className="rounded-3xl overflow-hidden mb-8" style={{ backgroundColor: brand.color }}>
          <div className="p-8 text-center">
            <span className="text-4xl font-bold" style={{ color: brand.textColor }}>{brand.logo}</span>
            <p className="text-white/80 mt-2 text-sm">{brand.name}</p>
          </div>
        </div>

        {/* Inline error banner */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* STEP: Amount Selection */}
        {step === 'amount' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Gift Card Amount</h2>
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
            <button
              onClick={() => selectedAmount && setStep('message')}
              disabled={!selectedAmount}
              className={`w-full mt-6 py-4 rounded-2xl font-semibold text-white transition-all ${
                selectedAmount ? 'bg-[#7B0F14] hover:bg-[#5A0B10] shadow-lg' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Continue — £{selectedAmount || 0}
            </button>
          </div>
        )}

        {/* STEP: Recipient & Message */}
        {step === 'message' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recipient &amp; message</h2>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipient name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Who is this gift for?"
                  className="w-full p-4 rounded-2xl border border-gray-200 focus:border-[#7B0F14] focus:ring-2 focus:ring-[#7B0F14]/20 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Recipient email</label>
                <input
                  type="email"
                  inputMode="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full p-4 rounded-2xl border border-gray-200 focus:border-[#7B0F14] focus:ring-2 focus:ring-[#7B0F14]/20 outline-none text-sm"
                />
                <p className="text-[11px] text-gray-400 mt-1">The gift card is delivered to this email.</p>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-700 mb-2">Add a message</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {messages.map((msg) => (
                <button
                  key={msg}
                  onClick={() => setSelectedMessage(msg)}
                  className={`p-4 rounded-2xl text-sm font-medium transition-all text-left ${
                    selectedMessage === msg
                      ? 'bg-[#7B0F14] text-white shadow-lg'
                      : 'bg-[#F4E6E6] text-gray-700 hover:bg-[#E8D4D4]'
                  }`}
                >
                  {msg}
                </button>
              ))}
            </div>
            {selectedMessage === 'AI Generate Message' && (
              <textarea
                placeholder="Describe the occasion and we'll generate a message..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-4 rounded-2xl border border-gray-200 focus:border-[#7B0F14] focus:ring-2 focus:ring-[#7B0F14]/20 outline-none text-sm resize-none h-24"
              />
            )}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep('amount')} className="flex-1 py-4 rounded-2xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                Back
              </button>
              <button
                onClick={() => recipientOk && setStep('preview')}
                disabled={!recipientOk}
                className={`flex-1 py-4 rounded-2xl font-semibold text-white transition-all ${
                  recipientOk ? 'bg-[#7B0F14] hover:bg-[#5A0B10] shadow-lg' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Preview Gift
              </button>
            </div>
          </div>
        )}

        {/* STEP: Preview */}
        {step === 'preview' && (
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Gift Preview</h2>

            {/* Confetti */}
            {confetti && (
              <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                {Array.from({ length: 50 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 rounded-sm"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: '-10px',
                      backgroundColor: ['#DAA520', '#7B0F14', '#F4E6E6', '#FFD700', '#E31837'][i % 5],
                      animation: `fall ${2 + Math.random() * 2}s linear forwards`,
                      animationDelay: `${Math.random() * 1}s`,
                      transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Gift Box */}
            <button
              onClick={handlePreviewClick}
              className={`mx-auto block transition-all duration-500 ${
                giftBoxOpened ? 'scale-110' : 'hover:scale-105 animate-bounce'
              }`}
              style={{ animationDuration: '2s' }}
            >
              <div className="relative w-40 h-40 mx-auto">
                {!giftBoxOpened ? (
                  <svg viewBox="0 0 160 160" width="160" height="160">
                    <rect x="20" y="70" width="120" height="80" rx="8" fill="#7B0F14" />
                    <rect x="10" y="50" width="140" height="30" rx="6" fill="#A52228" />
                    <rect x="72" y="50" width="16" height="100" fill="#DAA520" />
                    <rect x="10" y="58" width="140" height="14" fill="#DAA520" />
                    <ellipse cx="80" cy="48" rx="20" ry="12" fill="#DAA520" />
                    <ellipse cx="80" cy="48" rx="6" ry="6" fill="#B8860B" />
                  </svg>
                ) : (
                  <div className="text-center">
                    <div className="text-6xl mb-2" style={{ animation: 'bounce 0.5s ease' }}>
                      <svg viewBox="0 0 160 160" width="160" height="160">
                        <rect x="20" y="80" width="120" height="70" rx="8" fill="#7B0F14" />
                        <rect x="10" y="40" width="140" height="25" rx="6" fill="#A52228" transform="rotate(-15 80 52)" />
                        <rect x="72" y="80" width="16" height="70" fill="#DAA520" />
                        <circle cx="50" cy="30" r="4" fill="#DAA520" opacity="0.8" />
                        <circle cx="110" cy="25" r="3" fill="#DAA520" opacity="0.6" />
                        <circle cx="80" cy="15" r="5" fill="#FFD700" opacity="0.9" />
                        <circle cx="65" cy="20" r="2" fill="#DAA520" opacity="0.7" />
                        <circle cx="95" cy="18" r="3" fill="#FFD700" opacity="0.8" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>

            <p className="text-gray-600 mt-4 text-sm">
              {giftBoxOpened ? 'Your gift is ready!' : 'Tap the gift box to open!'}
            </p>

            {giftBoxOpened && (
              <div className="mt-6 bg-[#F4E6E6] rounded-2xl p-6">
                <p className="font-bold text-[#7B0F14] text-lg">{brand.name} Gift Card</p>
                <p className="text-3xl font-bold text-[#DAA520] mt-2">£{selectedAmount}</p>
                <p className="text-sm text-gray-600 mt-2">For {recipientName} · {recipientEmail}</p>
                {messageText && <p className="text-gray-600 mt-1 italic">"{messageText}"</p>}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep('message')} disabled={loading} className="flex-1 py-4 rounded-2xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-60">
                Back
              </button>
              <button
                onClick={handleProceedToPayment}
                disabled={loading}
                className="flex-1 py-4 rounded-2xl font-semibold bg-[#7B0F14] text-white hover:bg-[#5A0B10] transition-colors shadow-lg disabled:opacity-70"
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
              <button onClick={() => setStep('preview')} disabled={loading} className="flex-1 py-4 rounded-2xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-60">
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
            <h2 className="text-2xl font-bold text-gray-900">Payment Completed {userName?.split(' ')[0] || ''}</h2>

            <p className="text-gray-500 mt-2">Your {brand.name} gift card has been sent to {recipientName}!</p>
            <div className="bg-[#F4E6E6] rounded-2xl p-6 mt-6 inline-block">
              <p className="text-sm text-gray-600">Amount paid</p>
              <p className="text-3xl font-bold text-[#7B0F14]">£{selectedAmount}</p>
              <p className="text-sm text-gray-500 mt-1">to {recipientEmail}</p>
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
            <p className="text-gray-500 mb-8">How was your gift card purchase?</p>
            <div className="flex justify-center gap-6">
              {[
                { emoji: '😡', label: 'Terrible', value: 1 },
                { emoji: '😐', label: 'Okay', value: 2 },
                { emoji: '😊', label: 'Good', value: 3 },
                { emoji: '😍', label: 'Amazing', value: 4 },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRating(r.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
                    rating === r.value ? 'bg-[#F4E6E6] scale-110 shadow-lg' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="text-4xl">{r.emoji}</span>
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

      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default UK_BrandDetails;
