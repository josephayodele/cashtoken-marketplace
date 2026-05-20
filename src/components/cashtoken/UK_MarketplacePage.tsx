import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import GoldCoin from './GoldCoin';
import {
  listCountryServices,
  listUkGiftCards,
} from '@/lib/cashtokenApi';

interface MarketplacePageProps {
  onBack?: () => void;
  onViewBrands?: () => void;
  walletBalance?: number;
  userName?: string;
}

// Deterministic colour from a name. Same brand → same colour across renders.
const PALETTE = ['#1F2937', '#7C2D12', '#1E40AF', '#831843', '#365314', '#0E7490', '#7C3AED', '#9A3412', '#0F766E', '#5B21B6'];
function colorFromName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

const UK_MarketplacePage: React.FC<MarketplacePageProps> = ({ onBack, onViewBrands, walletBalance = 0, userName }) => {

  // ─── Services catalog (Airtime / Voucher / …) ───
  const {
    data: apiServices,
    isLoading: servicesLoading,
    isError:   servicesError,
  } = useQuery({
    queryKey: ['uk-services'],
    queryFn: () => listCountryServices('gb'),
    staleTime: 30 * 60_000,
    retry: 1,
  });

  // ─── Featured gift cards ───
  const {
    data: apiGiftCards,
    isLoading: giftCardsLoading,
    isError:   giftCardsError,
  } = useQuery({
    queryKey: ['uk-gift-cards'],
    queryFn: listUkGiftCards,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  // First 12 cards rendered on the landing as a preview.
  const featuredGiftCards = useMemo(() => {
    if (!apiGiftCards) return [];
    return apiGiftCards.slice(0, 12).map((g, i) => {
      const name = (g.brand_name || g.name || `Gift Card ${i + 1}`).toString();
      const products = Array.isArray(g.products) ? g.products : [];
      const minPrice = products.length > 0
        ? Math.min(...products.map(p => Number(p.min_purchase || 0)))
        : 0;
      const image    = g.gift_card_design?.[0]?.image_url;
      const category = products[0]?.brand_params?.subCategory || 'Gift Card';
      return {
        id:    g.id ?? i,
        name,
        price: `£${minPrice.toFixed(2)}`,
        category,
        image,
        color: colorFromName(name),
        logo:  name.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase(),
        raw:   g,
      };
    });
  }, [apiGiftCards]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-screen relative">
      <style>{`
        @keyframes prodIn {
          0% { opacity: 0; transform: translateY(20px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .scroll-hide::-webkit-scrollbar { display: none; }
        .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* ─── HERO ─── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'radial-gradient(circle at 20% 30%, #A52228 0%, #7B0F14 45%, #4A0A0D 100%)' }}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-72 h-72 bg-[#DAA520] rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-10 w-96 h-96 bg-[#7B0F14] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10 lg:pt-14 lg:pb-14">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-6 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to UK Home
            </button>
          )}

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full mb-4 border border-white/20">
                <GoldCoin size={16} />
                <span className="text-[11px] font-bold text-[#DAA520] uppercase tracking-[0.18em]">UK Marketplace</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-3">
                Real gift cards.<br />
                <span className="text-[#DAA520]">Real cashback.</span>
              </h1>
              <p className="text-white/80 text-sm sm:text-base mb-6 max-w-lg">
                Buy gift cards and top up airtime from the brands you actually use. Every purchase earns CashTokens you can spend on more rewards or withdraw.
              </p>
              {onViewBrands && (
                <button
                  onClick={onViewBrands}
                  className="bg-[#DAA520] hover:bg-[#C4941A] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl"
                >
                  Browse all brands →
                </button>
              )}
            </div>

            {/* Wallet card */}
            <div className="hidden lg:flex justify-end">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Your Wallet</span>
                  <GoldCoin size={28} />
                </div>
                <p className="text-white text-3xl font-black mb-1">£{walletBalance.toFixed(2)}</p>
                <p className="text-white/60 text-xs">{userName ? `Welcome back, ${userName.split(' ')[0]}` : 'Sign in to start earning'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-5">
          <p className="text-[10px] font-bold text-[#DAA520] uppercase tracking-[0.2em] mb-1">Available in the UK</p>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900">Services</h2>
        </div>

        {servicesLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-gray-100 p-4 animate-pulse h-24" />
            ))}
          </div>
        )}

        {servicesError && !servicesLoading && (
          <div className="rounded-2xl bg-white border border-gray-100 p-5 text-center">
            <p className="text-gray-500 text-sm">Could not load the service catalog.</p>
          </div>
        )}

        {!servicesLoading && !servicesError && apiServices && apiServices.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {apiServices.map((svc, i) => {
              const ref       = (svc.serviceRef || svc.ref || '').toString();
              const name      = (svc.title || svc.name || ref || 'Service').toString();
              const isAirtime = /airtime/i.test(ref) || /airtime/i.test(name);
              const isVoucher = /voucher|gift/i.test(ref) || /voucher|gift/i.test(name);
              const accent    = colorFromName(ref || name);
              return (
                <button
                  key={ref || i}
                  onClick={() => onViewBrands?.()}
                  className="group rounded-2xl bg-white border border-gray-100 p-4 text-left hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3" style={{ backgroundColor: accent }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {isAirtime ? (
                        <><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></>
                      ) : isVoucher ? (
                        <><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /></>
                      ) : (
                        <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>
                      )}
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{name}</p>
                  {svc.description && (
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{String(svc.description)}</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── FEATURED GIFT CARDS ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-end justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold text-[#DAA520] uppercase tracking-[0.2em] mb-1">Buy & earn</p>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Featured gift cards</h2>
          </div>
          {onViewBrands && (
            <button
              onClick={onViewBrands}
              className="text-[#7B0F14] hover:text-[#5A0B10] text-sm font-semibold inline-flex items-center gap-1"
            >
              View all →
            </button>
          )}
        </div>

        {giftCardsLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {giftCardsError && !giftCardsLoading && (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
            <GoldCoin size={56} className="mx-auto mb-3 opacity-40" />
            <p className="text-gray-700 font-semibold mb-1">Could not load gift cards</p>
            <p className="text-gray-500 text-sm">Check your connection and try again.</p>
          </div>
        )}

        {!giftCardsLoading && !giftCardsError && featuredGiftCards.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            {featuredGiftCards.map((card, i) => (
              <button
                key={card.id}
                onClick={() => onViewBrands?.()}
                className="group rounded-2xl bg-white border border-gray-100 overflow-hidden text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                style={{
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  animation: `prodIn 0.4s ease-out ${(i % 12) * 0.04}s both`,
                }}
              >
                <div
                  className="aspect-[4/3] flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: card.image ? '#f3f4f6' : card.color }}
                >
                  {card.image ? (
                    <img
                      src={card.image}
                      alt={card.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-2xl font-black text-white">{card.logo}</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider truncate">{card.category}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5 line-clamp-2 min-h-[2.5rem]">{card.name}</p>
                  <p className="text-xs text-[#7B0F14] font-bold mt-1">From {card.price}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {!giftCardsLoading && !giftCardsError && featuredGiftCards.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
            <GoldCoin size={56} className="mx-auto mb-3 opacity-40" />
            <p className="text-gray-700 font-semibold mb-1">No gift cards available right now</p>
            <p className="text-gray-500 text-sm">Check back soon.</p>
          </div>
        )}
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-[10px] font-bold text-[#DAA520] uppercase tracking-[0.2em] mb-2">How it works</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Shop, earn, repeat.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { step: '01', title: 'Browse brands & services', body: 'Real UK gift cards, airtime top-ups, and other services from the Cashtoken catalog.' },
              { step: '02', title: 'Pay with your wallet',     body: 'Use your CashToken wallet or a card. Every purchase is tracked.' },
              { step: '03', title: 'Earn CashTokens',          body: 'Cashback lands in your wallet. Spend it on more gift cards, airtime, or cash out.' },
            ].map((s) => (
              <div key={s.step} className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                <div className="text-[#DAA520] font-black text-3xl mb-3">{s.step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default UK_MarketplacePage;
