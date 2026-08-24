import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listCountryServices, listServiceFieldOptions, listUkGiftCards } from '@/lib/cashtokenApi';

import GoldCoin from './GoldCoin';

interface BrandsPageProps {
  onSelectBrand: (brand: any) => void;
  onSelectAirtime?: (provider: any) => void;
  onBack?: () => void;
}

// ─── Shopper images ───
const shopperImages = [
  'https://d64gsuwffb70l.cloudfront.net/698c74038d655b8d24d48fd8_1772110470673_b5a06a9b.png',
  'https://d64gsuwffb70l.cloudfront.net/698c74038d655b8d24d48fd8_1772110515156_1bb1fcfb.jpg',
  'https://d64gsuwffb70l.cloudfront.net/698c74038d655b8d24d48fd8_1772110472484_f6d279e3.jpg',
  'https://d64gsuwffb70l.cloudfront.net/698c74038d655b8d24d48fd8_1772110481223_6698ed09.jpg',
  'https://d64gsuwffb70l.cloudfront.net/698c74038d655b8d24d48fd8_1772110588746_c134bc92.png',
  'https://d64gsuwffb70l.cloudfront.net/698c74038d655b8d24d48fd8_1772110558606_0bed35a8.jpg',
];
const heroBanner = 'https://d64gsuwffb70l.cloudfront.net/698c74038d655b8d24d48fd8_1772110535174_8e9fba49.jpg';

// ─── Marketing chrome ───
// `hotDeals` is intentional hardcoded promo copy — NOT a catalog. It powers
// the deal-ticker and floating brand-badge animations in the hero. Real
// catalog data (gift cards / airtime / services) is fetched live from the
// middleware further down.
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

// ─── Gift Card Brands ───
// All brand data is fetched live from /api/uk/gift-card. No hardcoded fallback.

// Brand object shape used by the UI after normalisation from the API.
type GiftCardBrand = {
  id: number;
  name: string;
  category: string;
  price: string;
  color: string;
  textColor: string;
  logo: string;
  image?: string;
  brand_code?: string;
  products?: unknown[];
};

// Deterministic colour from brand name so the same brand always looks the same
// across renders, without needing a hand-curated lookup table.
const PALETTE = ['#1F2937', '#7C2D12', '#1E40AF', '#831843', '#365314', '#0E7490', '#7C3AED', '#9A3412', '#0F766E', '#5B21B6'];
function colorFromName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

// ─── UK Airtime Providers ───
// Fetched live from /api/countries/gb/services/airtime/fields/provider.code/options.json.

type AirtimeProvider = {
  id: string;       // provider.code value (e.g. "9457:67")
  name: string;     // description
  color: string;
  textColor: string;
  logo: string;
  icon?: string;    // raw icon key from API
};

type OtherServicesTab = 'giftcard' | 'credit' | 'international';

// Scroll-triggered visibility hook
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.1 && rect.bottom > -50) { setIsVisible(true); return; }
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(el); } },
      { threshold: Math.min(threshold, 0.05), rootMargin: '80px 0px 80px 0px' }
    );
    observer.observe(el);
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.95 && r.bottom > 0) { setIsVisible(true); window.removeEventListener('scroll', onScroll); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const fallback = setTimeout(() => setIsVisible(true), 4000);
    return () => { observer.disconnect(); window.removeEventListener('scroll', onScroll); clearTimeout(fallback); };
  }, [threshold]);
  return { ref, isVisible };
}

const UK_BrandsPage: React.FC<BrandsPageProps> = ({ onSelectBrand, onSelectAirtime, onBack }) => {
  const [otherServicesTab, setOtherServicesTab] = useState<OtherServicesTab>('giftcard');
  const [gcSearch, setGcSearch] = useState('');
  const [gcCategory, setGcCategory] = useState('All');
  const [gcDropdownOpen, setGcDropdownOpen] = useState(false);
  const [airSearch, setAirSearch] = useState('');
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [activeDealPopups, setActiveDealPopups] = useState<number[]>([]);

  // Scroll-triggered section refs
  const ctaSection = useInView(0.1);

  // Fetch the real UK gift-card catalog from the middleware. No fallback —
  // the UI shows loading/empty/error states explicitly.
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

  // Fetch the real UK airtime provider list.
  const {
    data: apiAirtime,
    isLoading: airtimeLoading,
    isError:   airtimeError,
  } = useQuery({
    queryKey: ['uk-airtime-providers'],
    queryFn: () => listServiceFieldOptions({
      country: 'gb',
      service: 'airtime',
      field:   'provider.code',
    }),
    staleTime: 10 * 60_000,
    retry: 1,
  });

  // Fetch the top-level VAS service catalog for the UK (Airtime, Voucher, …).
  const {
    data: apiServices,
    isLoading: servicesLoading,
    isError:   servicesError,
  } = useQuery({
    queryKey: ['uk-services'],
    queryFn: () => listCountryServices('gb'),
    staleTime: 30 * 60_000,    // service catalog rarely changes
    retry: 1,
  });

  // Normalise options.json items to the AirtimeProvider shape used by the UI.
  const effectiveAirtimeProviders: AirtimeProvider[] = useMemo(() => {
    if (!apiAirtime) return [];
    return apiAirtime.map((opt) => {
      const name = (opt.description || String(opt.const)).toString();
      return {
        id:        String(opt.const),
        name,
        color:     colorFromName(name),
        textColor: '#fff',
        logo:      (opt.icon as string) || name.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase(),
        icon:      opt.icon as string | undefined,
      };
    });
  }, [apiAirtime]);

  // Normalise the API shape to the card shape the UI expects.
  // Real fields (empirical — endpoint isn't documented):
  //   brand_name / name             → display name
  //   gift_card_design[0].image_url → real Cloudinary image
  //   products[].min_purchase       → denominations; we show the cheapest
  //   products[0].brand_params.subCategory → category bucket
  const effectiveGiftCardBrands: GiftCardBrand[] = useMemo(() => {
    if (!apiGiftCards) return [];
    return apiGiftCards.map((g, i): GiftCardBrand => {
      const name = (g.brand_name || g.name || `Gift Card ${i + 1}`).toString();
      const products = Array.isArray(g.products) ? g.products : [];
      const minPrice = products.length > 0
        ? Math.min(...products.map(p => Number(p.min_purchase || 0)))
        : 0;
      const image    = g.gift_card_design?.[0]?.image_url;
      const category =
        (g.gift_card_category?.name as string | undefined) ||
        products[0]?.brand_params?.subCategory ||
        'Gift Cards';
      return {
        id:         g.id ?? i + 1,
        name,
        category,
        price:      `£${minPrice.toFixed(2)}`,
        color:      colorFromName(name),
        textColor:  '#fff',
        logo:       name.split(' ').map(w => w[0]).join('').slice(0, 4).toUpperCase(),
        image,
        brand_code: g.brand_code,
        products,
      };
    });
  }, [apiGiftCards]);

  // Derive category list from whichever data source is active (API or fallback)
  // so the filter pills always match what's actually displayed.
  const giftCardCategories = useMemo(() => {
    const cats = new Set<string>();
    effectiveGiftCardBrands.forEach((b) => { if (b.category) cats.add(b.category); });
    return ['All', ...Array.from(cats)];
  }, [effectiveGiftCardBrands]);
  useEffect(() => {
    const heroTimer = setTimeout(() => setHeroLoaded(true), 100);
    return () => { clearTimeout(heroTimer); };
  }, []);

  // Cycle the floating marketing deal popups (ASOS, Nando's, etc.).
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

  const filteredGiftCardBrands = useMemo(() => {
    return effectiveGiftCardBrands.filter((b) => {
      const matchesSearch = b.name.toLowerCase().includes(gcSearch.toLowerCase());
      const matchesCategory = gcCategory === 'All' || b.category === gcCategory;
      return matchesSearch && matchesCategory;
    });
  }, [effectiveGiftCardBrands, gcSearch, gcCategory]);

  const groupedGiftCardBrands = useMemo(() => {
    if (gcCategory !== 'All') {
      return { [gcCategory]: filteredGiftCardBrands };
    }
    const groups: Record<string, GiftCardBrand[]> = {};
    filteredGiftCardBrands.forEach((b) => {
      if (!groups[b.category]) groups[b.category] = [];
      groups[b.category].push(b);
    });
    return groups;
  }, [filteredGiftCardBrands, gcCategory]);

  const filteredAirtimeProviders = useMemo(() => {
    return effectiveAirtimeProviders.filter((p) =>
      p.name.toLowerCase().includes(airSearch.toLowerCase())
    );
  }, [effectiveAirtimeProviders, airSearch]);

  return (
    <div className="bg-white min-h-screen relative">
      {/* ═══ GLOBAL ANIMATIONS ═══ */}
      <style>{`
        @keyframes dealPopIn {
          0% { opacity: 0; transform: scale(0.3) translateY(20px); }
          50% { opacity: 1; transform: scale(1.1) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes dealBounce {
          0%, 100% { transform: rotate(3deg) scale(1); }
          50% { transform: rotate(-2deg) scale(1.1); }
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes shimmerBar {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes brandSlideIn {
          0% { opacity: 0; transform: translateY(30px) scale(0.9); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes brandPulse {
          0%, 100% { box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
          50% { box-shadow: 0 8px 30px rgba(123,15,20,0.2); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes heroSlideUp {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-3deg); }
          75% { transform: rotate(3deg); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 5px rgba(218,165,32,0.3); }
          50% { box-shadow: 0 0 20px rgba(218,165,32,0.6); }
        }
        .animate-dealPopIn { animation: dealPopIn 0.5s ease-out forwards; opacity: 0; }
        .animate-dealBounce { animation: dealBounce 2s ease-in-out infinite; }
        .animate-ticker { animation: ticker 30s linear infinite; }
        .animate-shimmerBar { background-size: 200% 100%; animation: shimmerBar 2s linear infinite; }
        .animate-brandSlideIn { animation: brandSlideIn 0.5s ease-out forwards; opacity: 0; }
        .animate-brandPulse { animation: brandPulse 3s ease-in-out infinite; }
        .animate-floatSlow { animation: floatSlow 4s ease-in-out infinite; }
        .animate-sparkle { animation: sparkle 2s ease-in-out infinite; }
        .animate-heroSlideUp { animation: heroSlideUp 0.8s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.6s ease-out forwards; }
        .animate-wiggle { animation: wiggle 0.5s ease-in-out; }
        .animate-glowPulse { animation: glowPulse 2s ease-in-out infinite; }
        .brand-card-enter { animation: brandSlideIn 0.5s ease-out forwards; opacity: 0; }
        .deal-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmerBar 1.5s linear infinite;
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

      {/* ═══ HERO BANNER ═══ */}
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
                onClick={() => document.getElementById('brands-grid')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-[#DAA520] hover:bg-[#C4941A] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Explore Brands
              </button>
              <button
                onClick={() => { setOtherServicesTab('giftcard'); document.getElementById('brands-grid')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all border border-white/20"
              >
                Gift Cards & More
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

      {/* ═══ DEALS TICKER (marketing chrome) ═══ */}
      <DealsTicker />

      {/* ═══ EARN BANNER ═══ */}
      <div className="bg-gradient-to-r from-[#F4E6E6] via-white to-[#F4E6E6] py-4 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
          <div className="animate-glowPulse rounded-full">
            <GoldCoin size={32} />
          </div>
          <p className="text-[#7B0F14] font-bold text-base md:text-lg">
            Earn CashToken when your purchase hits £50. Enjoy!
          </p>
          <div className="hidden sm:flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#DAA520] animate-sparkle" style={{ animationDelay: `${i * 0.4}s` }} />
            ))}
          </div>
        </div>
      </div>

      {/* ─── Service catalog (live from middleware) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold text-[#DAA520] uppercase tracking-[0.2em] mb-1">Available in the UK</p>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Services</h2>
          </div>
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
              const ref   = (svc.serviceRef || svc.ref || '').toString();
              const name  = (svc.title || svc.name || ref || 'Service').toString();
              const isAirtime  = /airtime/i.test(ref) || /airtime/i.test(name);
              const isVoucher  = /voucher|gift/i.test(ref) || /voucher|gift/i.test(name);
              const accent     = colorFromName(ref || name);
              const onClick    = () => {
                if (isAirtime) {
                  setOtherServicesTab('credit');
                  document.getElementById('brands-grid')?.scrollIntoView({ behavior: 'smooth' });
                } else if (isVoucher) {
                  setOtherServicesTab('giftcard');
                  document.getElementById('brands-grid')?.scrollIntoView({ behavior: 'smooth' });
                }
              };
              return (
                <button
                  key={ref || i}
                  onClick={onClick}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="brands-grid">

        <div>
            {/* Sub-Tabs */}
            <div className="flex flex-wrap gap-3 mb-8">
              {[
                { key: 'giftcard' as OtherServicesTab, label: 'Gift Card', icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 12 20 22 4 22 4 12" />
                    <rect x="2" y="7" width="20" height="5" />
                    <line x1="12" y1="22" x2="12" y2="7" />
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                )},
                { key: 'credit' as OtherServicesTab, label: 'Credit', icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                )},
                { key: 'international' as OtherServicesTab, label: 'International Airtime', icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                )},
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setOtherServicesTab(tab.key)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 ${
                    otherServicesTab === tab.key
                      ? 'bg-gradient-to-r from-[#DAA520] to-[#C4941A] text-white shadow-lg shadow-[#DAA520]/25 scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-[#F4E6E6] hover:text-[#7B0F14]'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Gift Card */}
            {otherServicesTab === 'giftcard' && (
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Gift Cards</h2>
                <p className="text-gray-600 mb-6">Purchase gift cards from your favourite brands. Select a brand to choose an amount and proceed.</p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <div className="flex-1 relative group">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7B0F14] transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search brands"
                      value={gcSearch}
                      onChange={(e) => setGcSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-[#7B0F14] focus:ring-4 focus:ring-[#7B0F14]/10 outline-none transition-all text-sm bg-gray-50/50"
                    />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setGcDropdownOpen(!gcDropdownOpen)}
                      className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-gray-200 hover:border-[#7B0F14] transition-colors text-sm font-medium min-w-[160px] justify-between"
                    >
                      <span>{gcCategory === 'All' ? 'Categories' : gcCategory}</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`transition-transform ${gcDropdownOpen ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {gcDropdownOpen && (
                      <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden animate-scaleIn">
                        {giftCardCategories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => { setGcCategory(cat); setGcDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-[#F4E6E6] transition-colors ${
                              gcCategory === cat ? 'bg-[#F4E6E6] text-[#7B0F14] font-semibold' : 'text-gray-700'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {giftCardCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setGcCategory(cat)}
                      className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                        gcCategory === cat
                          ? 'bg-gradient-to-r from-[#7B0F14] to-[#A52228] text-white shadow-lg shadow-[#7B0F14]/25 scale-105'
                          : 'bg-gray-100 text-gray-600 hover:bg-[#F4E6E6] hover:text-[#7B0F14]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Loading skeleton */}
                {giftCardsLoading && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="rounded-3xl overflow-hidden bg-white animate-pulse" style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
                        <div className="h-28 bg-gray-200" />
                        <div className="p-3 pt-5 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Error */}
                {giftCardsError && !giftCardsLoading && (
                  <div className="text-center py-12">
                    <GoldCoin size={56} className="mx-auto mb-3 opacity-40" />
                    <p className="text-gray-700 font-semibold mb-1">Could not load gift cards</p>
                    <p className="text-gray-500 text-sm">Check your connection and try again.</p>
                  </div>
                )}

                {/* Real data */}
                {!giftCardsLoading && !giftCardsError && Object.entries(groupedGiftCardBrands).map(([category, categoryBrands], catIdx) => (
                  <div key={category} className="mb-10">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-[#7B0F14] to-[#DAA520]" />
                      <h2 className="text-xl font-black text-gray-900">{category}</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
                      {categoryBrands.map((brand, brandIdx) => (
                        <button
                          key={brand.id}
                          onClick={() => onSelectBrand(brand)}
                          className="brand-card-enter rounded-3xl overflow-hidden bg-white text-left group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
                          style={{
                            animationDelay: `${(catIdx * 0.2) + (brandIdx * 0.08)}s`,
                            boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                          }}
                        >
                          <div
                            className="h-28 flex items-center justify-center relative overflow-hidden"
                            style={{ backgroundColor: brand.image ? '#f3f4f6' : brand.color }}
                          >
                            {brand.image ? (
                              <img
                                src={brand.image}
                                alt={brand.name}
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <span className="text-xl font-bold group-hover:scale-110 transition-transform duration-300" style={{ color: brand.textColor }}>
                                {brand.logo}
                              </span>
                            )}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 group-hover:scale-125 transition-transform duration-300">
                              <GoldCoin size={28} />
                            </div>
                          </div>
                          <div className="p-3 pt-5">
                            <p className="text-[10px] text-gray-500 leading-tight">
                              Shop & stand a chance to win between <span className="text-[#7B0F14] font-semibold">£100 - £1,000,000</span>
                            </p>
                            <p className="font-semibold text-gray-900 text-sm mt-2">{brand.name}</p>
                            <p className="text-gray-500 text-xs">From {brand.price}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {filteredGiftCardBrands.length === 0 && (
                  <div className="text-center py-16">
                    <GoldCoin size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-gray-500 text-lg">No brands found matching your search.</p>
                    <button
                      onClick={() => { setGcSearch(''); setGcCategory('All'); }}
                      className="mt-4 text-[#7B0F14] font-semibold hover:underline"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Credit / Airtime */}
            {otherServicesTab === 'credit' && (
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Credit / Airtime</h2>
                <p className="text-gray-600 mb-6">Top up your mobile with any UK network provider. Select a provider to get started.</p>

                <div className="mb-8">
                  <div className="relative max-w-md group">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7B0F14] transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search providers"
                      value={airSearch}
                      onChange={(e) => setAirSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-[#7B0F14] focus:ring-4 focus:ring-[#7B0F14]/10 outline-none transition-all text-sm bg-gray-50/50"
                    />
                  </div>
                </div>

                {airtimeLoading && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="rounded-3xl overflow-hidden bg-white animate-pulse" style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.06)' }}>
                        <div className="h-28 bg-gray-200" />
                        <div className="p-3 pt-5 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {airtimeError && !airtimeLoading && (
                  <div className="text-center py-12">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-3 opacity-40">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                    <p className="text-gray-700 font-semibold mb-1">Could not load airtime providers</p>
                    <p className="text-gray-500 text-sm">Check your connection and try again.</p>
                  </div>
                )}

                {!airtimeLoading && !airtimeError && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
                    {filteredAirtimeProviders.map((provider, i) => (
                      <button
                        key={provider.id}
                        onClick={() => onSelectAirtime?.(provider)}
                        className="brand-card-enter rounded-3xl overflow-hidden bg-white text-left group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
                        style={{
                          animationDelay: `${i * 0.08}s`,
                          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                        }}
                      >
                        <div
                          className="h-28 flex items-center justify-center relative overflow-hidden"
                          style={{ backgroundColor: provider.color }}
                        >
                          <span className="text-xl font-bold group-hover:scale-110 transition-transform duration-300" style={{ color: provider.textColor }}>
                            {provider.logo}
                          </span>
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 group-hover:scale-125 transition-transform duration-300">
                            <div className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                <line x1="12" y1="18" x2="12.01" y2="18" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 pt-5">
                          <p className="font-semibold text-gray-900 text-sm">{provider.name}</p>
                          <p className="text-[10px] text-gray-500 mt-1">Tap to top up</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {filteredAirtimeProviders.length === 0 && (
                  <div className="text-center py-16">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-4 opacity-30">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                    <p className="text-gray-500 text-lg">No providers found matching your search.</p>
                    <button
                      onClick={() => setAirSearch('')}
                      className="mt-4 text-[#7B0F14] font-semibold hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* International Airtime */}
            {otherServicesTab === 'international' && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#F4E6E6] mb-6 animate-floatSlow">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-3">Coming Soon</h2>
                <p className="text-gray-500 text-lg max-w-md mx-auto">
                  International airtime top-up is coming soon. Stay tuned for updates!
                </p>
                <div className="mt-8 inline-flex items-center gap-2 bg-[#F4E6E6] px-6 py-3 rounded-2xl animate-glowPulse">
                  <GoldCoin size={20} />
                  <span className="text-[#7B0F14] font-semibold text-sm">We're working on bringing you global airtime coverage</span>
                </div>
              </div>
            )}
          </div>
      </div>

      {/* ═══ CTA BANNER ═══ */}
      <div className="bg-gradient-to-r from-[#7B0F14] via-[#A52228] to-[#7B0F14] py-10 px-4 relative overflow-hidden" ref={ctaSection.ref}>
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-60 h-60 rounded-full bg-white/5 translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-[#DAA520]/10 animate-floatSlow" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div
            className="inline-flex items-center gap-2 mb-4"
            style={{
              opacity: ctaSection.isVisible ? 1 : 0,
              transform: ctaSection.isVisible ? 'scale(1)' : 'scale(0.5)',
              transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s',
            }}
          >
            <GoldCoin size={28} />
            <GoldCoin size={22} />
            <GoldCoin size={16} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
            <span className="inline-block" style={{ opacity: ctaSection.isVisible ? 1 : 0, transform: ctaSection.isVisible ? 'translateX(0)' : 'translateX(-80px)', transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s' }}>Ready to</span>{' '}
            <span className="inline-block" style={{ opacity: ctaSection.isVisible ? 1 : 0, transform: ctaSection.isVisible ? 'translateX(0)' : 'translateX(80px)', transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.35s' }}>Start</span>{' '}
            <span className="inline-block text-[#DAA520]" style={{ opacity: ctaSection.isVisible ? 1 : 0, transform: ctaSection.isVisible ? 'translateX(0) scale(1)' : 'translateX(-60px) scale(0.85)', transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s' }}>Earning?</span>
          </h2>
          <p
            className="text-white/70 text-sm mb-6 max-w-md mx-auto"
            style={{
              opacity: ctaSection.isVisible ? 1 : 0,
              transform: ctaSection.isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.6s',
            }}
          >
            Every purchase counts. Shop with our partner brands and earn CashTokens that could be worth up to £1,000,000!
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-[#DAA520] hover:bg-[#C4941A] text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center gap-2"
            style={{
              opacity: ctaSection.isVisible ? 1 : 0,
              transform: ctaSection.isVisible ? 'translateY(0) scale(1)' : 'translateY(25px) scale(0.9)',
              transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.75s',
            }}
          >
            <span>Start Shopping Now</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
      </div>

    </div>
  );
};

export default UK_BrandsPage;