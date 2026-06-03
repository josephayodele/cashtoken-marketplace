import React, { useState, useRef, useEffect } from 'react';
import GoldCoin from './GoldCoin';

interface UserProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string;
}

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  user: UserProfile | null;
  onSignInClick: () => void;
  onSignOut: () => void;
}

// ─── Flags ───
const NigeriaFlag = ({ w = 28, h = 20 }: { w?: number; h?: number }) => (
  <img src="/logos/nigeria_flag.webp" alt="Nigeria" style={{ width: w, height: h, objectFit: 'cover' }} className="rounded-sm shadow-sm flex-shrink-0" />
);

const UKFlag = ({ w = 28, h = 20 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" className="rounded-sm shadow-sm flex-shrink-0">
    <rect width="60" height="40" fill="#00247D"/>
    <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="6"/>
    <path d="M0,0 L60,40 M60,0 L0,40" stroke="#CF142B" strokeWidth="4"/>
    <path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="10"/>
    <path d="M30,0 V40 M0,20 H60" stroke="#CF142B" strokeWidth="6"/>
  </svg>
);

const SouthAfricaFlag = ({ w = 28, h = 20 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" className="rounded-sm shadow-sm flex-shrink-0">
    <rect width="60" height="40" fill="#007A4D"/>
    <rect y="0"    width="60" height="13.3" fill="#007A4D"/>
    <rect y="13.3" width="60" height="13.4" fill="#fff"/>
    <rect y="15"   width="60" height="10"   fill="#DE3831"/>
    <rect y="26.7" width="60" height="13.3" fill="#007A4D"/>
    <polygon points="0,0 28,20 0,40" fill="#FFB612"/>
    <polygon points="0,2 24,20 0,38" fill="#000"/>
    <polygon points="0,7 18,20 0,33" fill="#FFB612"/>
  </svg>
);

const LiberiaFlag = ({ w = 28, h = 20 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" className="rounded-sm shadow-sm flex-shrink-0">
    <rect width="60" height="40" fill="#BF0A30"/>
    {[1,3,5,7,9].map(i => <rect key={i} y={i * 4} width="60" height="4" fill="#fff"/>)}
    <rect width="22" height="20" fill="#00369F"/>
    <polygon points="11,2 13,8 19,8 14,12 16,18 11,14 6,18 8,12 3,8 9,8" fill="#fff"/>
  </svg>
);

const GlobalIcon = ({ w = 28, h = 20 }: { w?: number; h?: number }) => (
  <GoldCoin size={Math.round((w + h) / 2)} />
);

const COUNTRIES = [
  { name: 'Global',         code: 'GL', Flag: GlobalIcon },
  { name: 'Nigeria',        code: 'NG', Flag: NigeriaFlag },
  { name: 'United Kingdom', code: 'UK', Flag: UKFlag },
  { name: 'South Africa',   code: 'ZA', Flag: SouthAfricaFlag },
  { name: 'Liberia',        code: 'LR', Flag: LiberiaFlag },
];

const CountryDropdown: React.FC<{
  selected: typeof COUNTRIES[0];
  onSelect: (c: typeof COUNTRIES[0]) => void;
}> = ({ selected, onSelect }) => (
  <div
    className="absolute top-full right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
    style={{ zIndex: 9999 }}
  >
    <div className="px-4 pt-4 pb-3">
      <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-3">Select Country</p>
      <div className="space-y-0.5">
        {COUNTRIES.map((country) => {
          const isSelected = country.code === selected.code;
          const { Flag } = country;
          return (
            <button
              key={country.code}
              onClick={() => onSelect(country)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 ${
                isSelected ? 'bg-[#FAF0EE]' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Flag w={28} h={19} />
                <span className={`text-sm font-medium ${isSelected ? 'text-[#7B0F14]' : 'text-gray-700'}`}>
                  {country.name}
                </span>
              </div>
              {isSelected && (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

const UK_Header: React.FC<HeaderProps> = ({ currentPage, onNavigate, user, onSignInClick, onSignOut }) => {
  const [mobileOpen, setMobileOpen]           = useState(false);
  const [dropdownOpen, setDropdownOpen]       = useState(false);
  // FIX 1: separate state + refs for desktop vs mobile country dropdowns
  const [desktopCountryOpen, setDesktopCountryOpen] = useState(false);
  const [mobileCountryOpen,  setMobileCountryOpen]  = useState(false);

  // UK always pre-selected
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[2]);

  const dropdownRef       = useRef<HTMLDivElement>(null);
  const desktopCountryRef = useRef<HTMLDivElement>(null);
  const mobileCountryRef  = useRef<HTMLDivElement>(null);

  // UK-prefixed routes. The final item is an external link out to the
  // corporate site — `url` opens in the same tab (literal "Back to" UX).
  const navItems: Array<{ label: string; page?: string; url?: string }> = [
    { label: 'Home',                     page: 'uk' },
    { label: 'Brands',                   page: 'ukbrands' },
    { label: 'Back to Business Website', url:  'https://cashtokenrewards.com' },
  ];

  const handleNav = (item: { page?: string; url?: string }) => {
    setMobileOpen(false);
    setDropdownOpen(false);
    if (item.url) {
      window.location.href = item.url;
      return;
    }
    if (item.page) onNavigate(item.page);
  };

  // FIX 3: universal country routing — GL, NG, UK all work correctly
  const handleCountrySelect = (c: typeof COUNTRIES[0]) => {
    setSelectedCountry(c);
    setDesktopCountryOpen(false);
    setMobileCountryOpen(false);
    if (c.code === 'GL') {
      onNavigate('global');
    } else if (c.code === 'NG') {
      onNavigate('nigeria');
    } else if (c.code === 'UK') {
      onNavigate('uk');
    } else {
      onNavigate('comingsoon');
    }
  };

  // FIX 4: sign out stays on UK, not global
  const handleSignOut = () => {
    setDropdownOpen(false);
    onSignOut();
    onNavigate('uk');
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (desktopCountryRef.current && !desktopCountryRef.current.contains(e.target as Node)) {
        setDesktopCountryOpen(false);
      }
      if (mobileCountryRef.current && !mobileCountryRef.current.contains(e.target as Node)) {
        setMobileCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const { Flag: SelectedFlag } = selectedCountry;

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* Logo */}
          <button
            onClick={() => handleNav('uk')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity focus:outline-none"
          >
            <GoldCoin size={42} />
            <div className="flex flex-col leading-tight">
              <span className="text-base lg:text-lg font-black tracking-wider text-[#7B0F14] leading-none uppercase">
                CASHTOKEN
              </span>
              <span className="text-[9px] lg:text-[10px] font-bold tracking-[0.22em] text-[#DAA520] leading-none mt-1 uppercase">
                REWARDS UK
              </span>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => (
              <button
                key={item.page ?? item.url ?? item.label}
                onClick={() => handleNav(item)}
                className={`px-3 xl:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  item.page && currentPage === item.page
                    ? 'bg-[#7B0F14] text-white'
                    : 'text-gray-700 hover:bg-[#F4E6E6] hover:text-[#7B0F14]'
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* Sign In / User — before country selector */}
            <div className="ml-3 relative" ref={dropdownRef}>
              {user ? (
                <>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-full border border-gray-200 hover:border-[#7B0F14]/30 hover:bg-[#F4E6E6]/50 transition-all"
                  >
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-8 h-8 rounded-full object-cover border-2 border-[#DAA520]" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7B0F14] to-[#4A0A0D] flex items-center justify-center text-white text-xs font-bold border-2 border-[#DAA520]">
                        {getInitials(user.full_name || 'U')}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {user.full_name?.split(' ')[0] || 'User'}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="2.5" strokeLinecap="round"
                      className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}>
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                      <div className="px-4 py-3 bg-[#F4E6E6]/60 border-b border-gray-100">
                        <p className="font-semibold text-gray-900 text-sm truncate">{user.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <button onClick={() => handleNav('profile')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F4E6E6]/50 transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="2" strokeLinecap="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                          </svg>
                          Profile Settings
                        </button>
                        <button onClick={() => handleNav('transactions')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F4E6E6]/50 transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="2" strokeLinecap="round">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
                          </svg>
                          Transaction History
                        </button>
                        <button onClick={() => handleNav('consumer')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F4E6E6]/50 transition-colors">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="2" strokeLinecap="round">
                            <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                          </svg>
                          My Wallet
                        </button>
                      </div>
                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={onSignInClick}
                  className="flex items-center gap-2 bg-[#7B0F14] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#5A0B10] transition-colors shadow-md"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Sign In
                </button>
              )}
            </div>

            {/* Desktop country selector — own ref and state */}
            <div className="relative ml-3" ref={desktopCountryRef}>
              <button
                onClick={() => setDesktopCountryOpen(v => !v)}
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity focus:outline-none"
              >
                <SelectedFlag w={28} h={19} />
                <span className="text-sm font-medium text-gray-700">{selectedCountry.name}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round"
                  style={{ transform: desktopCountryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {desktopCountryOpen && (
                <CountryDropdown selected={selectedCountry} onSelect={handleCountrySelect} />
              )}
            </div>
          </nav>

          {/* Mobile right section */}
          <div className="flex items-center gap-2 lg:hidden">
            {user ? (
              <button onClick={() => setDropdownOpen(!dropdownOpen)}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-9 h-9 rounded-full object-cover border-2 border-[#DAA520]" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7B0F14] to-[#4A0A0D] flex items-center justify-center text-white text-xs font-bold border-2 border-[#DAA520]">
                    {getInitials(user.full_name || 'U')}
                  </div>
                )}
              </button>
            ) : (
              <button onClick={onSignInClick} className="bg-[#7B0F14] text-white px-3 py-2 rounded-lg text-xs font-semibold">
                Sign In
              </button>
            )}

            {/* Mobile country selector — own ref and state */}
            <div className="relative" ref={mobileCountryRef}>
              <button
                onClick={() => setMobileCountryOpen(v => !v)}
                className="flex items-center gap-1 hover:opacity-80 transition-opacity focus:outline-none"
              >
                <SelectedFlag w={22} h={15} />
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round"
                  style={{ transform: mobileCountryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {mobileCountryOpen && (
                <CountryDropdown selected={selectedCountry} onSelect={handleCountrySelect} />
              )}
            </div>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              {mobileOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile user dropdown */}
      {dropdownOpen && user && (
        <div className="lg:hidden absolute right-4 top-16 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
          <div className="px-4 py-3 bg-[#F4E6E6]/60 border-b border-gray-100">
            <p className="font-semibold text-gray-900 text-sm truncate">{user.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <button onClick={() => handleNav('profile')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F4E6E6]/50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="2" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              Profile Settings
            </button>
            <button onClick={() => handleNav('transactions')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F4E6E6]/50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="2" strokeLinecap="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Transaction History
            </button>
            <button onClick={() => handleNav('consumer')} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F4E6E6]/50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              My Wallet
            </button>
          </div>
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Mobile nav menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.page ?? item.url ?? item.label}
                onClick={() => handleNav(item)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  item.page && currentPage === item.page ? 'bg-[#7B0F14] text-white' : 'text-gray-700 hover:bg-[#F4E6E6]'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 mt-2">
              <SelectedFlag w={24} h={16} />
              <span className="text-sm text-gray-600">{selectedCountry.name}</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default UK_Header;