import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listServiceFieldOptions } from '@/lib/cashtokenApi';

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

// ─── Deals data ───
const hotDeals = [
  { brand: 'Nike UK', deal: '20% OFF Trainers', color: '#111', textColor: '#fff', logo: 'NIKE' },
  { brand: 'ASOS', deal: 'Buy 2 Get 1 Free', color: '#2D2D2D', textColor: '#fff', logo: 'ASOS' },
  { brand: "Nando's", deal: 'Free Starter with Main', color: '#E31837', textColor: '#fff', logo: "Nando's" },
  { brand: 'Deliveroo', deal: 'Free Delivery Today', color: '#00CCBC', textColor: '#fff', logo: 'deliveroo' },
  { brand: 'Temu', deal: 'Up to 90% OFF', color: '#FB6F20', textColor: '#fff', logo: 'Temu' },
  { brand: 'Costa Coffee', deal: 'Double Points Week', color: '#6B0F24', textColor: '#fff', logo: 'COSTA' },
  { brand: 'Primark', deal: 'New Season Sale', color: '#003DA5', textColor: '#fff', logo: 'PRIMARK' },
  { brand: 'Greggs', deal: '£1 Sausage Rolls', color: '#004B8D', textColor: '#FF6600', logo: 'GREGGS' },
  { brand: 'H&M', deal: '30% OFF Everything', color: '#E50010', textColor: '#fff', logo: 'H&M' },
  { brand: 'Uber Eats', deal: '£5 OFF First Order', color: '#142328', textColor: '#06C167', logo: 'UberEats' },
];

// ─── Affiliate Brands with website URLs ───
const affiliateBrands = [
  { id: 100, name: 'Temu', category: 'Lifestyle', color: '#FB6F20', textColor: '#fff', logo: 'Temu', website: 'https://www.temu.com', deal: 'Up to 90% OFF' },
  { id: 1, name: 'Adidas UK', category: 'Lifestyle', color: '#000', textColor: '#fff', logo: 'adidas', website: 'https://www.adidas.co.uk', deal: '25% OFF New Arrivals' },
  { id: 2, name: 'Nike UK', category: 'Lifestyle', color: '#111', textColor: '#fff', logo: 'NIKE', website: 'https://www.nike.com/gb', deal: '20% OFF Trainers' },
  { id: 3, name: 'ASOS', category: 'Lifestyle', color: '#2D2D2D', textColor: '#fff', logo: 'ASOS', website: 'https://www.asos.com', deal: 'Buy 2 Get 1 Free' },
  { id: 4, name: 'John Lewis', category: 'Lifestyle', color: '#004D3D', textColor: '#fff', logo: 'JL', website: 'https://www.johnlewis.com', deal: 'Price Match Promise' },
  { id: 5, name: 'Argos', category: 'Lifestyle', color: '#E00034', textColor: '#fff', logo: 'ARGOS', website: 'https://www.argos.co.uk', deal: 'Flash Sale Today' },
  { id: 6, name: 'Currys', category: 'Lifestyle', color: '#2F0A5B', textColor: '#fff', logo: 'CURRYS', website: 'https://www.currys.co.uk', deal: '£50 OFF Laptops' },
  { id: 7, name: "Nando's", category: 'Foodie', color: '#E31837', textColor: '#fff', logo: "Nando's", website: 'https://www.nandos.co.uk', deal: 'Free Starter' },
  { id: 8, name: 'Deliveroo', category: 'Foodie', color: '#00CCBC', textColor: '#fff', logo: 'deliveroo', website: 'https://deliveroo.co.uk', deal: 'Free Delivery' },
  { id: 9, name: 'Uber Eats', category: 'Foodie', color: '#142328', textColor: '#06C167', logo: 'UberEats', website: 'https://www.ubereats.com/gb', deal: '£5 OFF First Order' },
  { id: 10, name: 'Pizza Express', category: 'Foodie', color: '#003B5C', textColor: '#fff', logo: 'PE', website: 'https://www.pizzaexpress.com', deal: '2 for 1 Mains' },
  { id: 11, name: 'Costa Coffee', category: 'Foodie', color: '#6B0F24', textColor: '#fff', logo: 'COSTA', website: 'https://www.costa.co.uk', deal: 'Double Points' },
  { id: 12, name: 'Greggs', category: 'Foodie', color: '#004B8D', textColor: '#FF6600', logo: 'GREGGS', website: 'https://www.greggs.co.uk', deal: '£1 Sausage Rolls' },
  { id: 13, name: 'Zara UK', category: 'Fashion', color: '#000', textColor: '#fff', logo: 'ZARA', website: 'https://www.zara.com/uk', deal: 'New Collection' },
  { id: 14, name: 'H&M', category: 'Fashion', color: '#E50010', textColor: '#fff', logo: 'H&M', website: 'https://www2.hm.com/en_gb', deal: '30% OFF Everything' },
  { id: 15, name: 'Primark', category: 'Fashion', color: '#003DA5', textColor: '#fff', logo: 'PRIMARK', website: 'https://www.primark.com/en-gb', deal: 'New Season Sale' },
  { id: 16, name: 'Next UK', category: 'Fashion', color: '#333', textColor: '#fff', logo: 'NEXT', website: 'https://www.next.co.uk', deal: '15% OFF Online' },
  { id: 17, name: 'River Island', category: 'Fashion', color: '#000', textColor: '#fff', logo: 'RI', website: 'https://www.riverisland.com', deal: 'Student Discount' },
  { id: 18, name: 'Boohoo', category: 'Fashion', color: '#000', textColor: '#fff', logo: 'boohoo', website: 'https://www.boohoo.com', deal: '40% OFF Dresses' },
  { id: 19, name: 'Tesco', category: 'Groceries', color: '#00539F', textColor: '#E31837', logo: 'TESCO', website: 'https://www.tesco.com', deal: 'Clubcard Deals' },
  { id: 20, name: 'ASDA', category: 'Groceries', color: '#78BE20', textColor: '#fff', logo: 'ASDA', website: 'https://www.asda.com', deal: 'Rollback Prices' },
  { id: 21, name: "Sainsbury's", category: 'Groceries', color: '#F06C00', textColor: '#fff', logo: "Sainsbury's", website: 'https://www.sainsburys.co.uk', deal: 'Nectar Bonus' },
  { id: 22, name: 'Marks & Spencer', category: 'Groceries', color: '#000', textColor: '#DAA520', logo: 'M&S', website: 'https://www.marksandspencer.com', deal: 'Dine In for £12' },
  { id: 23, name: 'Waitrose', category: 'Groceries', color: '#004D3D', textColor: '#fff', logo: 'WAITROSE', website: 'https://www.waitrose.com', deal: '20% OFF Wine' },
  { id: 24, name: 'Lidl', category: 'Groceries', color: '#0050AA', textColor: '#FFF000', logo: 'LIDL', website: 'https://www.lidl.co.uk', deal: 'Middle Aisle Finds' },
];

// ─── Gift Card Brands ───
const giftCardBrands = [
  { id: 1, name: 'Adidas UK', category: 'Lifestyle', price: '£0.01', color: '#000', textColor: '#fff', logo: 'adidas' },
  { id: 2, name: 'Nike UK', category: 'Lifestyle', price: '£5.00', color: '#111', textColor: '#fff', logo: 'NIKE' },
  { id: 3, name: 'ASOS', category: 'Lifestyle', price: '£10.00', color: '#2D2D2D', textColor: '#fff', logo: 'ASOS' },
  { id: 4, name: 'John Lewis', category: 'Lifestyle', price: '£10.00', color: '#004D3D', textColor: '#fff', logo: 'JL' },
  { id: 5, name: 'Argos', category: 'Lifestyle', price: '£5.00', color: '#E00034', textColor: '#fff', logo: 'ARGOS' },
  { id: 6, name: 'Currys', category: 'Lifestyle', price: '£10.00', color: '#2F0A5B', textColor: '#fff', logo: 'CURRYS' },
  { id: 7, name: "Nando's", category: 'Foodie', price: '£10.00', color: '#E31837', textColor: '#fff', logo: "Nando's" },
  { id: 8, name: 'Deliveroo', category: 'Foodie', price: '£5.00', color: '#00CCBC', textColor: '#fff', logo: 'deliveroo' },
  { id: 9, name: 'Uber Eats', category: 'Foodie', price: '£10.00', color: '#142328', textColor: '#06C167', logo: 'UberEats' },
  { id: 10, name: 'Pizza Express', category: 'Foodie', price: '£10.00', color: '#003B5C', textColor: '#fff', logo: 'PE' },
  { id: 11, name: 'Costa Coffee', category: 'Foodie', price: '£5.00', color: '#6B0F24', textColor: '#fff', logo: 'COSTA' },
  { id: 12, name: 'Greggs', category: 'Foodie', price: '£2.00', color: '#004B8D', textColor: '#FF6600', logo: 'GREGGS' },
  { id: 13, name: 'Zara UK', category: 'Fashion', price: '£25.00', color: '#000', textColor: '#fff', logo: 'ZARA' },
  { id: 14, name: 'H&M', category: 'Fashion', price: '£5.00', color: '#E50010', textColor: '#fff', logo: 'H&M' },
  { id: 15, name: 'Primark', category: 'Fashion', price: '£5.00', color: '#003DA5', textColor: '#fff', logo: 'PRIMARK' },
  { id: 16, name: 'Next UK', category: 'Fashion', price: '£10.00', color: '#333', textColor: '#fff', logo: 'NEXT' },
  { id: 17, name: 'River Island', category: 'Fashion', price: '£10.00', color: '#000', textColor: '#fff', logo: 'RI' },
  { id: 18, name: 'Boohoo', category: 'Fashion', price: '£5.00', color: '#000', textColor: '#fff', logo: 'boohoo' },
  { id: 19, name: 'Tesco', category: 'Groceries', price: '£5.00', color: '#00539F', textColor: '#E31837', logo: 'TESCO' },
  { id: 20, name: 'ASDA', category: 'Groceries', price: '£5.00', color: '#78BE20', textColor: '#fff', logo: 'ASDA' },
  { id: 21, name: "Sainsbury's", category: 'Groceries', price: '£5.00', color: '#F06C00', textColor: '#fff', logo: "Sainsbury's" },
  { id: 22, name: 'Marks & Spencer', category: 'Groceries', price: '£10.00', color: '#000', textColor: '#DAA520', logo: 'M&S' },
  { id: 23, name: 'Waitrose', category: 'Groceries', price: '£10.00', color: '#004D3D', textColor: '#fff', logo: 'WAITROSE' },
  { id: 24, name: 'Lidl', category: 'Groceries', price: '£5.00', color: '#0050AA', textColor: '#FFF000', logo: 'LIDL' },
];

// ─── Airtime Providers ───
// Fetched live from /api/countries/gb/services/airtime/fields/provider.code/options.json
// (same source as UK_BrandsPage). provider.id carries the real provider.code.
type AirtimeProvider = {
  id: string;       // provider.code value (e.g. "9457:67")
  name: string;     // description
  color: string;
  textColor: string;
  logo: string;
  icon?: string;    // raw icon key from API
};

// Deterministic colour from provider name so the same provider always looks the
// same across renders, without a hand-curated lookup table.
const AIRTIME_PALETTE = ['#1F2937', '#7C2D12', '#1E40AF', '#831843', '#365314', '#0E7490', '#7C3AED', '#9A3412', '#0F766E', '#5B21B6'];
function colorFromName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AIRTIME_PALETTE[Math.abs(h) % AIRTIME_PALETTE.length];
}

const categories = ['All', 'Lifestyle', 'Foodie', 'Fashion', 'Groceries', 'Other Services'];

type OtherServicesTab = 'giftcard' | 'credit' | 'international';

// ─── Deal Popup Component ───
const DealPopup: React.FC<{ deal: typeof hotDeals[0]; index: number; onClose: () => void }> = ({ deal, index, onClose }) => {
  const positions = [
    'top-20 right-4', 'top-40 left-4', 'top-60 right-8', 'bottom-40 left-8',
    'top-32 right-12', 'bottom-60 right-4', 'top-48 left-12', 'bottom-32 left-4',
    'top-24 left-20', 'bottom-48 right-16'
  ];
  return (
    <div
      className={`fixed z-50 ${positions[index % positions.length]} animate-dealPopIn`}
      style={{ animationDelay: `${index * 0.3}s` }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 max-w-[200px] relative overflow-hidden">
        <button onClick={onClose} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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

// ─── Scrolling Deals Ticker ───
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

// ─── Floating Deal Badge on Brand Card ───
const DealBadge: React.FC<{ deal: string; visible: boolean }> = ({ deal, visible }) => {
  if (!visible) return null;
  return (
    <div className="absolute -top-1 -right-1 z-10 animate-dealBounce">
      <div className="bg-[#DAA520] text-white text-[8px] font-bold px-2 py-1 rounded-lg shadow-lg whitespace-nowrap transform rotate-3">
        {deal}
      </div>
    </div>
  );
};

const BrandsPage: React.FC<BrandsPageProps> = ({ onSelectBrand, onSelectAirtime, onBack }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [otherServicesTab, setOtherServicesTab] = useState<OtherServicesTab>('giftcard');
  const [gcSearch, setGcSearch] = useState('');
  const [gcCategory, setGcCategory] = useState('All');
  const [gcDropdownOpen, setGcDropdownOpen] = useState(false);
  const [airSearch, setAirSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showDeals, setShowDeals] = useState<number[]>([]);
  const [activeDealPopups, setActiveDealPopups] = useState<number[]>([]);
  const [hoveredBrand, setHoveredBrand] = useState<number | null>(null);

  const giftCardCategories = ['All', 'Lifestyle', 'Foodie', 'Fashion', 'Groceries'];
  const isOtherServices = activeCategory === 'Other Services';

  // Fetch the real airtime provider list. No fallback — the UI shows
  // loading/error/empty states explicitly.
  const {
    data: apiAirtime,
    isLoading: airtimeLoading,
    isError:   airtimeError,
  } = useQuery({
    queryKey: ['airtime-providers', 'gb'],
    queryFn: () => listServiceFieldOptions({
      country: 'gb',
      service: 'airtime',
      field:   'provider.code',
    }),
    staleTime: 10 * 60_000,
    retry: 1,
  });

  // Entrance animation
  useEffect(() => {
    setMounted(true);
    // Stagger deal badge reveals
    const timers: NodeJS.Timeout[] = [];
    affiliateBrands.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setShowDeals(prev => [...prev, i]);
      }, 800 + i * 120));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  // Cycling deal popups
  useEffect(() => {
    let popupIndex = 0;
    const interval = setInterval(() => {
      setActiveDealPopups(prev => {
        const next = [...prev, popupIndex % hotDeals.length];
        if (next.length > 3) next.shift();
        return next;
      });
      popupIndex++;
    }, 3000);
    // Show first popup after 2s
    const firstTimer = setTimeout(() => {
      setActiveDealPopups([0]);
    }, 2000);
    return () => { clearInterval(interval); clearTimeout(firstTimer); };
  }, []);

  const closeDealPopup = (idx: number) => {
    setActiveDealPopups(prev => prev.filter(i => i !== idx));
  };

  // ─── Filtering ───
  const filteredAffiliateBrands = useMemo(() => {
    return affiliateBrands.filter((b) => {
      const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'All' || b.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const groupedAffiliateBrands = useMemo(() => {
    if (activeCategory !== 'All') {
      return { [activeCategory]: filteredAffiliateBrands };
    }
    const groups: Record<string, typeof affiliateBrands> = {};
    filteredAffiliateBrands.forEach((b) => {
      if (!groups[b.category]) groups[b.category] = [];
      groups[b.category].push(b);
    });
    return groups;
  }, [filteredAffiliateBrands, activeCategory]);

  const filteredGiftCardBrands = useMemo(() => {
    return giftCardBrands.filter((b) => {
      const matchesSearch = b.name.toLowerCase().includes(gcSearch.toLowerCase());
      const matchesCategory = gcCategory === 'All' || b.category === gcCategory;
      return matchesSearch && matchesCategory;
    });
  }, [gcSearch, gcCategory]);

  const groupedGiftCardBrands = useMemo(() => {
    if (gcCategory !== 'All') {
      return { [gcCategory]: filteredGiftCardBrands };
    }
    const groups: Record<string, typeof giftCardBrands> = {};
    filteredGiftCardBrands.forEach((b) => {
      if (!groups[b.category]) groups[b.category] = [];
      groups[b.category].push(b);
    });
    return groups;
  }, [filteredGiftCardBrands, gcCategory]);

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

      {/* ═══ DEAL POPUPS (floating) ═══ */}
      {activeDealPopups.map((dealIdx) => (
        <DealPopup key={`popup-${dealIdx}`} deal={hotDeals[dealIdx]} index={dealIdx} onClose={() => closeDealPopup(dealIdx)} />
      ))}

      {/* Back Button */}
      {onBack && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-[#7B0F14] transition-colors group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:-translate-x-1 transition-transform"><polyline points="15 18 9 12 15 6" /></svg>
            <span className="text-sm font-medium">Back to Home</span>
          </button>
        </div>
      )}

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
              <span className="text-white/90 text-xs font-medium">Earn CashTokens on every purchase</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white mb-3 leading-tight">
              Shop. Earn. <span className="text-[#DAA520]">Win Big.</span>
            </h1>
            <p className="text-white/80 text-sm md:text-base mb-6 max-w-md">
              Discover amazing deals from 24+ top UK brands. Every purchase over £50 earns you CashTokens worth up to £1,000,000!
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { setActiveCategory('All'); document.getElementById('brands-grid')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="bg-[#DAA520] hover:bg-[#C4941A] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Explore Brands
              </button>
              <button
                onClick={() => setActiveCategory('Other Services')}
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

      {/* ═══ DEALS TICKER ═══ */}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="brands-grid">

        {/* Search bar */}
        {!isOtherServices && (
          <div className={`flex flex-col sm:flex-row gap-4 mb-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex-1 relative group">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7B0F14] transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search brands, deals, categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-[#7B0F14] focus:ring-4 focus:ring-[#7B0F14]/10 outline-none transition-all text-sm bg-gray-50/50 hover:bg-white"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-gray-200 hover:border-[#7B0F14] transition-all text-sm font-medium min-w-[160px] justify-between bg-gray-50/50 hover:bg-white"
              >
                <span>{activeCategory === 'All' ? 'Categories' : activeCategory}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {dropdownOpen && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden animate-scaleIn">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setActiveCategory(cat); setDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-[#F4E6E6] transition-colors ${
                        activeCategory === cat ? 'bg-[#F4E6E6] text-[#7B0F14] font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Category pills with animation */}
        <div className={`flex flex-wrap gap-2 mb-8 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {categories.map((cat, i) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeCategory === cat
                  ? 'bg-gradient-to-r from-[#7B0F14] to-[#A52228] text-white shadow-lg shadow-[#7B0F14]/25 scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-[#F4E6E6] hover:text-[#7B0F14] hover:scale-105'
              }`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ═══ AFFILIATE BRANDS ═══ */}
        {!isOtherServices && (
          <div>
            {Object.entries(groupedAffiliateBrands).map(([category, categoryBrands], catIdx) => (
              <div key={category} className="mb-12">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 rounded-full bg-gradient-to-b from-[#7B0F14] to-[#DAA520]" />
                    <h2 className="text-2xl font-black text-gray-900">{category}</h2>
                    <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{categoryBrands.length} brands</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#DAA520]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span className="text-xs font-bold">Hot Deals</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
                  {categoryBrands.map((brand, brandIdx) => {
                    const globalIdx = affiliateBrands.findIndex(b => b.id === brand.id);
                    const showDeal = showDeals.includes(globalIdx);
                    const isHovered = hoveredBrand === brand.id;
                    return (
                      <a
                        key={brand.id}
                        href={brand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="brand-card-enter rounded-3xl overflow-hidden bg-white text-left group block relative"
                        style={{
                          animationDelay: `${(catIdx * 0.2) + (brandIdx * 0.08)}s`,
                          boxShadow: isHovered ? '0 12px 40px rgba(123,15,20,0.2)' : '0 4px 15px rgba(0,0,0,0.08)',
                          transform: isHovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                        onMouseEnter={() => setHoveredBrand(brand.id)}
                        onMouseLeave={() => setHoveredBrand(null)}
                      >
                        {/* Deal badge */}
                        <DealBadge deal={brand.deal} visible={showDeal} />

                        {/* Brand header */}
                        <div
                          className="h-28 flex items-center justify-center relative overflow-hidden"
                          style={{ backgroundColor: brand.color }}
                        >
                          {/* Shimmer effect on hover */}
                          {isHovered && <div className="absolute inset-0 deal-shimmer" />}

                          {/* Animated logo */}
                          <span
                            className={`text-2xl font-black transition-all duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}
                            style={{ color: brand.textColor }}
                          >
                            {brand.logo}
                          </span>

                          {/* Sparkle particles */}
                          {isHovered && (
                            <>
                              <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-white/60 animate-sparkle" style={{ animationDelay: '0s' }} />
                              <div className="absolute top-5 right-5 w-1.5 h-1.5 rounded-full bg-white/40 animate-sparkle" style={{ animationDelay: '0.3s' }} />
                              <div className="absolute bottom-4 left-6 w-1 h-1 rounded-full bg-white/50 animate-sparkle" style={{ animationDelay: '0.6s' }} />
                            </>
                          )}

                          {/* Gold coin badge */}
                          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 transition-transform duration-300 ${isHovered ? 'scale-125' : 'scale-100'}`}>
                            <GoldCoin size={28} />
                          </div>
                        </div>

                        {/* Brand info */}
                        <div className="p-3 pt-5">
                          <p className="text-[10px] text-gray-500 leading-tight">
                            Shop & stand a chance to win between <span className="text-[#7B0F14] font-semibold">£100 - £1,000,000</span>
                          </p>
                          {/* Deal text */}
                          <div className="mt-1.5 flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-green-600">{brand.deal}</span>
                          </div>
                          {/* External link */}
                          <div className={`flex items-center gap-1 mt-2 transition-all duration-300 ${isHovered ? 'translate-x-1' : ''}`}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            <span className="text-[10px] text-[#7B0F14] font-semibold">Visit & Earn</span>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* ═══ HAPPY SHOPPERS SECTION ═══ */}
            <div className="mb-12 bg-gradient-to-br from-[#F4E6E6] via-white to-[#FEF9C3] rounded-3xl p-6 md:p-10 overflow-hidden relative">
              {/* Decorative elements */}
              <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-[#DAA520]/10 animate-floatSlow" />
              <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-[#7B0F14]/10 animate-floatSlow" style={{ animationDelay: '1s' }} />

              <div className="text-center mb-8 relative z-10">
                <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-1.5 mb-3 shadow-sm">
                  <GoldCoin size={16} />
                  <span className="text-[#7B0F14] text-xs font-bold">Real People, Real Rewards</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">Join Thousands of Happy Shoppers</h2>
                <p className="text-gray-500 text-sm max-w-lg mx-auto">Our community earns CashTokens every day. Shop your favourite brands and get rewarded!</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
                {shopperImages.map((img, i) => (
                  <div
                    key={i}
                    className="relative rounded-2xl overflow-hidden shadow-lg group cursor-pointer animate-scaleIn"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  >
                    <img src={img} alt={`Happy shopper ${i + 1}`} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <div className="flex items-center gap-1.5">
                        <GoldCoin size={14} />
                        <span className="text-white text-xs font-bold">Earned £{(Math.random() * 500 + 50).toFixed(0)}</span>
                      </div>
                    </div>
                    {/* Floating badge */}
                    <div className="absolute top-2 right-2">
                      <div className={`w-6 h-6 rounded-full bg-[#DAA520] flex items-center justify-center shadow-lg ${i % 2 === 0 ? 'animate-floatSlow' : ''}`} style={{ animationDelay: `${i * 0.5}s` }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats bar */}
              <div className="flex flex-wrap justify-center gap-6 md:gap-12 mt-8 relative z-10">
                {[
                  { label: 'Active Shoppers', value: '125K+' },
                  { label: 'CashTokens Earned', value: '£2.4M+' },
                  { label: 'Partner Brands', value: '24+' },
                  { label: 'Happy Winners', value: '8,500+' },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-xl md:text-2xl font-black text-[#7B0F14]">{stat.value}</p>
                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {filteredAffiliateBrands.length === 0 && (
              <div className="text-center py-16">
                <GoldCoin size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-gray-500 text-lg">No brands found matching your search.</p>
                <button
                  onClick={() => { setSearch(''); setActiveCategory('All'); }}
                  className="mt-4 text-[#7B0F14] font-semibold hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ OTHER SERVICES ═══ */}
        {isOtherServices && (
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

                {Object.entries(groupedGiftCardBrands).map(([category, categoryBrands], catIdx) => (
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
                            style={{ backgroundColor: brand.color }}
                          >
                            <span className="text-xl font-bold group-hover:scale-110 transition-transform duration-300" style={{ color: brand.textColor }}>
                              {brand.logo}
                            </span>
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

                {!airtimeLoading && !airtimeError && filteredAirtimeProviders.length === 0 && (
                  <div className="text-center py-16">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-4 opacity-30">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                    <p className="text-gray-500 text-lg">
                      {airSearch ? 'No providers found matching your search.' : 'No airtime providers are available right now.'}
                    </p>
                    {airSearch && (
                      <button
                        onClick={() => setAirSearch('')}
                        className="mt-4 text-[#7B0F14] font-semibold hover:underline"
                      >
                        Clear search
                      </button>
                    )}
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
        )}
      </div>

      {/* ═══ BRANDS CLOSE TO YOU ═══ */}
      <div className="bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-[#F4E6E6] rounded-full px-4 py-1.5 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="2" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-[#7B0F14] text-xs font-bold">Near You</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-2">Brands Close to You</h2>
            <p className="text-gray-500 text-sm">Discover CashToken partner brands near popular UK locations</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[
              { location: 'London - Oxford Street', brands: ['Adidas UK', 'Nike UK', 'Zara UK', 'H&M'], color: '#7B0F14' },
              { location: 'Manchester - Arndale', brands: ['ASOS', 'Primark', 'River Island', 'Boohoo'], color: '#DAA520' },
              { location: 'Birmingham - Bullring', brands: ['John Lewis', 'Next UK', 'Currys', 'Argos'], color: '#3D0C0E' },
              { location: 'Leeds - Trinity', brands: ['Tesco', 'ASDA', "Sainsbury's", 'M&S'], color: '#7B0F14' },
              { location: 'Edinburgh - Princes St', brands: ['Waitrose', 'Lidl', 'Costa Coffee', 'Greggs'], color: '#DAA520' },
              { location: 'Liverpool - Liverpool ONE', brands: ['Deliveroo', 'Uber Eats', "Nando's", 'Pizza Express'], color: '#3D0C0E' },
              { location: 'Bristol - Cabot Circus', brands: ['Nike UK', 'ASOS', 'H&M', 'Primark'], color: '#7B0F14' },
              { location: 'Glasgow - Buchanan St', brands: ['Adidas UK', 'Zara UK', 'Next UK', 'Currys'], color: '#DAA520' },
              { location: 'Cardiff - St David\'s', brands: ['Tesco', 'ASDA', 'John Lewis', 'Argos'], color: '#3D0C0E' },
              { location: 'Nottingham - Victoria', brands: ['Costa Coffee', 'Greggs', 'Deliveroo', 'Boohoo'], color: '#7B0F14' },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group brand-card-enter"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="h-2 group-hover:h-3 transition-all duration-300" style={{ backgroundColor: item.color }} />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2" strokeLinecap="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <p className="font-bold text-sm text-gray-900">{item.location}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.brands.map((brand, j) => (
                      <span key={j} className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-[#F4E6E6] text-[#7B0F14] hover:bg-[#7B0F14] hover:text-white transition-colors cursor-pointer">{brand}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CTA BANNER ═══ */}
      <div className="bg-gradient-to-r from-[#7B0F14] via-[#A52228] to-[#7B0F14] py-10 px-4 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-60 h-60 rounded-full bg-white/5 translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-[#DAA520]/10 animate-floatSlow" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <GoldCoin size={28} />
            <GoldCoin size={22} />
            <GoldCoin size={16} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Ready to Start Earning?</h2>
          <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
            Every purchase counts. Shop with our partner brands and earn CashTokens that could be worth up to £1,000,000!
          </p>
          <button
            onClick={() => { setActiveCategory('All'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="bg-[#DAA520] hover:bg-[#C4941A] text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            <span>Start Shopping Now</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandsPage;
