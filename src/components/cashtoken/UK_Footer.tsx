import React from 'react';
import GoldCoin from './GoldCoin';

interface FooterProps {
  onNavigate: (page: string) => void;
}

const UK_Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#2D0507] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <GoldCoin size={36} />
              <div>
                <div className="font-bold tracking-wider text-white">CASHTOKEN</div>
                <div className="text-[10px] tracking-[0.15em] text-[#DAA520]">REWARD INTERNATIONAL</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              The UK's premier universal reward wallet. Earn CashTokens from your favourite brands and win up to £1,000,000 weekly.
            </p>
            <div className="flex gap-3 mt-5">
              {['facebook', 'twitter', 'instagram', 'linkedin'].map((social) => (
                <button key={social} className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#DAA520] transition-colors flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white" opacity="0.8">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-[#DAA520] mb-4 text-sm tracking-wider">QUICK LINKS</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', page: 'uk' },
                { label: 'Marketplace', page: 'ukmarketplace' },
                { label: 'Brands & Gift Cards', page: 'ukbrands' },
                { label: 'News Letter', page: 'uknewsletter' },
                { label: 'About Us', page: 'ukteam' },
              ].map((item) => (
                <li key={item.page}>
                  <button onClick={() => onNavigate(item.page)} className="text-gray-400 hover:text-[#DAA520] transition-colors text-sm">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Dashboards */}
          <div>
            <h4 className="font-semibold text-[#DAA520] mb-4 text-sm tracking-wider">DASHBOARDS</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Customers', page: 'consumer' },
                { label: 'Business', page: 'merchant' },
              ].map((item) => (
                <li key={item.page}>
                  <button onClick={() => onNavigate(item.page)} className="text-gray-400 hover:text-[#DAA520] transition-colors text-sm">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-[#DAA520] mb-4 text-sm tracking-wider">LEGAL</h4>
            <ul className="space-y-2.5">
              {['Terms & Conditions', 'Privacy Policy', 'Cookie Policy', 'Contact Us'].map((item) => (
                <li key={item}>
                  <button className="text-gray-400 hover:text-[#DAA520] transition-colors text-sm">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            &copy; 2026 CashToken Reward International. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs">
            1 United Kingdom &middot; 1 Reward Wallet &middot; CashToken
          </p>
        </div>
      </div>
    </footer>
  );
};

export default UK_Footer;