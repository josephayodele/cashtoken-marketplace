import React, { useState, useEffect, useRef } from 'react';
import GoldCoin from './GoldCoin';

// ─── IMAGES ───
const TEAM_IMAGES = {
  ceo:          'https://d64gsuwffb70l.cloudfront.net/6895f6bbeb00a8ae7951fdbf_1772015416550_b9a313fd.jfif',
  operations:   'https://d64gsuwffb70l.cloudfront.net/6895f6bbeb00a8ae7951fdbf_1772015424299_0f3c670d.jfif',
  partnerships: 'https://d64gsuwffb70l.cloudfront.net/6895f6bbeb00a8ae7951fdbf_1772015440235_d0c75b32.jpeg',
};

// ─── SCROLL REVEAL HOOK ───
function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) { setTimeout(() => setVisible(true), 600); return; }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.1) { setVisible(true); return; }
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: Math.min(threshold, 0.05), rootMargin: '80px 0px 80px 0px' }
    );
    obs.observe(el);
    const t = setTimeout(() => setVisible(true), 3500);
    return () => { obs.disconnect(); clearTimeout(t); };
  }, [threshold]);
  return { ref, visible };
}

// ─── ANIMATED BLOCK ───
const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  visible: boolean;
  from?: 'left' | 'right' | 'bottom' | 'fade' | 'zoom';
  className?: string;
}> = ({ children, delay = 0, visible, from = 'bottom', className = '' }) => {
  const transforms: Record<string, string> = {
    left:   'translateX(-70px) rotate(-1deg)',
    right:  'translateX(70px) rotate(1deg)',
    bottom: 'translateY(50px)',
    fade:   'translateY(15px)',
    zoom:   'scale(0.88) translateY(25px)',
  };
  return (
    <div
      className={className}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'none' : transforms[from],
        transition: `opacity 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.85s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// ─── ANIMATED COUNTER ───
const Counter: React.FC<{ target: number; suffix?: string; prefix?: string; visible: boolean }> = ({
  target, suffix = '', prefix = '', visible,
}) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = target / (2000 / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(t);
  }, [visible, target]);
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

interface UK_AboutUsProps {
  onNavigate: (page: string) => void;
}

const UK_AboutUs: React.FC<UK_AboutUsProps> = ({ onNavigate }) => {
  const [expandedBio, setExpandedBio] = useState<string | null>(null);

  const heroSection      = useReveal(0.05);
  const overviewSection  = useReveal(0.1);
  const statsSection     = useReveal(0.1);
  const visionSection    = useReveal(0.1);
  const offerSection     = useReveal(0.08);
  const execSection      = useReveal(0.08);
  const boardSection     = useReveal(0.08);

  const executives = [
    {
      name: 'Simileoluwa Adeoye',
      role: 'Chief Executive Officer',
      image: TEAM_IMAGES.ceo,
      linkedin: 'https://www.linkedin.com/in/simi-daphne-adeoye-5939a31b7/',
      bio: `Simileoluwa Adeoye is an accomplished Business Development Leader with expertise in scaling operations and securing strategic partnerships across key markets. She is proficient in Project Management, Payment System Integrations, and Implementation of Compliance Frameworks. She is currently the Acting Managing Director, CashToken Rewards International, UK.`,
    },
    {
      name: 'Job Precious',
      role: 'Head of Operations',
      image: TEAM_IMAGES.operations,
      linkedin: 'https://www.linkedin.com/in/precious-job-a37a7b101/',
      bio: `Job Precious Chikaike brings a unique blend of financial expertise, product leadership, and data-driven innovation to the organisation. With a strong foundation in the financial services sector, he began his career in banking, gaining experience in operations, compliance, and customer-centric financial solutions.\n\nHis transition into financial technology and digital product environments has enabled him to build and scale technology-driven platforms, including contributing to international expansion initiatives. Precious is a certified Data Analyst with expertise in Excel, SQL, Power BI, and Tableau, bringing analytical rigour to strategic decision-making and product optimisation.`,
    },
    {
      name: 'Happiness Louis',
      role: 'Strategic Partnerships Lead',
      image: TEAM_IMAGES.partnerships,
      linkedin: 'https://www.linkedin.com/in/happinesslouisemeh/',
      bio: `Happiness Louis is a result-driven Business Development Executive with over 2 years of experience, specialising in driving business growth through strategic partnerships and effective project management.\n\nFluent in English and conversational in French, she thrives in diverse environments and excels in developing strong relationships with clients and partners. Her expertise includes merchant acquisition, account management, and territory expansion.`,
    },
  ];

  const boardMembers = [
    {
      name: 'Owolabi Awosan',
      role: 'Board Chairman',
      initials: 'OA',
      color: 'from-[#7B0F14] to-[#4A0A0D]',
      bio: `Owolabi Awosan is a commercially astute and innovative strategist capable of implementing effective controls to ensure project progress remains in line with defined timeframes and quality standards. Mr. Owolabi was most recently the Chief Inspection Officer to the Greater Group.`,
    },
    {
      name: 'Lai Labode',
      role: 'Director',
      initials: 'LL',
      color: 'from-[#9B1B21] to-[#7B0F14]',
      bio: `Lai Labode is the Founder and MD of CashToken Rewards Africa and Principal Partner at SaltinGStein Limited, a technology and business consulting firm. He is a business logic expert with deep knowledge of African emerging markets. Lai studied Corporate Restructuring, Mergers and Acquisitions at Harvard Business School, and holds a degree in Accounting and a Diploma in Law from the University of Abuja.`,
    },
    {
      name: 'Simileoluwa Adeoye',
      role: 'Managing Director',
      initials: 'SA',
      image: TEAM_IMAGES.ceo,
      color: 'from-[#7B0F14] to-[#A52228]',
      bio: `Simileoluwa Adeoye serves a dual role as both CEO and Managing Director on the Board. An accomplished Business Development Leader with expertise in scaling operations and securing strategic partnerships across key markets, she is proficient in Project Management, Payment System Integrations, and Implementation of Compliance Frameworks.`,
    },
    {
      name: 'Rachel Odunuga',
      role: 'Director',
      initials: 'RO',
      color: 'from-[#DAA520] to-[#B8860B]',
      bio: `Rachel Odunuga is the CEO/MD of Fitcare Health, a premium wellness brand with operations in London, UK and Lagos, Nigeria, serving clients locally and shipping products worldwide. She is a graduate of Accounting & Finance from the University of Essex with years of UK experience as a Business Analyst for both luxury brands and startups.`,
    },
    {
      name: 'Ehianeta Ebhohimhen',
      role: 'Director',
      initials: 'EE',
      color: 'from-[#5A0B10] to-[#7B0F14]',
      bio: `Ehianeta Mondritz Ebhohimhen has worked as Head of Construction & Telecommunications in the Banking and Oil & Gas sectors. The group leverages on his wealth of experience in business and development in these sectors.`,
    },
    {
      name: 'Michael Terungwa',
      role: 'Director',
      initials: 'MT',
      color: 'from-[#B8860B] to-[#DAA520]',
      bio: `Michael Terungwa is the Chief Technology Officer of CeLD Innovations Limited. He is a strategic technology leader with experience in Digital Architecture, Cloud Infrastructure, Software Engineering, and Supply Chain Operations. He has a background in Food Science and Supply Chain Management.`,
    },
  ];

  const toggleBio = (key: string) =>
    setExpandedBio(expandedBio === key ? null : key);

  const truncate = (text: string, len = 160) =>
    text.length <= len ? text : text.substring(0, len).trim() + '…';

  return (
    <div className="bg-white overflow-x-hidden">
      <style>{`
        @keyframes shimmerGold {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes floatCoin {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%     { transform: translateY(-12px) rotate(4deg); }
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2); opacity: 0; }
        }
        .shimmer-wine {
          background: linear-gradient(90deg,#7B0F14 0%,#DAA520 30%,#7B0F14 60%,#DAA520 90%,#7B0F14 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerGold 4s linear infinite;
        }
        .shimmer-gold {
          background: linear-gradient(90deg,#DAA520 0%,#FFD700 30%,#DAA520 60%,#B8860B 90%,#DAA520 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerGold 3.5s linear infinite;
        }
        .float-coin { animation: floatCoin 5s ease-in-out infinite; }
        .gradient-hero {
          background: linear-gradient(-45deg,#2D0508,#7B0F14,#5A1018,#3D0C11);
          background-size: 400% 400%;
          animation: gradientShift 14s ease infinite;
        }
        .card-hover {
          transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease;
        }
        .card-hover:hover {
          transform: translateY(-8px);
          box-shadow: 0 24px 56px -12px rgba(123,15,20,0.18);
        }
      `}</style>

      {/* ═══════════════════════════════════════════ */}
      {/* HERO */}
      {/* ═══════════════════════════════════════════ */}
      <section ref={heroSection.ref} className="relative gradient-hero overflow-hidden">
        {/* Decorative rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-white/[0.04]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/[0.05]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-white/[0.07]" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#DAA520]/5 -translate-y-1/3 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4 blur-3xl" />

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, #DAA520 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36 text-center">
          <Reveal visible={heroSection.visible} delay={0} from="fade">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2.5 mb-8 border border-white/15">
              <div className="w-1.5 h-1.5 rounded-full bg-[#DAA520]" style={{ animation: 'pulseRing 2s ease-out infinite' }} />
              <span className="text-white/80 text-xs font-bold tracking-[0.25em] uppercase">CashToken Rewards UK</span>
            </div>
          </Reveal>

          <Reveal visible={heroSection.visible} delay={150} from="bottom">
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-[1.02] mb-6">
              <span className="block text-white">About</span>
              <span className="block shimmer-gold">CashToken UK</span>
            </h1>
          </Reveal>

          <Reveal visible={heroSection.visible} delay={350} from="fade">
            <p className="text-white/60 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
              Transforming every purchase in the United Kingdom into a{' '}
              <span className="text-[#DAA520] font-semibold">life-changing opportunity</span>{' '}
              — one CashToken at a time.
            </p>
          </Reveal>

          <Reveal visible={heroSection.visible} delay={500} from="zoom">
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => onNavigate('ukconsumer')}
                className="bg-[#DAA520] hover:bg-[#C4941A] text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl hover:-translate-y-1 inline-flex items-center gap-2.5"
              >
                Get Started
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
              <button
                onClick={() => onNavigate('ukbusiness')}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-bold text-sm border border-white/20 hover:border-white/40 transition-all hover:-translate-y-1"
              >
                For Businesses
              </button>
            </div>
          </Reveal>

          {/* Floating coins */}
          <div className="absolute top-10 left-10 float-coin opacity-40" style={{ animationDelay: '0s' }}>
            <GoldCoin size={36} />
          </div>
          <div className="absolute top-20 right-16 float-coin opacity-30" style={{ animationDelay: '1.5s' }}>
            <GoldCoin size={24} />
          </div>
          <div className="absolute bottom-16 left-24 float-coin opacity-20 hidden lg:block" style={{ animationDelay: '0.8s' }}>
            <GoldCoin size={20} />
          </div>
          <div className="absolute bottom-10 right-10 float-coin opacity-25" style={{ animationDelay: '2.2s' }}>
            <GoldCoin size={30} />
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ display: 'block' }}>
            <path d="M0 60L1440 60L1440 20C1200 60 960 0 720 20C480 40 240 0 0 20L0 60Z" fill="white"/>
          </svg>
        </div>
      </section>


      {/* ═══════════════════════════════════════════ */}
      {/* 1. WHO ARE WE */}
      {/* ═══════════════════════════════════════════ */}
      <section ref={overviewSection.ref} className="bg-white pt-8 pb-20 lg:pb-28 relative overflow-hidden">
        <div className="absolute top-10 right-0 w-[500px] h-[500px] rounded-full bg-[#7B0F14]/[0.025] translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#DAA520]/[0.03] -translate-x-1/3 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section label */}
          <Reveal visible={overviewSection.visible} delay={0} from="fade">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-[#7B0F14]/30" />
              <span className="text-[#7B0F14] text-xs font-bold tracking-[0.25em] uppercase">01</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#7B0F14]/20 to-transparent" />
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <div>
              <Reveal visible={overviewSection.visible} delay={100} from="left">
                <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.02] mb-8">
                  <span className="text-gray-900">Who</span><br />
                  <span className="text-gray-900">Are </span>
                  <span className="shimmer-wine">We</span>
                  <span className="text-[#DAA520]">?</span>
                </h2>
              </Reveal>

              <Reveal visible={overviewSection.visible} delay={250} from="left">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-1 w-14 bg-gradient-to-r from-[#7B0F14] to-[#DAA520] rounded-full" />
                  <div className="w-2 h-2 rounded-full bg-[#DAA520]" />
                </div>
              </Reveal>

              <Reveal visible={overviewSection.visible} delay={350} from="left">
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  CashToken UK is a leading <span className="font-bold text-[#7B0F14]">reward technology company</span> on a mission to transform the relationship between businesses and consumers across the United Kingdom.
                </p>
              </Reveal>

              <Reveal visible={overviewSection.visible} delay={450} from="left">
                <p className="text-gray-500 leading-relaxed mb-8">
                  We believe every purchase should carry the potential for something greater. By connecting merchants, consumers, and our universal reward infrastructure, we are building an economy where loyalty is truly rewarded and life-changing opportunities are accessible to all.
                </p>
              </Reveal>

              <Reveal visible={overviewSection.visible} delay={550} from="bottom">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Founded',     value: '2023' },
                    { label: 'Headquartered', value: 'London, UK' },
                    { label: 'Sector',      value: 'Reward Tech' },
                    { label: 'Reach',       value: 'Nationwide' },
                  ].map((item) => (
                    <div key={item.label} className="bg-[#FDF6F6] rounded-2xl p-5 border border-[#7B0F14]/[0.07]">
                      <p className="text-xs text-gray-400 font-bold tracking-wider uppercase mb-1">{item.label}</p>
                      <p className="text-gray-900 font-bold text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Right — visual card */}
            <Reveal visible={overviewSection.visible} delay={200} from="right">
              <div className="relative">
                <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-br from-[#7B0F14]/8 to-[#DAA520]/6" />
                <div className="relative bg-gradient-to-br from-[#FDF6F6] via-white to-[#FEF9E7] rounded-3xl p-8 lg:p-10 border border-gray-100 shadow-2xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7B0F14] to-[#4A0A0D] flex items-center justify-center shadow-lg">
                      <GoldCoin size={28} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-lg leading-tight">CashToken</p>
                      <p className="text-[#DAA520] text-sm font-bold">Rewards UK</p>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed mb-8">
                    We are the UK arm of CashToken Rewards Africa — a proven, award-winning loyalty platform serving millions across West Africa, now bringing its transformative model to British consumers and businesses.
                  </p>

                  {/* Stats */}
                  <div ref={statsSection.ref} className="grid grid-cols-2 gap-4">
                    {[
                      { target: 500,     suffix: '+',  prefix: '',  label: 'Partner Brands' },
                      { target: 1000000, suffix: '',   prefix: '£', label: 'Weekly Draw' },
                      { target: 50000,   suffix: '+',  prefix: '',  label: 'Active Users' },
                      { target: 99,      suffix: '%',  prefix: '',  label: 'Satisfaction' },
                    ].map((stat) => (
                      <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                        <p className="text-2xl font-black text-[#7B0F14]">
                          <Counter target={stat.target} suffix={stat.suffix} prefix={stat.prefix} visible={statsSection.visible} />
                        </p>
                        <p className="text-gray-400 text-[11px] font-bold tracking-wider uppercase mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════ */}
      {/* 2. COMPANY OVERVIEW */}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-gray-50 via-white to-gray-50 py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'radial-gradient(circle, #7B0F14 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal visible={overviewSection.visible} delay={0} from="fade">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-[#DAA520]/50" />
              <span className="text-[#DAA520] text-xs font-bold tracking-[0.25em] uppercase">02</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#DAA520]/20 to-transparent" />
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <Reveal visible={overviewSection.visible} delay={100} from="left">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
                  Company<br />
                  <span className="shimmer-gold">Overview</span>
                </h2>
                <div className="h-1 w-16 bg-gradient-to-r from-[#DAA520] to-[#7B0F14] rounded-full mb-8" />
                <p className="text-gray-500 leading-relaxed">
                  A snapshot of who we are, what we have built, and the infrastructure that powers universal rewards across the UK.
                </p>
              </Reveal>
            </div>

            <div className="lg:col-span-7 space-y-5">
              {[
                {
                  num: '01',
                  title: 'What We Are',
                  body: 'CashToken UK is a reward technology company registered and operating in the United Kingdom. We sit at the intersection of consumer loyalty, payment technology, and life-changing prize draws — creating a single, unified platform that benefits merchants and consumers alike.',
                  color: '#7B0F14',
                },
                {
                  num: '02',
                  title: 'Our Model',
                  body: 'Every time a consumer shops with a CashToken partner brand, they receive CashTokens — digital reward units stored in their Universal Reward Wallet. These tokens unlock instant cashback, marketplace access, and automatic entry into weekly draws of up to £1,000,000.',
                  color: '#DAA520',
                },
                {
                  num: '03',
                  title: 'Our Infrastructure',
                  body: 'We embed directly into payment gateways and CRM platforms at the point of sale, making reward distribution seamless for merchants. Our technology stack is built for scale, reliability, and 99.9% uptime — so no transaction ever goes unrewarded.',
                  color: '#7B0F14',
                },
                {
                  num: '04',
                  title: 'Our Reach',
                  body: 'With a rapidly growing affiliate and merchant network, CashToken UK is expanding across all major cities and sectors — from retail and hospitality to e-commerce and professional services. Our goal: every pound spent in the UK carries a CashToken.',
                  color: '#DAA520',
                },
              ].map((item, i) => (
                <Reveal key={item.num} visible={overviewSection.visible} delay={150 + i * 100} from="right">
                  <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:border-transparent card-hover flex gap-5">
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}99)` }}
                    >
                      {item.num}
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 mb-2 group-hover:text-[#7B0F14] transition-colors">{item.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════ */}
      {/* 3. VISION AND MISSION */}
      {/* ═══════════════════════════════════════════ */}
      <section ref={visionSection.ref} className="relative overflow-hidden py-20 lg:py-28" style={{
        background: 'linear-gradient(-45deg,#2D0508,#7B0F14,#5A1018,#4A0A0D)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 14s ease infinite',
      }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, #DAA520 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#DAA520]/5 -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal visible={visionSection.visible} delay={0} from="fade">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-white/30" />
              <span className="text-white/60 text-xs font-bold tracking-[0.25em] uppercase">03</span>
              <div className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
            </div>
          </Reveal>

          <Reveal visible={visionSection.visible} delay={100} from="bottom">
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight mb-4">
              Vision &<br /><span className="shimmer-gold">Mission</span>
            </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-[#DAA520] to-transparent rounded-full mb-14" />
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Vision */}
            <Reveal visible={visionSection.visible} delay={200} from="left">
              <div className="relative bg-white/[0.07] backdrop-blur-sm rounded-3xl p-8 lg:p-10 border border-white/10 h-full">
                <div className="absolute top-6 right-6">
                  <div className="w-10 h-10 rounded-xl bg-[#DAA520]/20 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DAA520" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                      <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
                      <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
                    </svg>
                  </div>
                </div>
                <p className="text-[#DAA520] text-xs font-black tracking-[0.25em] uppercase mb-4">Our Vision</p>
                <h3 className="text-2xl lg:text-3xl font-black text-white leading-snug mb-5">
                  A United Kingdom where every purchase creates a life-changing opportunity.
                </h3>
                <p className="text-white/60 leading-relaxed">
                  We envision a future where the act of spending is inseparable from the act of earning — where no transaction goes unrewarded, and where a weekly shop at your local supermarket could change your life forever. CashToken UK exists to make that future real, today.
                </p>
              </div>
            </Reveal>

            {/* Mission */}
            <Reveal visible={visionSection.visible} delay={350} from="right">
              <div className="relative bg-[#DAA520]/10 backdrop-blur-sm rounded-3xl p-8 lg:p-10 border border-[#DAA520]/20 h-full">
                <div className="absolute top-6 right-6">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                    </svg>
                  </div>
                </div>
                <p className="text-white/60 text-xs font-black tracking-[0.25em] uppercase mb-4">Our Mission</p>
                <h3 className="text-2xl lg:text-3xl font-black text-white leading-snug mb-5">
                  To democratise wealth by tying every UK purchase to a life-changing reward.
                </h3>
                <p className="text-white/60 leading-relaxed">
                  Our mission is to build the most trusted and inclusive reward ecosystem in the United Kingdom — connecting hundreds of partner brands with millions of consumers through a single, powerful platform that distributes real, meaningful value back to the people who drive the economy.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Values strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { title: 'Innovation',  desc: 'Pioneering reward technology built for the modern UK consumer.',                            icon: 'M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14' },
              { title: 'Integrity',   desc: 'Transparent, fair, and ethical in every reward we distribute.',                            icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
              { title: 'Inclusion',   desc: 'Universal rewards for every citizen, every community, every day.',                          icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
            ].map((v, i) => (
              <Reveal key={v.title} visible={visionSection.visible} delay={500 + i * 100} from="bottom">
                <div className="bg-white/[0.06] backdrop-blur-sm rounded-2xl p-6 border border-white/10 text-center hover:bg-white/10 transition-colors duration-300">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7B0F14] to-[#DAA520] flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                      <path d={v.icon} />
                    </svg>
                  </div>
                  <h4 className="text-white font-black mb-2">{v.title}</h4>
                  <p className="text-white/50 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════ */}
      {/* 4. WHAT WE OFFER */}
      {/* ═══════════════════════════════════════════ */}
      <section ref={offerSection.ref} className="bg-white py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[#7B0F14]/[0.025] blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#DAA520]/[0.03] blur-[80px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal visible={offerSection.visible} delay={0} from="fade">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-[#7B0F14]/30" />
              <span className="text-[#7B0F14] text-xs font-bold tracking-[0.25em] uppercase">04</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#7B0F14]/20 to-transparent" />
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-end mb-14">
            <Reveal visible={offerSection.visible} delay={100} from="left">
              <div>
                <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-tight">
                  <span className="text-gray-900">What We</span><br />
                  <span className="shimmer-wine">Offer</span>
                </h2>
                <div className="h-1 w-16 bg-gradient-to-r from-[#7B0F14] to-[#DAA520] rounded-full mt-6" />
              </div>
            </Reveal>
            <Reveal visible={offerSection.visible} delay={200} from="right">
              <p className="text-gray-500 text-lg leading-relaxed">
                Comprehensive reward technology solutions designed to transform businesses and delight consumers across the United Kingdom — from infrastructure to advisory.
              </p>
            </Reveal>
          </div>

          {/* Offer cards — 2×2 then full-width */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {[
              {
                num: '01',
                title: 'Cash Reward as a Service',
                desc: 'End-to-end cash reward infrastructure for businesses of all sizes. We handle everything from token generation to distribution so merchants can focus on growth while we handle the rewards.',
                gradient: 'from-[#7B0F14] to-[#4A0A0D]',
                features: ['Token generation & distribution', 'Real-time tracking dashboard', 'Automated reward processing'],
              },
              {
                num: '02',
                title: 'Universal Reward Wallet',
                desc: 'A single, secure digital hub for consumers. Unlike traditional loyalty schemes where points are trapped in one store, the Universal Reward Wallet offers total flexibility across all partner brands.',
                gradient: 'from-[#DAA520] to-[#B8860B]',
                features: ['Aggregate rewards from 500+ brands', 'Instant cashback to bank account', 'Weekly £1,000,000 draw entries'],
              },
              {
                num: '03',
                title: 'Draw Infrastructure',
                desc: 'Fully managed prize draw systems with transparent, auditable results. From weekly draws to special events, we power life-changing moments for UK consumers every single week.',
                gradient: 'from-[#7B0F14] to-[#DAA520]',
                features: ['Weekly mega draws up to £1,000,000', 'Fully audited & transparent results', 'Instant winner notifications'],
              },
              {
                num: '04',
                title: 'Embedded Infrastructure',
                desc: 'We integrate directly with payment gateways and CRM platforms at the point of sale — baking reward technology seamlessly into the merchant experience with zero friction.',
                gradient: 'from-[#9B1B21] to-[#7B0F14]',
                features: ['Payment gateway integration', 'CRM platform connectivity', '99.9% uptime guarantee'],
              },
            ].map((item, i) => (
              <Reveal key={item.num} visible={offerSection.visible} delay={150 + i * 100} from={i % 2 === 0 ? 'left' : 'right'}>
                <div className="group bg-white rounded-3xl p-7 border border-gray-100 shadow-sm card-hover h-full flex flex-col relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br ${item.gradient} opacity-[0.06] -translate-y-1/2 translate-x-1/2`} />
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white font-black text-sm shadow-lg`}>
                      {item.num}
                    </div>
                    <h3 className="font-black text-gray-900 text-lg leading-tight group-hover:text-[#7B0F14] transition-colors pt-1">{item.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">{item.desc}</p>
                  <div className="space-y-2.5">
                    {item.features.map((f) => (
                      <div key={f} className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-[#7B0F14]/10 flex items-center justify-center flex-shrink-0">
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="3" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </div>
                        <span className="text-gray-600 text-xs font-medium">{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.gradient} scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left rounded-b-3xl`} />
                </div>
              </Reveal>
            ))}
          </div>

          {/* Advisory — full width */}
          <Reveal visible={offerSection.visible} delay={550} from="bottom">
            <div className="group bg-gradient-to-br from-[#FDF6F6] via-white to-[#FEF9E7] rounded-3xl p-8 border border-gray-100 shadow-sm card-hover flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#DAA520] to-[#7B0F14] flex items-center justify-center text-white font-black text-lg shadow-xl">
                05
              </div>
              <div className="flex-1">
                <h3 className="font-black text-gray-900 text-xl mb-2 group-hover:text-[#7B0F14] transition-colors">Strategic Advisory</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Expert consulting on loyalty programmes, reward mechanics, and consumer engagement strategy. We help businesses design systems that truly resonate with UK consumers — combining data-driven insight with deep market knowledge to build programmes that drive retention, acquisition, and long-term brand loyalty.
                </p>
              </div>
              <div className="flex-shrink-0 flex gap-3 flex-wrap md:flex-nowrap">
                {['Loyalty Strategy', 'Reward Design', 'Market Insights'].map((tag) => (
                  <span key={tag} className="bg-white text-[#7B0F14] text-xs font-bold px-4 py-2 rounded-full border border-[#7B0F14]/15 whitespace-nowrap shadow-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>


      {/* ═══════════════════════════════════════════ */}
      {/* 5. LEADERSHIP & GOVERNANCE */}
      {/* ═══════════════════════════════════════════ */}

      {/* 5a. Executive Team */}
      <section ref={execSection.ref} className="bg-gradient-to-b from-gray-50 to-white py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle, #7B0F14 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal visible={execSection.visible} delay={0} from="fade">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px w-12 bg-[#7B0F14]/30" />
              <span className="text-[#7B0F14] text-xs font-bold tracking-[0.25em] uppercase">05</span>
              <div className="h-px flex-1 bg-gradient-to-r from-[#7B0F14]/20 to-transparent" />
            </div>
          </Reveal>

          <Reveal visible={execSection.visible} delay={80} from="bottom">
            <div className="text-center mb-4">
              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 leading-tight">
                Leadership &<br /><span className="shimmer-wine">Governance</span>
              </h2>
            </div>
          </Reveal>

          <Reveal visible={execSection.visible} delay={180} from="fade">
            <p className="text-gray-500 text-center max-w-2xl mx-auto mb-6 leading-relaxed">
              Our leadership team brings together decades of expertise in fintech, business development, strategic partnerships, and corporate governance.
            </p>
          </Reveal>

          {/* Executive sub-heading */}
          <Reveal visible={execSection.visible} delay={250} from="bottom">
            <div className="flex items-center gap-4 mb-10 mt-12">
              <div className="inline-flex items-center gap-2 bg-[#7B0F14]/5 border border-[#7B0F14]/10 rounded-full px-5 py-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B0F14" strokeWidth="2" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span className="text-[#7B0F14] text-xs font-black tracking-[0.2em] uppercase">Executive Team</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-[#7B0F14]/15 to-transparent" />
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {executives.map((exec, i) => {
              const isExpanded = expandedBio === exec.name;
              const needsTrunc = exec.bio.length > 160;
              return (
                <Reveal key={exec.name} visible={execSection.visible} delay={300 + i * 120} from="bottom">
                  <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm card-hover h-full flex flex-col">
                    {/* Photo */}
                    <div className="relative h-72 overflow-hidden bg-gray-100">
                      <img
                        src={exec.image}
                        alt={exec.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#7B0F14]/50 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <span className="bg-[#DAA520] text-white text-[10px] font-black px-3 py-1 rounded-full tracking-wider uppercase">
                          {exec.role}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <GoldCoin size={18} />
                        <h3 className="font-black text-gray-900">{exec.name}</h3>
                      </div>

                      <p className="text-gray-500 text-sm leading-relaxed flex-1 whitespace-pre-line">
                        {isExpanded ? exec.bio : truncate(exec.bio)}
                      </p>

                      {needsTrunc && (
                        <button
                          onClick={() => toggleBio(exec.name)}
                          className="mt-3 text-[#7B0F14] text-sm font-bold hover:underline inline-flex items-center gap-1 self-start"
                        >
                          {isExpanded ? 'Read Less' : 'Read More'}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                            className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </button>
                      )}

                      <div className="mt-5 pt-5 border-t border-gray-100">
                        <a
                          href={exec.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[#7B0F14] text-sm font-bold hover:text-[#A52228] transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                          Connect on LinkedIn
                        </a>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>


          {/* 5b. Board of Directors */}
          <div ref={boardSection.ref}>
            <Reveal visible={boardSection.visible} delay={0} from="bottom">
              <div className="flex items-center gap-4 mt-20 mb-10">
                <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-5 py-2.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
                    <rect x="2" y="7" width="20" height="14" rx="2"/>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                  </svg>
                  <span className="text-gray-700 text-xs font-black tracking-[0.2em] uppercase">Board of Directors</span>
                </div>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
              </div>
            </Reveal>

            <Reveal visible={boardSection.visible} delay={80} from="fade">
              <p className="text-gray-500 mb-10 max-w-2xl leading-relaxed">
                Our board provides strategic oversight, governance, and long-term direction — ensuring CashToken UK operates with the highest standards of integrity and accountability.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {boardMembers.map((member, i) => {
                const key = `board-${member.name}`;
                const isExpanded = expandedBio === key;
                const needsTrunc = member.bio.length > 160;
                return (
                  <Reveal key={key} visible={boardSection.visible} delay={100 + i * 80} from={i % 2 === 0 ? 'left' : 'right'}>
                    <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm card-hover h-full flex flex-col">
                      {/* Image or initial block */}
                      <div className="relative h-52 overflow-hidden">
                        {member.image ? (
                          <img
                            src={member.image}
                            alt={member.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${member.color} flex items-center justify-center group-hover:scale-105 transition-transform duration-700`}>
                            <span className="text-white text-5xl font-black opacity-80">{member.initials}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-4">
                          <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1 rounded-full tracking-wider uppercase border border-white/30">
                            {member.role}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full bg-[#DAA520]" />
                          <h3 className="font-black text-gray-900 text-sm">{member.name}</h3>
                        </div>

                        <p className="text-gray-500 text-sm leading-relaxed flex-1 whitespace-pre-line">
                          {isExpanded ? member.bio : truncate(member.bio)}
                        </p>

                        {needsTrunc && (
                          <button
                            onClick={() => toggleBio(key)}
                            className="mt-3 text-[#7B0F14] text-sm font-bold hover:underline inline-flex items-center gap-1 self-start"
                          >
                            {isExpanded ? 'Read Less' : 'Read More'}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                              className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════ */}
      {/* CTA FOOTER STRIP */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20" style={{
        background: 'linear-gradient(-45deg,#2D0508,#7B0F14,#5A1018,#3D0C11)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 14s ease infinite',
      }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, #DAA520 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="float-coin inline-block mb-6">
            <GoldCoin size={56} animate />
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Ready to earn with <span className="shimmer-gold">CashToken</span>?
          </h2>
          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of UK shoppers already turning everyday purchases into life-changing rewards.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => onNavigate('ukconsumer')}
              className="bg-[#DAA520] hover:bg-[#C4941A] text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl hover:-translate-y-1 inline-flex items-center gap-2.5"
            >
              Start Earning Now
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
            <button
              onClick={() => onNavigate('ukbusiness')}
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-bold border border-white/20 hover:border-white/40 transition-all hover:-translate-y-1"
            >
              For Businesses
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UK_AboutUs;