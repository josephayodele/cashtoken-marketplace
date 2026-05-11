import React, { useState, useMemo, useEffect, useRef } from 'react';
import GoldCoin from './GoldCoin';

interface MarketplacePageProps {
  onBack?: () => void;
  onViewBrands?: () => void;
  walletBalance?: number;
  userName?: string;
}

// ─── Categories ───
const categories = [
  { id: 'all',          name: 'All',                icon: 'grid' },
  { id: 'electronics',  name: 'Electronics',        icon: 'cpu' },
  { id: 'fashion',      name: 'Fashion & Beauty',   icon: 'shirt' },
  { id: 'home',         name: 'Home & Garden',      icon: 'home' },
  { id: 'sports',       name: 'Sports & Outdoors',  icon: 'activity' },
  { id: 'books',        name: 'Books & Media',      icon: 'book' },
  { id: 'wellness',     name: 'Health & Wellness',  icon: 'heart' },
  { id: 'kids',         name: 'Kids & Toys',        icon: 'gift' },
];

const CategoryIcon: React.FC<{ name: string; size?: number; color?: string }> = ({ name, size = 22, color = 'currentColor' }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'cpu':       return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/><line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="14" x2="22" y2="14"/><line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="14" x2="4" y2="14"/></svg>;
    case 'shirt':     return <svg {...common}><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>;
    case 'home':      return <svg {...common}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
    case 'activity':  return <svg {...common}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
    case 'book':      return <svg {...common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
    case 'heart':     return <svg {...common}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
    case 'gift':      return <svg {...common}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
    case 'grid':
    default:          return <svg {...common}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
  }
};

// ─── Vendors ───
const vendors = [
  { id: 'v1', name: 'London Tech Hub',       location: 'London',     rating: 4.9, sales: '12.4k', color: '#1E3A8A' },
  { id: 'v2', name: 'Manchester Crafts Co.', location: 'Manchester', rating: 4.8, sales: '8.2k',  color: '#7B0F14' },
  { id: 'v3', name: 'Edinburgh Wellness',    location: 'Edinburgh',  location_short: 'EDI', rating: 4.9, sales: '6.7k',  color: '#059669' },
  { id: 'v4', name: 'Brighton Boutique',     location: 'Brighton',   rating: 4.7, sales: '5.1k',  color: '#DB2777' },
  { id: 'v5', name: 'Cardiff Homewares',     location: 'Cardiff',    rating: 4.8, sales: '4.3k',  color: '#92400E' },
  { id: 'v6', name: 'Bristol Bookshop',      location: 'Bristol',    rating: 4.9, sales: '3.9k',  color: '#4338CA' },
];

// ─── Products ───
type Product = {
  id: number;
  name: string;
  vendor: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  badge?: 'Bestseller' | 'New' | 'Limited' | 'Trending';
  gradientFrom: string;
  gradientTo: string;
  emoji: string;
  cashback: number;
};

const products: Product[] = [
  // Electronics
  { id: 1,  name: 'Wireless Pro Earbuds',         vendor: 'London Tech Hub',       category: 'electronics', price: 89.99,  originalPrice: 129.99, rating: 4.8, reviews: 1284, badge: 'Bestseller', gradientFrom: '#1E3A8A', gradientTo: '#3B82F6', emoji: '◯', cashback: 4.5 },
  { id: 2,  name: 'Smart Fitness Watch X3',       vendor: 'London Tech Hub',       category: 'electronics', price: 149.00, originalPrice: 199.00, rating: 4.7, reviews: 856,  badge: 'Trending',   gradientFrom: '#0F172A', gradientTo: '#334155', emoji: '⌚', cashback: 7.5 },
  { id: 3,  name: 'Portable Bluetooth Speaker',   vendor: 'London Tech Hub',       category: 'electronics', price: 45.50,                          rating: 4.6, reviews: 412,                       gradientFrom: '#7C2D12', gradientTo: '#EA580C', emoji: '♪', cashback: 2.3 },
  { id: 4,  name: '4K Action Camera',             vendor: 'London Tech Hub',       category: 'electronics', price: 219.00, originalPrice: 279.00, rating: 4.9, reviews: 2103, badge: 'Bestseller', gradientFrom: '#1F2937', gradientTo: '#4B5563', emoji: '📷', cashback: 11 },
  { id: 5,  name: 'Mechanical Keyboard RGB',      vendor: 'London Tech Hub',       category: 'electronics', price: 79.99,                          rating: 4.7, reviews: 633,  badge: 'New',        gradientFrom: '#312E81', gradientTo: '#6D28D9', emoji: '⌨', cashback: 4 },

  // Fashion
  { id: 6,  name: 'Wool Blend Overcoat',          vendor: 'Brighton Boutique',     category: 'fashion',     price: 159.00, originalPrice: 220.00, rating: 4.8, reviews: 287,  badge: 'Trending',   gradientFrom: '#78350F', gradientTo: '#B45309', emoji: '🧥', cashback: 8 },
  { id: 7,  name: 'Vegan Leather Crossbody',      vendor: 'Brighton Boutique',     category: 'fashion',     price: 64.00,                          rating: 4.7, reviews: 198,                       gradientFrom: '#9D174D', gradientTo: '#DB2777', emoji: '👜', cashback: 3.2 },
  { id: 8,  name: 'Organic Cotton Hoodie',        vendor: 'Brighton Boutique',     category: 'fashion',     price: 42.00,  originalPrice: 60.00,  rating: 4.6, reviews: 524,                       gradientFrom: '#365314', gradientTo: '#65A30D', emoji: '👕', cashback: 2.1 },
  { id: 9,  name: 'Silk Scarf — Hand Painted',    vendor: 'Brighton Boutique',     category: 'fashion',     price: 38.00,                          rating: 4.9, reviews: 92,   badge: 'Limited',    gradientFrom: '#831843', gradientTo: '#BE185D', emoji: '🪡', cashback: 1.9 },
  { id: 10, name: 'Rose Gold Earrings',           vendor: 'Brighton Boutique',     category: 'fashion',     price: 28.50,                          rating: 4.8, reviews: 341,                       gradientFrom: '#9F1239', gradientTo: '#F43F5E', emoji: '✦', cashback: 1.4 },

  // Home & Garden
  { id: 11, name: 'Handwoven Throw Blanket',      vendor: 'Cardiff Homewares',     category: 'home',        price: 55.00,  originalPrice: 75.00,  rating: 4.9, reviews: 467,  badge: 'Bestseller', gradientFrom: '#9A3412', gradientTo: '#F97316', emoji: '🧵', cashback: 2.8 },
  { id: 12, name: 'Ceramic Plant Pot Set',        vendor: 'Cardiff Homewares',     category: 'home',        price: 32.00,                          rating: 4.7, reviews: 215,                       gradientFrom: '#365314', gradientTo: '#84CC16', emoji: '🪴', cashback: 1.6 },
  { id: 13, name: 'Aromatherapy Diffuser',        vendor: 'Cardiff Homewares',     category: 'home',        price: 39.99,                          rating: 4.8, reviews: 612,  badge: 'Trending',   gradientFrom: '#155E75', gradientTo: '#06B6D4', emoji: '✿', cashback: 2 },
  { id: 14, name: 'Cast Iron Skillet 28cm',       vendor: 'Cardiff Homewares',     category: 'home',        price: 48.00,                          rating: 4.9, reviews: 1102, badge: 'Bestseller', gradientFrom: '#1C1917', gradientTo: '#44403C', emoji: '◐', cashback: 2.4 },
  { id: 15, name: 'Linen Bedding Set Queen',      vendor: 'Cardiff Homewares',     category: 'home',        price: 89.00,  originalPrice: 120.00, rating: 4.7, reviews: 178,                       gradientFrom: '#374151', gradientTo: '#9CA3AF', emoji: '◇', cashback: 4.5 },

  // Sports
  { id: 16, name: 'Yoga Mat Pro Grip',            vendor: 'Manchester Crafts Co.', category: 'sports',      price: 34.99,                          rating: 4.8, reviews: 893,                       gradientFrom: '#0E7490', gradientTo: '#22D3EE', emoji: '◭', cashback: 1.75 },
  { id: 17, name: 'Running Shoes Lightweight',    vendor: 'Manchester Crafts Co.', category: 'sports',      price: 95.00,  originalPrice: 130.00, rating: 4.7, reviews: 421,  badge: 'New',        gradientFrom: '#7F1D1D', gradientTo: '#DC2626', emoji: '👟', cashback: 4.75 },
  { id: 18, name: 'Resistance Bands Set',         vendor: 'Manchester Crafts Co.', category: 'sports',      price: 19.99,                          rating: 4.6, reviews: 256,                       gradientFrom: '#15803D', gradientTo: '#22C55E', emoji: '∞', cashback: 1 },
  { id: 19, name: 'Insulated Water Bottle 1L',    vendor: 'Manchester Crafts Co.', category: 'sports',      price: 24.50,                          rating: 4.9, reviews: 1547, badge: 'Bestseller', gradientFrom: '#0C4A6E', gradientTo: '#0EA5E9', emoji: '◔', cashback: 1.2 },

  // Books
  { id: 20, name: 'The Modern Designer (hardback)', vendor: 'Bristol Bookshop',    category: 'books',       price: 22.00,                          rating: 4.9, reviews: 134,  badge: 'Trending',   gradientFrom: '#3F3F46', gradientTo: '#71717A', emoji: '📖', cashback: 1.1 },
  { id: 21, name: 'Cookbook: British Classics',   vendor: 'Bristol Bookshop',     category: 'books',       price: 18.50,  originalPrice: 25.00,  rating: 4.8, reviews: 209,                       gradientFrom: '#7C2D12', gradientTo: '#C2410C', emoji: '🍴', cashback: 0.9 },
  { id: 22, name: 'Vinyl Record — Indie Mix',     vendor: 'Bristol Bookshop',     category: 'books',       price: 28.00,                          rating: 4.7, reviews: 87,   badge: 'Limited',    gradientFrom: '#1E1B4B', gradientTo: '#4338CA', emoji: '◉', cashback: 1.4 },

  // Wellness
  { id: 23, name: 'Organic Skincare Bundle',      vendor: 'Edinburgh Wellness',    category: 'wellness',    price: 65.00,  originalPrice: 89.00,  rating: 4.9, reviews: 712,  badge: 'Bestseller', gradientFrom: '#064E3B', gradientTo: '#10B981', emoji: '✦', cashback: 3.25 },
  { id: 24, name: 'Vitamin D + K2 (90 caps)',     vendor: 'Edinburgh Wellness',    category: 'wellness',    price: 21.00,                          rating: 4.8, reviews: 384,                       gradientFrom: '#92400E', gradientTo: '#F59E0B', emoji: '◯', cashback: 1.05 },
  { id: 25, name: 'Herbal Tea Sampler 12pk',      vendor: 'Edinburgh Wellness',    category: 'wellness',    price: 16.50,                          rating: 4.7, reviews: 198,                       gradientFrom: '#3F6212', gradientTo: '#84CC16', emoji: '☘', cashback: 0.8 },

  // Kids
  { id: 26, name: 'Wooden Building Blocks',       vendor: 'Manchester Crafts Co.', category: 'kids',        price: 32.00,                          rating: 4.9, reviews: 567,  badge: 'Bestseller', gradientFrom: '#A16207', gradientTo: '#EAB308', emoji: '◧', cashback: 1.6 },
  { id: 27, name: 'Plush Bear — Hand-stitched',   vendor: 'Manchester Crafts Co.', category: 'kids',        price: 24.00,                          rating: 4.8, reviews: 142,                       gradientFrom: '#9A3412', gradientTo: '#FB923C', emoji: '🧸', cashback: 1.2 },
  { id: 28, name: 'Picture Book — Sleepy Stars',  vendor: 'Bristol Bookshop',     category: 'kids',        price: 12.99,                          rating: 4.9, reviews: 89,   badge: 'New',        gradientFrom: '#1E40AF', gradientTo: '#60A5FA', emoji: '★', cashback: 0.65 },
];

const sortOptions = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'rating', label: 'Top Rated' },
  { id: 'newest', label: 'Newest' },
];

// ─── Stars helper ───
const Stars: React.FC<{ rating: number; size?: number }> = ({ rating, size = 12 }) => (
  <div className="inline-flex items-center gap-0.5">
    {[0, 1, 2, 3, 4].map((i) => {
      const filled = rating >= i + 1;
      const half = !filled && rating > i;
      return (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#DAA520' : half ? 'url(#half)' : 'none'} stroke="#DAA520" strokeWidth="1.5">
          {half && (
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor="#DAA520" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
          )}
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    })}
  </div>
);

const BadgePill: React.FC<{ kind?: Product['badge'] }> = ({ kind }) => {
  if (!kind) return null;
  const styles: Record<NonNullable<Product['badge']>, { bg: string; text: string }> = {
    'Bestseller': { bg: '#7B0F14', text: '#fff' },
    'New':        { bg: '#059669', text: '#fff' },
    'Limited':    { bg: '#DAA520', text: '#fff' },
    'Trending':   { bg: '#1E40AF', text: '#fff' },
  };
  const s = styles[kind];
  return (
    <span
      className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-sm"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {kind}
    </span>
  );
};

// ─── Toast ───
const Toast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => (
  <div
    className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
    }`}
  >
    <div className="bg-[#7B0F14] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-medium">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {message}
    </div>
  </div>
);

const UK_MarketplacePage: React.FC<MarketplacePageProps> = ({ onBack, onViewBrands, walletBalance = 0, userName }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [sortOpen, setSortOpen] = useState(false);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const [mounted, setMounted] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const showToast = (message: string) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  };

  // ─── Filtering & sorting ───
  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.vendor.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
    switch (sortBy) {
      case 'price-asc':  list = [...list].sort((a, b) => a.price - b.price); break;
      case 'price-desc': list = [...list].sort((a, b) => b.price - a.price); break;
      case 'rating':     list = [...list].sort((a, b) => b.rating - a.rating); break;
      case 'newest':     list = [...list].reverse(); break;
    }
    return list;
  }, [activeCategory, search, sortBy]);

  // ─── Cart helpers ───
  const cartItemCount = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);
  const cartItems = useMemo(
    () => Object.entries(cart).map(([id, qty]) => ({ product: products.find((p) => p.id === Number(id))!, qty })).filter((x) => x.product),
    [cart]
  );
  const cartTotal = useMemo(() => cartItems.reduce((sum, i) => sum + i.product.price * i.qty, 0), [cartItems]);
  const cartCashback = useMemo(() => cartItems.reduce((sum, i) => sum + i.product.cashback * i.qty, 0), [cartItems]);

  const addToCart = (id: number, name: string) => {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
    showToast(`Added — ${name}`);
  };
  const decreaseQty = (id: number) => {
    setCart((c) => {
      const next = { ...c };
      if ((next[id] || 0) <= 1) delete next[id];
      else next[id] -= 1;
      return next;
    });
  };
  const increaseQty = (id: number) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const removeFromCart = (id: number) => setCart((c) => { const n = { ...c }; delete n[id]; return n; });

  const toggleWishlist = (id: number, name: string) => {
    setWishlist((w) => {
      const next = new Set(w);
      if (next.has(id)) { next.delete(id); showToast(`Removed — ${name}`); }
      else              { next.add(id);    showToast(`Saved — ${name}`); }
      return next;
    });
  };

  const handleCheckout = () => {
    showToast(`Order placed — £${cartTotal.toFixed(2)}. Cashback credited.`);
    setCart({});
    setTimeout(() => setCartOpen(false), 600);
  };

  // ─── Product card ───
  const ProductCard: React.FC<{ p: Product; index: number }> = ({ p, index }) => {
    const inCart = (cart[p.id] || 0) > 0;
    const liked = wishlist.has(p.id);
    const discount = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;

    return (
      <div
        className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
        style={{
          animation: mounted ? `prodIn 0.5s ease-out ${(index % 12) * 0.05}s both` : undefined,
        }}
      >
        {/* Image block (gradient + emoji) */}
        <div
          className="relative aspect-square overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${p.gradientFrom} 0%, ${p.gradientTo} 100%)` }}
        >
          {/* badge */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <BadgePill kind={p.badge} />
            {discount > 0 && (
              <span className="bg-white/95 text-[#7B0F14] text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                -{discount}%
              </span>
            )}
          </div>

          {/* wishlist */}
          <button
            onClick={() => toggleWishlist(p.id, p.name)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-md transition-all hover:scale-110"
            aria-label="Save to wishlist"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? '#7B0F14' : 'none'} stroke="#7B0F14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          {/* product icon */}
          <div className="absolute inset-0 flex items-center justify-center text-white/90 text-7xl select-none group-hover:scale-110 transition-transform duration-500">
            {p.emoji}
          </div>

          {/* cashback strip */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 flex items-center gap-1.5">
            <GoldCoin size={14} />
            <span className="text-[10px] font-bold text-[#DAA520] uppercase tracking-wider">
              £{p.cashback.toFixed(2)} cashback
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-3.5 flex-1 flex flex-col">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 truncate">{p.vendor}</p>
          <h3 className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2 min-h-[2.5rem]">{p.name}</h3>

          <div className="flex items-center gap-1.5 mb-2">
            <Stars rating={p.rating} size={11} />
            <span className="text-[10px] text-gray-500 font-medium">{p.rating.toFixed(1)}</span>
            <span className="text-[10px] text-gray-400">({p.reviews})</span>
          </div>

          <div className="flex items-end justify-between mt-auto">
            <div>
              <p className="text-lg font-bold text-[#7B0F14] leading-none">£{p.price.toFixed(2)}</p>
              {p.originalPrice && (
                <p className="text-[10px] text-gray-400 line-through mt-0.5">£{p.originalPrice.toFixed(2)}</p>
              )}
            </div>
            <button
              onClick={() => addToCart(p.id, p.name)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 ${
                inCart ? 'bg-[#DAA520] text-white' : 'bg-[#7B0F14] hover:bg-[#5A0B10] text-white'
              }`}
              aria-label="Add to cart"
            >
              {inCart ? (
                <span className="text-xs font-bold">{cart[p.id]}</span>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const activeSortLabel = sortOptions.find((s) => s.id === sortBy)?.label || 'Featured';

  return (
    <div className="bg-gray-50 min-h-screen relative">
      <style>{`
        @keyframes prodIn {
          0% { opacity: 0; transform: translateY(20px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideInRight {
          0% { transform: translateX(100%); }
          100% { transform: translateX(0); }
        }
        @keyframes fadeBg {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); }
        }
        .cart-slide { animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
        .cart-bg    { animation: fadeBg 0.25s ease-out; }
        .badge-pop  { animation: bounceIn 0.4s ease-out; }
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
        style={{
          background: 'radial-gradient(circle at 20% 30%, #A52228 0%, #7B0F14 45%, #4A0A0D 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 right-10 w-72 h-72 bg-[#DAA520] rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-10 w-96 h-96 bg-[#7B0F14] rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 lg:pt-14 lg:pb-12">
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
                Shop British<br />
                <span className="text-[#DAA520]">Earn CashTokens.</span>
              </h1>
              <p className="text-white/80 text-sm sm:text-base mb-6 max-w-lg">
                A curated marketplace of independent UK sellers. Every purchase earns you cashback — paid out in CashTokens you can spend on gift cards, airtime, or withdraw.
              </p>

              {/* Search */}
              <div className="bg-white rounded-2xl shadow-2xl flex items-center p-1.5 max-w-lg">
                <div className="pl-3 pr-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products, vendors, categories…"
                  className="flex-1 py-2.5 text-sm text-gray-800 outline-none bg-transparent placeholder:text-gray-400"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="px-3 text-gray-400 hover:text-[#7B0F14]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-4 mt-6">
                {[
                  { label: 'UK Vendors',        value: '420+' },
                  { label: 'Products Listed',   value: '12k+' },
                  { label: 'Avg. Cashback',     value: '5%'   },
                  { label: 'Free UK Delivery',  value: 'Over £40' },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col">
                    <span className="text-[#DAA520] font-black text-lg sm:text-xl leading-none">{s.value}</span>
                    <span className="text-white/60 text-[10px] uppercase tracking-wider mt-1 font-semibold">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Wallet card */}
            <div className="hidden lg:flex justify-end">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Your Wallet</span>
                  <GoldCoin size={28} />
                </div>
                <p className="text-white text-3xl font-black mb-1">£{walletBalance.toFixed(2)}</p>
                <p className="text-white/60 text-xs mb-5">{userName ? `Welcome back, ${userName.split(' ')[0]}` : 'Sign in to start earning'}</p>
                <div className="space-y-2.5">
                  {[
                    { icon: 'tag',    text: 'Every product earns cashback' },
                    { icon: 'truck',  text: 'Free UK delivery over £40' },
                    { icon: 'shield', text: 'Buyer protection on all orders' },
                  ].map((row) => (
                    <div key={row.icon} className="flex items-center gap-2.5 text-white/80 text-xs">
                      <div className="w-7 h-7 rounded-lg bg-[#DAA520]/20 flex items-center justify-center flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DAA520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {row.icon === 'tag'    && <><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>}
                          {row.icon === 'truck'  && <><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>}
                          {row.icon === 'shield' && <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}
                        </svg>
                      </div>
                      {row.text}
                    </div>
                  ))}
                </div>
                {onViewBrands && (
                  <button
                    onClick={onViewBrands}
                    className="mt-5 w-full bg-white text-[#7B0F14] py-2.5 rounded-xl text-sm font-bold hover:bg-[#DAA520] hover:text-white transition-colors"
                  >
                    Spend on Gift Cards →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CATEGORY PILLS ─── */}
      <section className="bg-white sticky top-16 lg:top-20 z-30 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto scroll-hide py-3">
            {categories.map((c) => {
              const active = activeCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                    active
                      ? 'bg-[#7B0F14] text-white shadow-md'
                      : 'bg-gray-50 text-gray-700 hover:bg-[#F4E6E6] hover:text-[#7B0F14]'
                  }`}
                >
                  <CategoryIcon name={c.icon} size={16} color={active ? '#DAA520' : '#7B0F14'} />
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── VENDOR SPOTLIGHT ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">Featured UK Vendors</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Independent sellers earning their place on the marketplace.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {vendors.map((v) => (
            <button
              key={v.id}
              onClick={() => setSearch(v.name)}
              className="group bg-white rounded-2xl border border-gray-100 p-4 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-base mb-3 shadow-md group-hover:scale-110 transition-transform"
                style={{ backgroundColor: v.color }}
              >
                {v.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
              </div>
              <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{v.name}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1.5 font-semibold">{v.location}</p>
              <div className="flex items-center gap-1 mt-2">
                <Stars rating={v.rating} size={10} />
                <span className="text-[10px] text-gray-500 font-medium">{v.rating}</span>
                <span className="text-[10px] text-gray-400">· {v.sales} sales</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ─── PRODUCT GRID ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-end justify-between mb-5 gap-3 flex-wrap">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              {activeCategory === 'all' ? 'All Products' : categories.find((c) => c.id === activeCategory)?.name}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
              {search && <> for "<span className="text-[#7B0F14] font-semibold">{search}</span>"</>}
            </p>
          </div>

          {/* Sort dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-[#7B0F14]/30 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="2" strokeLinecap="round">
                <line x1="21" y1="6" x2="3" y2="6" /><line x1="15" y1="12" x2="3" y2="12" /><line x1="9" y1="18" x2="3" y2="18" />
              </svg>
              {activeSortLabel}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round"
                style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-40">
                {sortOptions.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => { setSortBy(o.id); setSortOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      sortBy === o.id ? 'bg-[#F4E6E6] text-[#7B0F14] font-semibold' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F4E6E6] flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No products found</h3>
            <p className="text-sm text-gray-500 mb-5">Try a different search or category.</p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('all'); }}
              className="bg-[#7B0F14] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5A0B10] transition-colors"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)}
          </div>
        )}
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-[10px] font-bold text-[#DAA520] uppercase tracking-[0.2em] mb-2">How the Marketplace Works</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Shop, earn, repeat.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { step: '01', title: 'Browse UK sellers',     body: 'Independent UK vendors across 8 categories. Verified, rated and reviewed.' },
              { step: '02', title: 'Buy with confidence',   body: 'Buyer protection on every order. Free delivery on orders over £40.' },
              { step: '03', title: 'Earn CashTokens',       body: 'Cashback paid into your wallet after delivery. Spend it on gift cards, airtime, or cash out.' },
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

      {/* ─── Floating cart button ─── */}
      {cartItemCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-[#7B0F14] hover:bg-[#5A0B10] text-white rounded-full shadow-2xl pl-5 pr-6 py-4 flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
        >
          <div className="relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="badge-pop absolute -top-2 -right-2 bg-[#DAA520] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#7B0F14]" key={cartItemCount}>
              {cartItemCount}
            </span>
          </div>
          <span className="font-semibold text-sm">£{cartTotal.toFixed(2)}</span>
        </button>
      )}

      {/* ─── Cart Drawer ─── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="cart-bg absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <div className="cart-slide relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-black text-gray-900 text-lg">Your Basket</h3>
                <p className="text-xs text-gray-500">{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}</p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                <div className="w-20 h-20 rounded-full bg-[#F4E6E6] flex items-center justify-center mb-4">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                </div>
                <h4 className="font-bold text-gray-900 mb-1">Your basket is empty</h4>
                <p className="text-sm text-gray-500">Add a few products to start earning cashback.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
                  {cartItems.map(({ product, qty }) => (
                    <div key={product.id} className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 transition-colors">
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${product.gradientFrom}, ${product.gradientTo})` }}
                      >
                        {product.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold truncate">{product.vendor}</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center bg-gray-100 rounded-full">
                            <button onClick={() => decreaseQty(product.id)} className="w-7 h-7 flex items-center justify-center text-[#7B0F14] hover:bg-[#F4E6E6] rounded-full transition-colors">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            </button>
                            <span className="text-xs font-bold text-gray-900 min-w-[20px] text-center">{qty}</span>
                            <button onClick={() => increaseQty(product.id)} className="w-7 h-7 flex items-center justify-center text-[#7B0F14] hover:bg-[#F4E6E6] rounded-full transition-colors">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="text-[10px] text-gray-400 hover:text-red-500 font-medium transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[#7B0F14]">£{(product.price * qty).toFixed(2)}</p>
                        <p className="text-[9px] text-[#DAA520] font-bold uppercase tracking-wider mt-0.5">+£{(product.cashback * qty).toFixed(2)} back</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-700">£{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Delivery</span>
                    <span className={`font-semibold ${cartTotal >= 40 ? 'text-green-600' : 'text-gray-700'}`}>
                      {cartTotal >= 40 ? 'FREE' : '£3.95'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-[#DAA520]/10 px-3 py-2 rounded-xl">
                    <span className="text-[11px] font-bold text-[#7B0F14] uppercase tracking-wider flex items-center gap-1.5">
                      <GoldCoin size={14} />
                      Cashback you'll earn
                    </span>
                    <span className="font-bold text-[#7B0F14]">£{cartCashback.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-black text-xl text-[#7B0F14]">£{(cartTotal + (cartTotal >= 40 ? 0 : 3.95)).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-[#7B0F14] hover:bg-[#5A0B10] text-white py-3.5 rounded-2xl font-bold text-sm transition-colors shadow-lg active:scale-[0.98]"
                  >
                    Checkout · £{(cartTotal + (cartTotal >= 40 ? 0 : 3.95)).toFixed(2)}
                  </button>
                  <p className="text-[10px] text-center text-gray-400">
                    Secure checkout · Buyer protection on every order
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
};

export default UK_MarketplacePage;
