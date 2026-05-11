import React, { useEffect, useRef, useState } from 'react';
import GoldCoin from './GoldCoin';
import {
  CashtokenApiError,
  CountryCode,
  SubIdentifier,
  beginSignIn,
  completeRegistration,
  getUserInfo,
  rememberSubject,
  userNeedsRegistration,
  verifyOtp,
} from '@/lib/cashtokenApi';

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user?: UserProfile) => void;
  /** ISO-3166 alpha-2. UK pages should pass 'GB'; default 'NG'. */
  country?: CountryCode;
}

const DEMO_USER: UserProfile = {
  id: 'demo-user-001',
  full_name: 'Alex Johnson',
  avatar_url: null,
  email: 'demo@cashtoken.uk',
};

type Step = 'identify' | 'otp' | 'register';

// Phone sign-in is rejected by the IDP for country=GB (see openapi.yaml §3098).
// We always use email here — the simplest universally-allowed path.
const SUB_KIND: SubIdentifier = 'email';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess, country = 'NG' }) => {
  const [step, setStep] = useState<Step>('identify');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [challenge, setChallenge] = useState<{ id: string; token: string; masked: string; expiresIn: number } | null>(null);
  const [subjectToken, setSubjectToken] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const otpInputRef = useRef<HTMLInputElement>(null);

  // Reset everything when the modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('identify');
      setEmail('');
      setOtpCode('');
      setFirstName('');
      setLastName('');
      setChallenge(null);
      setSubjectToken('');
      setError('');
      setLoading(false);
      setResendCooldown(0);
    }
  }, [isOpen]);

  // Focus OTP input when entering that step
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpInputRef.current?.focus(), 50);
    }
  }, [step]);

  // Resend cooldown tick
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // ─── Step handlers ─────────────────────────────────────────────────────────

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim();
    if (!trimmed) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError('Please enter a valid email address.'); return; }

    setLoading(true);
    try {
      const { challenge: c, subjectToken: st } = await beginSignIn({
        sub: trimmed,
        subIdentifier: SUB_KIND,
        country,
      });
      setSubjectToken(st);
      setChallenge({ id: c.otpChallengeId, token: c.otpChallengeToken, masked: c.masked, expiresIn: c.expiresIn || 300 });
      setResendCooldown(30);
      setStep('otp');
    } catch (err) {
      setError(friendlyError(err, 'Could not send the verification code. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!challenge || !subjectToken) { setError('Challenge expired. Please request a new code.'); return; }
    if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) { setError('Enter the 6-digit code.'); return; }

    setLoading(true);
    try {
      await verifyOtp(
        { otpChallengeId: challenge.id, otpChallengeToken: challenge.token, otpCode },
        subjectToken,
      );
      rememberSubject(email.trim(), SUB_KIND, country);

      const info = await getUserInfo();

      if (userNeedsRegistration(info)) {
        setStep('register');
        setLoading(false);
        return;
      }

      onAuthSuccess({
        id: info.ref,
        full_name: info.name || `${info.firstName || ''} ${info.lastName || ''}`.trim() || email,
        avatar_url: null,
        email: info.email || email,
      });
      onClose();
    } catch (err) {
      setError(friendlyError(err, 'That code didn\'t work. Check it and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim()) { setError('Please enter your first and last name.'); return; }

    setLoading(true);
    try {
      await completeRegistration({
        type: 'individual',
        country,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender: 'others',
      });
      const info = await getUserInfo();
      onAuthSuccess({
        id: info.ref,
        full_name: info.name || `${firstName.trim()} ${lastName.trim()}`,
        avatar_url: null,
        email: info.email || email,
      });
      onClose();
    } catch (err) {
      setError(friendlyError(err, 'Could not complete registration. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      const { challenge: c, subjectToken: st } = await beginSignIn({
        sub: email.trim(),
        subIdentifier: SUB_KIND,
        country,
      });
      setSubjectToken(st);
      setChallenge({ id: c.otpChallengeId, token: c.otpChallengeToken, masked: c.masked, expiresIn: c.expiresIn || 300 });
      setOtpCode('');
      setResendCooldown(30);
    } catch (err) {
      setError(friendlyError(err, 'Could not resend the code. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    onAuthSuccess(DEMO_USER);
    onClose();
  };

  const currencySymbol = country === 'GB' ? '£' : country === 'NG' ? '₦' : '$';

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeIn 0.25s ease-out' }}
      >
        {/* Header */}
        <div
          className="relative px-8 pt-8 pb-6 text-center"
          style={{ background: 'radial-gradient(circle at 30% 20%, #A52228 0%, #7B0F14 40%, #4A0A0D 100%)' }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10" style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
            transform: 'translate(30%, -30%)',
          }} />
          <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          {step === 'otp' && (
            <button
              onClick={() => { setStep('identify'); setError(''); }}
              className="absolute top-4 left-4 text-white/60 hover:text-white transition-colors"
              aria-label="Back"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}
          <GoldCoin size={48} className="mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white">
            {step === 'identify' && 'Sign in to CashToken'}
            {step === 'otp'      && 'Verify your email'}
            {step === 'register' && 'Finish your profile'}
          </h2>
          <p className="text-white/60 text-sm mt-1">
            {step === 'identify' && 'We\'ll email you a 6-digit code — no password needed.'}
            {step === 'otp'      && challenge && <>Code sent to <span className="text-[#DAA520] font-semibold">{challenge.masked || email}</span></>}
            {step === 'register' && 'Just your name so we can personalise your wallet.'}
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
          )}

          {/* ─── Step: identify ───────────────────────────────────────── */}
          {step === 'identify' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    type="email"
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#7B0F14] focus:ring-2 focus:ring-[#7B0F14]/20 outline-none text-sm transition-all"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">Signing in for {country === 'GB' ? 'United Kingdom' : country === 'NG' ? 'Nigeria' : country}</p>
              </div>

              <SubmitButton loading={loading} label="Send verification code" loadingLabel="Sending code..." />

              <Divider />

              <button
                type="button"
                onClick={handleDemo}
                className="w-full py-3.5 rounded-xl font-semibold text-[#7B0F14] border-2 border-[#7B0F14]/30 hover:border-[#7B0F14] hover:bg-[#F4E6E6] transition-all flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                Use Demo Account
              </button>
              <div className="bg-[#F4E6E6]/60 rounded-xl px-4 py-2.5 text-xs text-gray-500 text-center">
                Demo: <span className="font-semibold text-[#7B0F14]">Alex Johnson</span> · {currencySymbol}1,247.50 wallet
              </div>
            </form>
          )}

          {/* ─── Step: otp ────────────────────────────────────────────── */}
          {step === 'otp' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">6-digit code</label>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7B0F14] focus:ring-2 focus:ring-[#7B0F14]/20 outline-none text-center text-2xl font-bold tracking-[0.4em] transition-all"
                />
              </div>

              <SubmitButton loading={loading} label="Verify and sign in" loadingLabel="Verifying..." disabled={otpCode.length !== 6} />

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Didn't get it?</span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className={`font-semibold ${resendCooldown > 0 || loading ? 'text-gray-300 cursor-not-allowed' : 'text-[#7B0F14] hover:underline'}`}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {/* ─── Step: register ───────────────────────────────────────── */}
          {step === 'register' && (
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
                  <input
                    type="text"
                    autoFocus
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ada"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7B0F14] focus:ring-2 focus:ring-[#7B0F14]/20 outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Lovelace"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7B0F14] focus:ring-2 focus:ring-[#7B0F14]/20 outline-none text-sm transition-all"
                  />
                </div>
              </div>
              <SubmitButton loading={loading} label="Create my account" loadingLabel="Creating account..." />
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Tiny shared bits ────────────────────────────────────────────────────────
const SubmitButton: React.FC<{ loading: boolean; label: string; loadingLabel: string; disabled?: boolean }> = ({ loading, label, loadingLabel, disabled }) => (
  <button
    type="submit"
    disabled={loading || disabled}
    className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all shadow-lg ${
      loading || disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#7B0F14] hover:bg-[#5A0B10] active:scale-[0.98]'
    }`}
  >
    {loading ? (
      <span className="flex items-center justify-center gap-2">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {loadingLabel}
      </span>
    ) : label}
  </button>
);

const Divider: React.FC = () => (
  <div className="flex items-center gap-3">
    <div className="flex-1 h-px bg-gray-200" />
    <span className="text-xs text-gray-400 font-medium">or</span>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

function friendlyError(err: unknown, fallback: string): string {
  if (err instanceof CashtokenApiError) {
    if (err.errorCode === 'CONFIG_MISSING') return err.message;
    if (err.status === 401) return 'Incorrect or expired code.';
    if (err.status === 400) return err.message || 'Invalid request.';
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

export default AuthModal;
