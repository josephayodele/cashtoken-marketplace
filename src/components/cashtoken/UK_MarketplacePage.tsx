import React, { useEffect, useMemo, useState } from 'react';
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

// ─── Hero marketing chrome (mirrors UK_BrandsPage so the two heroes match) ───
// TODO: extract to a shared UK_Hero component when the third site needs it.
const shopperImages = [
  'https://d64gsuwffb70l.cloudfront.net/698c74038d655b8d24d48fd8_1772110470673_b5a06a9b.png',
  'https://d64gsuwffb70l.cloudfront.net/698c74038d655b8d24d48fd8_1772110515156_1bb1fcfb.jpg',
  'https://d64gsuwffb70l.cloudfront.net/698c74038d655b8d24d48fd8_1772110472484_f6d279e3.jpg',
  'https://d64gsuwffb70l.cloudfront.net/698c74038d655b8d24d48fd8_1772110481223_6698ed09.jpg',
  'https://d64gsuwffb70l.cloudfront.net/698c74038d655b8d24d48fd8_1772110588746_c134bc92.png',
  'https://d64gsuwffb70l.cloudfront.net/698c74038d655b8d24d48fd8_1772110558606_0bed35a8.jpg',
];
const heroBanner = 'https://d64gsuwffb70l.cloudfront.net/698c74038d655b8d24d48fd8_1772110535174_8e9fba49.jpg';

// Hardcoded promo copy — marketing chrome only, NOT catalog.
const hotDeals = [
  { brand: 'ASOS',         deal: 'Buy 2 Get 1 Free',       color: '#2D2D2D', textColor: '#fff',     logo: 'ASOS' },
  { brand: "Nando's",      deal: 'Free Starter with Main', color: '#E31837', textColor: '#fff',     logo: "Nando's" },
  { brand: 'Deliveroo',    deal: 'Free Delivery Today',    color: '#00CCBC', textColor: '#fff',     logo: 'deliveroo' },
  { brand: 'Temu',         deal: 'Up to 90% OFF',          color: '#FB6F20', textColor: '#fff',     logo: 'Temu' },
  { brand: 'Costa Coffee', deal: 'Double Points Week',     color: '#6B0F24', textColor: '#fff',     logo: 'COSTA' },
  { brand: 'Greggs',       deal: '£1 Sausage Rolls',       color: '#004B8D', textColor: '#FF6600',  logo: 'GREGGS' },
  { brand: 'H&M',          deal: '30% OFF Everything',     color: '#E50010', textColor: '#fff',     logo: 'H&M' },
  { brand: 'Uber Eats',    deal: '£5 OFF First Order',     color: '#142328', textColor: '#06C167',  logo: 'UberEats' },
];

const DealPopup: React.FC<{ deal: typeof hotDeals[number]; index: number; onClose: () => void }> = ({ deal, index, onClose }) => {
  const positions = [
    'top-20 right-4', 'top-40 left-4', 'top-60 right-8', 'bottom-40 left-8',
    'top-32 right-12', 'bottom-60 right-4', 'top-48 left-12', 'bottom-32 left-4',
  ];
  return (
    <div className={`fixed z-50 ${positions[index % positions.length]} animate-dealPopIn`} style={{ animationDelay: `${index * 0.3}s` }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 max-w-[200px] relative overflow-hidden">
        <button onClick={onClose} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: deal.color }}>
            <span className="text-[8px] font-bold" style={{ color: deal.textColor }}>{deal.logo}</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-900 leading-tight">{deal.brand}</p>
            <p className="text-[9px] text-[#7B0F14] font-semibold">{deal.deal}</p>
          </div>
        </div>
        <div className="h-0.5 rounded-full bg-gradient-to-r from-[#DAA520] via-[#7B0F14] to-[#DAA520] animate-shimmerBar" />
      </div>
    </div>
  );
};

const DealsTicker: React.FC = () => (
  <div className="overflow-hidden bg-gradient-to-r from-[#7B0F14] via-[#A52228] to-[#7B0F14] py-2.5 relative">
    <div className="flex animate-ticker whitespace-nowrap">
      {[...hotDeals, ...hotDeals, ...hotDeals].map((deal, i) => (
        <div key={i} className="inline-flex items-center gap-2 mx-6">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: deal.color }}>
            <span className="text-[7px] font-bold" style={{ color: deal.textColor }}>{deal.logo}</span>
          </div>
          <span className="text-white/90 text-xs font-medium">{deal.brand}:</span>
          <span className="text-[#DAA520] text-xs font-bold">{deal.deal}</span>
          <span className="text-white/30 mx-2">|</span>
        </div>
      ))}
    </div>
  </div>
);

const UK_MarketplacePage: React.FC<MarketplacePageProps> = ({ onBack, onViewBrands, walletBalance = 0, userName }) => {
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [activeDealPopups, setActiveDealPopups] = useState<number[]>([]);

  useEffect(() => {
    const heroTimer = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(heroTimer);
  }, []);

  useEffect(() => {
    let popupIndex = 0;
    const interval = setInterval(() => {
      setActiveDealPopups((prev) => {
        const next = [...prev, popupIndex % hotDeals.length];
        if (next.length > 3) next.shift();
        return next;
      });
      popupIndex++;
    }, 3000);
    const firstTimer = setTimeout(() => setActiveDealPopups([0]), 2000);
    return () => { clearInterval(interval); clearTimeout(firstTimer); };
  }, []);

  const closeDealPopup = (idx: number) =>
    setActiveDealPopups((prev) => prev.filter((i) => i !== idx));

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
        @keyframes dealPopIn {
          0% { opacity: 0; transform: scale(0.3) translateY(20px); }
          50% { opacity: 1; transform: scale(1.1) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes shimmerBar {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes heroSlideUp {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-dealPopIn  { animation: dealPopIn 0.5s ease-out both; }
        .animate-ticker     { animation: ticker 40s linear infinite; }
        .animate-shimmerBar { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); background-size: 200% 100%; animation: shimmerBar 1.5s linear infinite; }
        .animate-heroSlideUp { animation: heroSlideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .animate-floatSlow  { animation: floatSlow 4s ease-in-out infinite; }
        .scroll-hide::-webkit-scrollbar { display: none; }
        .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* ═══ DEAL POPUPS (floating marketing chrome) ═══ */}
      {activeDealPopups.map((dealIdx) => (
        <DealPopup
          key={`popup-${dealIdx}`}
          deal={hotDeals[dealIdx]}
          index={dealIdx}
          onClose={() => closeDealPopup(dealIdx)}
        />
      ))}

      {/* Back button (only when onBack is provided — not on the landing) */}
      {onBack && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-[#7B0F14] transition-colors group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:-translate-x-1 transition-transform">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm font-medium">Back to Home</span>
          </button>
        </div>
      )}

      {/* ═══ HERO BANNER (matches UK_BrandsPage exactly) ═══ */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="Happy shoppers" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#7B0F14]/90 via-[#7B0F14]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="max-w-xl animate-heroSlideUp">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
              <GoldCoin size={18} />
              <span className="text-white/90 text-xs font-medium">Receive CashTokens on every purchase</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-3 leading-tight">
              <span className="inline-block" style={{ opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'translateX(0)' : 'translateX(-80px)', transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s' }}>Shop.</span>{' '}
              <span className="inline-block" style={{ opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'translateX(0)' : 'translateX(80px)', transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s' }}>Receive.</span>{' '}
              <span className="inline-block text-[#DAA520]" style={{ opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? 'translateX(0) scale(1)' : 'translateX(-60px) scale(0.8)', transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s' }}>Win Big.</span>
            </h1>

            <p className="text-white/80 text-sm md:text-base mb-6 max-w-md">
              Discover amazing deals from top UK brands. Every purchase over £50 earns you CashTokens worth up to £1,000,000!
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => document.getElementById('gift-cards')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-[#DAA520] hover:bg-[#C4941A] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Gift Card Brands
              </button>
              <button
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all border border-white/20"
              >
                Buy Airtime
              </button>
            </div>
          </div>
          {/* Floating shopper images */}
          <div className="hidden lg:block absolute right-8 top-8 bottom-8">
            <div className="relative h-full w-64">
              <div className="absolute top-0 right-0 w-28 h-36 rounded-2xl overflow-hidden shadow-2xl animate-floatSlow border-2 border-white/20" style={{ animationDelay: '0s' }}>
                <img src={shopperImages[0]} alt="Happy shopper" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-0 right-12 w-24 h-32 rounded-2xl overflow-hidden shadow-2xl animate-floatSlow border-2 border-white/20" style={{ animationDelay: '1s' }}>
                <img src={shopperImages[4]} alt="Happy shopper" className="w-full h-full object-cover" />
              </div>
              <div className="absolute top-1/3 right-28 w-20 h-28 rounded-2xl overflow-hidden shadow-2xl animate-floatSlow border-2 border-white/20" style={{ animationDelay: '2s' }}>
                <img src={shopperImages[2]} alt="Happy shopper" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ DEALS TICKER ═══ */}
      <DealsTicker />

      {/* ═══ EARN BANNER ═══ */}
      <div className="bg-gradient-to-r from-[#F4E6E6] via-white to-[#F4E6E6] py-4 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <GoldCoin size={32} />
          <p className="text-[#7B0F14] font-bold text-base md:text-lg">
            {userName ? `Welcome back, ${userName.split(' ')[0]} — ` : ''}
            Earn CashToken when your purchase hits £50.
            {walletBalance > 0 && <span className="ml-2 text-[#DAA520]">£{walletBalance.toFixed(2)} in wallet</span>}
          </p>
        </div>
      </div>

      {/* ─── SERVICES (Airtime lives here — target of the "Buy Airtime" hero button) ─── */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 scroll-mt-24">
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

      {/* ─── FEATURED GIFT CARDS (target of the "Gift Card Brands" hero button) ─── */}
      <section id="gift-cards" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 scroll-mt-24">
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
