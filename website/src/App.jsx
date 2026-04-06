import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Outlet, useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Menu, X, ArrowRight, MessageCircle,
  MapPin, Mail, Phone, ArrowUpRight, CheckCircle2, Beaker, Settings, Box,
  Minus, Plus, Microscope, Factory, ShieldCheck, Award, Activity, Droplets,
  Search, Filter, Tag, Package, Sparkles, Layers, Target, Zap, Globe2, Lock,
  Calendar, Clock, ChevronRight, Hexagon
} from 'lucide-react';
import { useCms } from './cms/CmsContext.jsx';
import { useLocale } from './i18n/LocaleContext.jsx';
import {
  cmsZhElseT,
  formatCategoryTabLabel,
  labelProductCategory,
  labelProductCategoryTab,
  navLabelForItem,
} from './i18n/helpers.js';
import { getDefaultAboutPage } from './lib/sanity/index.js';
import { submitInquiry } from './lib/inquiry/submitInquiry.js';

// 数据全部由 Sanity 提供（CmsContext）；询盘经 /api/inquiries 服务端写入 Sanity

function resolveProductByRouteParam(products, param) {
  const n = Number(param);
  if (param !== undefined && param !== '' && Number.isFinite(n)) {
    const hit = products.find((p) => p.id === n);
    if (hit) return hit;
  }
  return products.find((p) => p.slug === param || p.sanityId === param);
}

function resolveArticleByRouteParam(articles, param) {
  const n = Number(param);
  if (param !== undefined && param !== '' && Number.isFinite(n)) {
    const hit = articles.find((a) => a.id === n);
    if (hit) return hit;
  }
  return articles.find((a) => a.slug === param || a.sanityId === param);
}

function resolveCaseStudyBySlug(caseStudies, slug) {
  return caseStudies.find((c) => c.slug === slug || c.sanityId === slug);
}

function resolveSimplePageBySlug(simplePages, slug) {
  return simplePages.find((p) => p.slug === slug || p.sanityId === slug);
}

function isExternalHref(href) {
  return /^https?:\/\//i.test(href || '');
}

/** @param {import('react-router-dom').NavigateFunction} navigate */
function followHref(navigate, href, newTab) {
  if (!href || href === '#') return;
  if (isExternalHref(href)) {
    if (newTab) window.open(href, '_blank', 'noopener,noreferrer');
    else window.location.assign(href);
    return;
  }
  const path = href.startsWith('/') ? href : `/${href}`;
  navigate(path);
}

function productDetailPath(product) {
  return `/products/${product.slug || product.id}`;
}

const DEFAULT_MAIN_NAV = [
  { path: '/', label: '首页', external: false, newTab: false },
  { path: '/about', label: '品牌探索', external: false, newTab: false },
  { path: '/services', label: '代工方案', external: false, newTab: false },
  { path: '/products', label: '产品中心', external: false, newTab: false },
  { path: '/news', label: '资讯中心', external: false, newTab: false },
  { path: '/faq', label: '合作指引', external: false, newTab: false },
  { path: '/contact', label: '全球联络', external: false, newTab: false },
];

function navItemActive(pathname, item) {
  if (item.external) return false;
  const p = item.path;
  if (pathname === p) return true;
  if (p.length > 1 && pathname.startsWith(`${p}/`)) return true;
  return false;
}

// ==========================================
// 共享组件 (Shared Components)
// ==========================================

function CmsLoadingScreen({ message }) {
  const { t } = useLocale();
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-400 text-[14px] font-light tracking-wide">
      {message ?? t('common.loading')}
    </div>
  );
}

const SharedContactCTA = ({ source = 'cta', sourceProductId }) => {
  const { siteSettings } = useCms();
  const { t } = useLocale();
  const location = useLocation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hint, setHint] = useState('');

  const phoneDisplay = siteSettings?.contactPhone
    ? `${t('inquiry.hotlinePrefix')}${siteSettings.contactPhone}`
    : `${t('inquiry.hotlinePrefix')}${t('inquiry.hotlineDefault')}`;
  const waDisplay = siteSettings?.contactWhatsapp
    ? `${t('inquiry.waPrefix')}${siteSettings.contactWhatsapp}`
    : `${t('inquiry.waPrefix')}${t('inquiry.waDefault')}`;
  const mailDisplay = siteSettings?.contactEmail || 'yozobeauty@outlook.com';

  const submit = async (e) => {
    e.preventDefault();
    setHint('');
    if (!name.trim() || (!phone.trim() && !email.trim())) {
      setHint(t('inquiry.errRequired'));
      return;
    }
    setSubmitting(true);
    try {
      await submitInquiry({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        company: company.trim(),
        message: message.trim(),
        source,
        sourcePath: location.pathname,
        sourceProductId: sourceProductId || undefined,
      });
      setHint(t('inquiry.success'));
      setName('');
      setPhone('');
      setEmail('');
      setCompany('');
      setMessage('');
    } catch (err) {
      setHint(err.message || t('inquiry.errSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact-cta" className="py-24 md:py-32 bg-white">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-gray-100 rounded-[24px] bg-white overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="p-6 sm:p-10 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden bg-[#FAFAFA]">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-[#111111]"></div>
                <span className="text-[11px] tracking-[0.2em] text-gray-500 uppercase font-medium">{t('inquiry.badge')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight mb-6 leading-[1.15] text-[#111111]">
                {t('inquiry.h2l1')}
                <br className="hidden sm:block" />
                {t('inquiry.h2l2')}
              </h2>
              <p className="text-gray-500 font-light leading-relaxed mb-12 text-[15px]">
                {t('inquiry.lead')}
              </p>
            </div>
            <div className="space-y-5 pt-8 border-t border-gray-200 relative z-10">
              <div className="flex items-center gap-4 text-[14px] font-light text-gray-600 hover:text-[#111111] transition-colors">
                <Phone size={18} className="text-gray-400" strokeWidth={1.5} />
                <span>{phoneDisplay}</span>
              </div>
              <div className="flex items-center gap-4 text-[14px] font-light text-gray-600 hover:text-[#111111] transition-colors">
                <MessageCircle size={18} className="text-gray-400" strokeWidth={1.5} />
                <span>{waDisplay}</span>
              </div>
              <div className="flex items-center gap-4 text-[14px] font-light text-gray-600 hover:text-[#111111] transition-colors">
                <Mail size={18} className="text-gray-400" strokeWidth={1.5} />
                <span>{mailDisplay}</span>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 sm:p-10 md:p-12 lg:p-16 text-[#111111] flex flex-col justify-center">
            <h3 className="text-2xl font-light mb-10">{t('inquiry.formTitle')}</h3>
            <form className="space-y-8" onSubmit={submit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder={t('inquiry.phName')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border-b border-gray-200 pb-3 text-[14px] focus:outline-none focus:border-[#111111] transition-colors placeholder:text-gray-400 font-light"
                  />
                </div>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder={t('inquiry.phPhone')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent border-b border-gray-200 pb-3 text-[14px] focus:outline-none focus:border-[#111111] transition-colors placeholder:text-gray-400 font-light"
                  />
                </div>
              </div>
              <div className="relative group">
                <input
                  type="email"
                  placeholder={t('inquiry.phEmail')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-gray-200 pb-3 text-[14px] focus:outline-none focus:border-[#111111] transition-colors placeholder:text-gray-400 font-light"
                />
              </div>
              <div className="relative group">
                <input
                  type="text"
                  placeholder={t('inquiry.phCompany')}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-transparent border-b border-gray-200 pb-3 text-[14px] focus:outline-none focus:border-[#111111] transition-colors placeholder:text-gray-400 font-light"
                />
              </div>
              <div className="relative group">
                <textarea
                  placeholder={t('inquiry.phMsg')}
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-transparent border-b border-gray-200 pb-3 text-[14px] focus:outline-none focus:border-[#111111] transition-colors resize-none placeholder:text-gray-400 font-light"
                />
              </div>
              {hint ? <p className="text-[13px] text-gray-500 font-light">{hint}</p> : null}
              <button
                type="submit"
                disabled={submitting}
                className="group bg-[#1A1A1A] text-white w-full py-4 text-[13px] font-medium tracking-widest hover:bg-black transition-all duration-300 rounded-full mt-4 flex justify-center items-center gap-2 shadow-md disabled:opacity-60"
              >
                {submitting ? t('contact.submitting') : t('inquiry.submit')}{' '}
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

// ==========================================
// 页面组件 (Pages)
// ==========================================

// --- 首页 (HomePage) ---
const HomePage = () => {
  const navigate = useNavigate();
  const { locale, t } = useLocale();
  const { products, faqs, loading, error, reload, siteSettings } = useCms();
  const [openFaq, setOpenFaq] = useState(0);

  const featuredProducts = useMemo(() => {
    const hand = siteSettings?.homeFeaturedProducts;
    if (Array.isArray(hand) && hand.length > 0) return hand;
    return products.slice(0, 4);
  }, [siteSettings?.homeFeaturedProducts, products]);

  const homeFaqs = useMemo(() => {
    const hand = siteSettings?.homeFeaturedFaqs;
    if (Array.isArray(hand) && hand.length > 0) return hand;
    const flagged = faqs.filter((f) => f.showOnHome);
    if (flagged.length > 0) return flagged.slice(0, 8);
    return faqs.slice(0, 4);
  }, [siteSettings?.homeFeaturedFaqs, faqs]);

  const homeCases = useMemo(() => {
    const list = siteSettings?.homeFeaturedCaseStudies;
    return Array.isArray(list) && list.length > 0 ? list : [];
  }, [siteSettings?.homeFeaturedCaseStudies]);

  const trustBadgeText = cmsZhElseT(locale, siteSettings?.trustBadge, 'home.trustBadgeFallback', t);
  const heroTitleText = cmsZhElseT(locale, siteSettings?.heroTitle, 'home.heroTitle', t);
  const heroSubtitleText = cmsZhElseT(locale, siteSettings?.heroSubtitle, 'home.heroSubtitle', t);
  const primaryCtaLabel =
    locale === 'zh' && siteSettings?.heroPrimaryCta?.label?.trim()
      ? siteSettings.heroPrimaryCta.label.trim()
      : t('home.heroPrimaryCta');
  const secondaryCtaLabel =
    locale === 'zh' && siteSettings?.heroSecondaryCta?.label?.trim()
      ? siteSettings.heroSecondaryCta.label.trim()
      : t('home.heroSecondaryCta');
  const coreLabTitle =
    locale === 'zh' && siteSettings?.coreCompetenceLabTitle?.trim()
      ? siteSettings.coreCompetenceLabTitle.trim()
      : t('home.coreLabTitle');
  const coreLabBody =
    locale === 'zh' && siteSettings?.coreCompetenceLabBody?.trim()
      ? siteSettings.coreCompetenceLabBody.trim()
      : t('home.coreLabBody');
  const coreGmpcTitle =
    locale === 'zh' && siteSettings?.coreCompetenceGmpcTitle?.trim()
      ? siteSettings.coreCompetenceGmpcTitle.trim()
      : t('home.coreGmpcTitle');
  const coreGmpcBody =
    locale === 'zh' && siteSettings?.coreCompetenceGmpcBody?.trim()
      ? siteSettings.coreCompetenceGmpcBody.trim()
      : t('home.coreGmpcBody');
  const faqSectionHeading = cmsZhElseT(locale, siteSettings?.faqSectionTitle, 'home.faqSectionTitle', t);

  const whyItems = useMemo(
    () => [
      { icon: <Target size={24} strokeWidth={1.5} />, title: t('home.why1t'), desc: t('home.why1d') },
      { icon: <Zap size={24} strokeWidth={1.5} />, title: t('home.why2t'), desc: t('home.why2d') },
      { icon: <Lock size={24} strokeWidth={1.5} />, title: t('home.why3t'), desc: t('home.why3d') },
      { icon: <Activity size={24} strokeWidth={1.5} />, title: t('home.why4t'), desc: t('home.why4d') },
    ],
    [t],
  );

  if (loading) return <CmsLoadingScreen />;
  if (error) {
    return (
      <div className="pt-28 md:pt-36 lg:pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{error}</p>
        <button type="button" onClick={() => reload()} className="mt-6 text-[#111111] underline">
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="yozo-animate-page-in">
      
      {/* 1. 首屏模块 */}
      <section className="relative min-h-[max(100dvh,520px)] sm:min-h-[max(100dvh,600px)] md:min-h-[max(100dvh,680px)] flex items-center justify-center overflow-hidden bg-[#FAFAFA] py-16 sm:py-20 md:py-0">
        <div className="absolute inset-0 z-0">
          {siteSettings?.heroBackgroundVideoUrl ? (
            <video
              className="w-full h-full object-cover scale-105 opacity-60 grayscale-[10%]"
              src={siteSettings.heroBackgroundVideoUrl}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <img
              src={siteSettings?.heroImageUrl || 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=2000'}
              alt=""
              className="w-full h-full object-cover scale-105 animate-[pulse_30s_ease-in-out_infinite] opacity-60 filter grayscale-[10%]"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  'https://dummyimage.com/2000x1125/e5e7eb/374151.png&text=YOZO';
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/60 via-[#111111]/30 to-[#FAFAFA]"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center text-white mt-12 sm:mt-16 md:mt-20 max-w-[100vw]">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 bg-white/20 backdrop-blur-xl border border-white/30 px-4 sm:px-5 py-2 rounded-full text-[10px] sm:text-[11px] tracking-widest uppercase mb-6 sm:mb-8 text-white max-w-[95vw]">
            <ShieldCheck size={14} className="shrink-0" />
            <span className="text-center leading-snug">{trustBadgeText}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6 leading-[1.15] max-w-5xl mx-auto drop-shadow-sm px-1">
            {heroTitleText.split('\n').map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 ? <br /> : null}
              </span>
            ))}
          </h1>
          <p className="text-sm sm:text-base md:text-xl font-light text-white/90 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-1">
            {heroSubtitleText.split('\n').map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none mx-auto px-1">
            <button
              type="button"
              onClick={() =>
                siteSettings?.heroPrimaryCta?.href
                  ? followHref(navigate, siteSettings.heroPrimaryCta.href)
                  : navigate('/services')
              }
              className="group bg-white text-[#111111] px-8 py-3.5 text-[14px] font-medium tracking-wide transition-all duration-300 rounded-full flex items-center justify-center gap-2 hover:shadow-lg"
            >
              {primaryCtaLabel}{' '}
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1"/>
            </button>
            <button
              type="button"
              onClick={() =>
                siteSettings?.heroSecondaryCta?.href
                  ? followHref(navigate, siteSettings.heroSecondaryCta.href)
                  : navigate('/contact')
              }
              className="group border border-white/50 bg-white/5 backdrop-blur-md text-white px-8 py-3.5 text-[14px] font-medium tracking-wide hover:bg-white hover:text-[#111111] transition-all duration-300 rounded-full flex items-center justify-center"
            >
              {secondaryCtaLabel}
            </button>
          </div>
        </div>
      </section>

      {/* 2. 国际认证与供应链信任背书墙 */}
      <section className="bg-[#FAFAFA] pt-8 pb-20 relative z-20">
        <div className="container mx-auto px-4">
          <div className="text-[11px] tracking-[0.2em] text-center text-gray-400 uppercase mb-8 font-medium">{t('home.trustLine')}</div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500 text-sm md:text-lg font-bold tracking-tighter">
            <span className="flex items-center gap-1"><Globe2 size={18}/> SGS Tested</span>
            <span>BASF</span>
            <span>DSM</span>
            <span>Symrise</span>
            <span>Lubrizol</span>
            <span>Givaudan</span>
            <span className="flex items-center gap-1"><Award size={18}/> FDA Compliant</span>
          </div>
        </div>
      </section>

      {/* 3. 数据与优势指标 */}
      <section className="bg-white py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 max-w-6xl">
          <div className="bg-[#FAFAFA] rounded-xl md:rounded-2xl p-5 md:p-8 text-center hover:-translate-y-1 transition-transform duration-300">
            <div className="text-3xl md:text-5xl font-light mb-1 md:mb-2 text-[#111111]">15+</div><div className="text-[11px] md:text-[12px] text-gray-500 font-medium">{t('home.statYears')}</div>
          </div>
          <div className="bg-[#FAFAFA] rounded-xl md:rounded-2xl p-5 md:p-8 text-center hover:-translate-y-1 transition-transform duration-300">
            <div className="text-3xl md:text-5xl font-light mb-1 md:mb-2 text-[#111111]">10k+</div><div className="text-[11px] md:text-[12px] text-gray-500 font-medium">{t('home.statFormulas')}</div>
          </div>
          <div className="bg-[#FAFAFA] rounded-xl md:rounded-2xl p-5 md:p-8 text-center hover:-translate-y-1 transition-transform duration-300">
            <div className="text-3xl md:text-5xl font-light mb-1 md:mb-2 text-[#111111]">10w</div><div className="text-[11px] md:text-[12px] text-gray-500 font-medium">{t('home.statClean')}</div>
          </div>
          <div className="bg-[#FAFAFA] rounded-xl md:rounded-2xl p-5 md:p-8 text-center hover:-translate-y-1 transition-transform duration-300">
            <div className="text-3xl md:text-5xl font-light mb-1 md:mb-2 text-[#111111]">1M+</div><div className="text-[11px] md:text-[12px] text-gray-500 font-medium">{t('home.statCap')}</div>
          </div>
        </div>
      </section>

      {/* 4. OEM/ODM 模式总览 */}
      <section className="py-16 md:py-24 lg:py-32 bg-[#FAFAFA]">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16 md:mb-20">
            <div className="text-[11px] tracking-[0.2em] text-gray-400 uppercase mb-4 font-bold">{t('home.serviceEyebrow')}</div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-6 text-[#111111]">{t('home.serviceTitle')}</h2>
            <p className="text-gray-500 font-light max-w-2xl mx-auto text-[15px]">{t('home.serviceLead')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 md:gap-8 max-w-6xl mx-auto">
            <div className="bg-white border border-gray-100/50 p-6 md:p-10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 group cursor-pointer rounded-[20px] md:rounded-[24px]" onClick={() => navigate('/services')}>
              <Settings size={28} className="mb-4 md:mb-6 text-gray-400 group-hover:text-[#111111] transition-colors" strokeWidth={1.5} />
              <div className="text-[11px] font-bold tracking-widest text-[#1A1A1A] mb-2 uppercase">Original Equipment Mfg</div>
              <h3 className="text-xl md:text-2xl font-light mb-3 md:mb-4">{t('home.oemTitle')}</h3>
              <p className="text-[13px] md:text-[14px] text-gray-500 font-light leading-relaxed">{t('home.oemCardLead')}</p>
            </div>
            <div className="bg-[#1A1A1A] text-white p-6 md:p-10 shadow-[0_10px_40px_rgb(0,0,0,0.1)] transform md:-translate-y-4 cursor-pointer rounded-[20px] md:rounded-[24px]" onClick={() => navigate('/services')}>
              <Beaker size={28} className="mb-4 md:mb-6 text-gray-300" strokeWidth={1.5} />
              <div className="text-[11px] font-bold tracking-widest text-gray-400 mb-2 uppercase">Original Design Mfg</div>
              <h3 className="text-xl md:text-2xl font-light mb-3 md:mb-4">{t('home.odmTitle')}</h3>
              <p className="text-[13px] md:text-[14px] text-gray-400 font-light leading-relaxed">{t('home.odmCardLead')}</p>
            </div>
            <div className="bg-white border border-gray-100/50 p-6 md:p-10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 group cursor-pointer rounded-[20px] md:rounded-[24px]" onClick={() => navigate('/services')}>
              <Box size={28} className="mb-4 md:mb-6 text-gray-400 group-hover:text-[#111111] transition-colors" strokeWidth={1.5} />
              <div className="text-[11px] font-bold tracking-widest text-[#1A1A1A] mb-2 uppercase">Private Label / OBM</div>
              <h3 className="text-xl md:text-2xl font-light mb-3 md:mb-4">{t('home.obmTitle')}</h3>
              <p className="text-[13px] md:text-[14px] text-gray-500 font-light leading-relaxed">{t('home.obmCardLead')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 厂房与研发实力 */}
      <section className="py-16 md:py-24 lg:py-32 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-20">
            <div className="text-[11px] tracking-[0.2em] text-gray-400 uppercase mb-4 font-bold">{t('home.coreEyebrow')}</div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-6">{t('home.coreTitle')}</h2>
            <p className="text-gray-500 font-light max-w-2xl mx-auto text-[15px]">{t('home.coreLead')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">
            <div className="group bg-[#FAFAFA] p-8 md:p-12 border border-gray-100/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 rounded-[24px]">
              <div className="mb-8 overflow-hidden relative aspect-[16/9] rounded-[16px]">
                <img
                  src={
                    siteSettings?.coreCompetenceLabImageUrl ||
                    'https://dummyimage.com/1600x900/e5e7eb/374151.png&text=Lab'
                  }
                  alt={t('home.labAlt')}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter grayscale-[10%]"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'https://dummyimage.com/1600x900/e5e7eb/374151.png&text=Lab';
                  }}
                />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Microscope size={24} className="text-[#111111]" strokeWidth={1.5} />
                <h3 className="text-2xl font-light text-[#111111]">{coreLabTitle}</h3>
              </div>
              <p className="text-[14px] text-gray-500 font-light leading-relaxed">{coreLabBody}</p>
            </div>

            <div className="group bg-[#1A1A1A] text-white p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all duration-500 rounded-[24px]">
              <div className="mb-8 overflow-hidden relative aspect-[16/9] rounded-[16px]">
                <img
                  src={
                    siteSettings?.coreCompetenceGmpcImageUrl ||
                    'https://dummyimage.com/1600x900/111827/e5e7eb.png&text=GMPC'
                  }
                  alt={t('home.gmpcAlt')}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-70"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'https://dummyimage.com/1600x900/111827/e5e7eb.png&text=GMPC';
                  }}
                />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Factory size={24} className="text-gray-300" strokeWidth={1.5} />
                <h3 className="text-2xl font-light">{coreGmpcTitle}</h3>
              </div>
              <p className="text-[14px] text-gray-400 font-light leading-relaxed">{coreGmpcBody}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. 四大核心商业优势 */}
      <section className="py-14 md:py-24 bg-[#FAFAFA]">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <div className="text-[11px] tracking-[0.2em] text-gray-400 uppercase mb-4 font-bold">{t('home.whyEyebrow')}</div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">{t('home.whyTitle')}</h2>
            <p className="text-gray-500 font-light text-[15px] max-w-2xl mx-auto">{t('home.whyLead')}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
            {whyItems.map((item, idx) => (
              <div key={idx} className="bg-white p-5 md:p-8 border border-gray-100/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 rounded-[16px] md:rounded-[20px]">
                <div className="text-[#111111] mb-4">{item.icon}</div>
                <h4 className="text-[14px] md:text-[16px] font-medium mb-2">{item.title}</h4>
                <p className="text-[12px] md:text-[13px] text-gray-500 font-light leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. 全球出口与市场覆盖 */}
      <div className="relative py-32 md:py-40 bg-[#1A1A1A] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000" alt={t('home.globalNetAlt')} className="w-full h-full object-cover opacity-[0.15] filter grayscale mix-blend-screen" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A] via-[#1A1A1A]/80 to-transparent"></div>
        </div>

        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-white"></div>
              <span className="text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase">{t('home.worldEyebrow')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-6 leading-[1.15]">
              {t('home.worldTitle1')}
              <br />
              {t('home.worldTitle2')}
            </h2>
            <p className="text-gray-400 font-light text-base md:text-lg leading-relaxed mb-12 max-w-xl">
              {t('home.worldLead')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-white/10 pt-10">
               <div className="group">
                  <div className="flex items-center gap-3 mb-3">
                    <ShieldCheck size={20} className="text-white" strokeWidth={1.5} />
                    <h4 className="text-[15px] font-medium text-white">{t('home.worldLawT')}</h4>
                  </div>
                  <p className="text-[13px] text-gray-400 font-light leading-relaxed">
                    {t('home.worldLawD')}
                  </p>
               </div>
               <div className="group">
                  <div className="flex items-center gap-3 mb-3">
                    <Globe2 size={20} className="text-white" strokeWidth={1.5} />
                    <h4 className="text-[15px] font-medium text-white">{t('home.worldLogT')}</h4>
                  </div>
                  <p className="text-[13px] text-gray-400 font-light leading-relaxed">
                    {t('home.worldLogD')}
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* 8. 精选热门配方 */}
      <section className="py-14 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-16 gap-4 md:gap-6">
            <div>
              <div className="text-[11px] tracking-[0.2em] text-gray-400 uppercase mb-4 font-bold">{t('home.featEyebrow')}</div>
              <h2 className="text-3xl md:text-4xl font-light tracking-tight">{t('home.featTitle')}</h2>
            </div>
            <button onClick={() => navigate('/products')} className="group flex items-center gap-2 text-[14px] font-medium tracking-wide text-gray-500 hover:text-[#111111] transition-colors">
              {t('products.browseProducts')} <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map(product => (
              <div key={product.id} className="group cursor-pointer bg-[#FAFAFA] border border-gray-100/50 rounded-[16px] md:rounded-[20px] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-500" onClick={() => navigate(productDetailPath(product))}>
                <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden bg-gray-100 mb-2 md:mb-3 rounded-t-[16px] md:rounded-t-[20px]">
                  {product.img
                    ? <img src={product.img} alt={``} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-300 text-[11px] tracking-widest uppercase">No Image</div>
                  }
                </div>
                <div className="p-3 md:p-5 pt-1 md:pt-2">
                  <div className="text-[9px] md:text-[10px] tracking-widest text-gray-400 uppercase mb-1">{labelProductCategory(product, locale)}</div>
                  <h3 className="text-[13px] md:text-[15px] font-medium group-hover:text-[#1A1A1A] transition-colors line-clamp-2 text-[#333]">{product.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8b. 首页精选案例（Studio homePage.featuredCaseStudies） */}
      {homeCases.length > 0 ? (
        <section className="py-24 bg-[#FAFAFA] border-t border-gray-100">
          <div className="container mx-auto px-6 md:px-12">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <div className="text-[11px] tracking-[0.2em] text-gray-400 uppercase mb-4 font-bold">Case Studies</div>
                <h2 className="text-3xl md:text-4xl font-light tracking-tight">{t('home.casesTitle')}</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
              {homeCases.map((c) => (
                <article
                  key={c.sanityId || c.id}
                  className="group cursor-pointer bg-white border border-gray-100 rounded-[20px] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300"
                  onClick={() => navigate(`/cases/${c.slug || c.id}`)}
                >
                  {c.img ? (
                    <div className="aspect-[16/10] overflow-hidden bg-gray-50">
                      <img src={c.img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                  ) : null}
                  <div className="p-6">
                    {c.industry ? (
                      <div className="text-[10px] tracking-widest text-gray-400 uppercase mb-2">{c.industry}</div>
                    ) : null}
                    <h3 className="text-lg font-medium text-[#111111] line-clamp-2">{c.title}</h3>
                    {c.excerpt ? (
                      <p className="mt-3 text-[13px] text-gray-500 font-light line-clamp-2">{c.excerpt}</p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* 9. 首页精简 FAQ 区域 */}
      <section className="py-24 bg-[#FAFAFA] border-t border-gray-100">
        <div className="container mx-auto px-6 md:px-12 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
              {faqSectionHeading}
            </h2>
            <p className="text-gray-500 font-light text-[15px]">{t('home.faqSectionLead')}</p>
          </div>
          <div className="border-t border-gray-200/60">
            {homeFaqs.map((faq, idx) => (
              <div key={faq.sanityId || faq.id || idx} className="border-b border-gray-200/60 bg-white">
                <button className="w-full py-6 px-6 flex justify-between items-center text-left hover:text-gray-500 transition-colors" onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}>
                  <span className={`text-[15px] md:text-[16px] font-light pr-8 ${openFaq === idx ? 'text-[#111111] font-medium' : 'text-[#333]'}`}>{faq.q}</span>
                  <span className={openFaq === idx ? 'text-[#111111]' : 'text-gray-400'}>{openFaq === idx ? <Minus size={18} strokeWidth={1.5} /> : <Plus size={18} strokeWidth={1.5} />}</span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out px-6 ${openFaq === idx ? 'max-h-[60rem] opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
                  <p className="text-gray-500 font-light text-[14px] leading-relaxed pr-8">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button onClick={() => navigate('/faq')} className="group flex items-center justify-center gap-2 mx-auto text-[14px] font-medium text-gray-500 hover:text-[#111111] transition-colors">
              {t('home.browseFullGuide')} <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1"/>
            </button>
          </div>
        </div>
      </section>
      
      {/* 10. 全局联系表单 */}
      <SharedContactCTA source="home-cta" />
    </div>
  );
};

function aboutCertIcon(icon) {
  switch (icon) {
    case 'award':
      return Award;
    case 'globe':
      return Globe2;
    case 'activity':
      return Activity;
    case 'shield':
    default:
      return ShieldCheck;
  }
}

// --- About Us 品牌探索（Sanity aboutPage，缺省见 getDefaultAboutPage）---
const AboutPage = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const { aboutPage, loading, error, reload } = useCms();
  const a = aboutPage ?? getDefaultAboutPage();

  if (loading && !aboutPage) {
    return <CmsLoadingScreen />;
  }
  if (error) {
    return (
      <div className="pt-28 md:pt-36 lg:pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{error}</p>
        <button type="button" onClick={() => reload()} className="mt-6 text-[#111111] underline">
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="yozo-animate-page-in bg-white">
      <div className="pt-28 md:pt-36 lg:pt-40 pb-24 container mx-auto px-6 md:px-12 text-center">
        <div className="inline-flex items-center gap-3 mb-8">
          <span className="h-px w-8 bg-gray-200"></span>
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-gray-400">{a.heroEyebrow}</span>
          <span className="h-px w-8 bg-gray-200"></span>
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-light tracking-tight mb-6 sm:mb-8 leading-[1.15] text-[#111111] px-1">
          {String(a.heroTitle || '')
            .split('\n')
            .map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 ? <br className="hidden md:block" /> : null}
              </span>
            ))}
        </h1>
        <p className="text-gray-500 font-light max-w-2xl mx-auto text-base sm:text-lg leading-relaxed whitespace-pre-line px-1">
          {a.heroSubtitle}
        </p>
      </div>

      <div className="relative h-[min(52dvh,380px)] sm:h-[min(56dvh,440px)] md:h-[60vh] md:min-h-[460px] w-full overflow-hidden mb-16 md:mb-24">
        <img
          src={a.labImageUrl}
          alt=""
          className="w-full h-full object-cover filter grayscale-[20%]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
          <h2 className="text-white text-xl sm:text-3xl md:text-5xl font-light tracking-widest uppercase mb-3 sm:mb-4 leading-snug max-w-[90vw]">
            {String(a.labOverlayTitle || '')
              .split('\n')
              .map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 ? <br /> : null}
                </span>
              ))}
          </h2>
          <p className="text-white/80 font-light tracking-widest text-[13px] uppercase">{a.labOverlaySubtitle}</p>
        </div>
      </div>

      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6 md:px-12 max-w-4xl text-center">
          <h3 className="text-2xl md:text-3xl font-light text-[#111111] mb-8 leading-relaxed whitespace-pre-line">
            {a.manifestoQuote}
          </h3>
          <p className="text-gray-500 font-light leading-loose text-[15px] whitespace-pre-line">{a.manifestoBody}</p>
        </div>
      </section>

      <section className="py-24 bg-[#FAFAFA] border-y border-gray-100">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-20">
            <div className="text-[11px] tracking-[0.3em] text-gray-400 uppercase mb-4 font-bold">{a.portfolioEyebrow}</div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-6 text-[#111111]">{a.portfolioTitle}</h2>
            <p className="text-gray-500 font-light max-w-2xl mx-auto text-[15px] whitespace-pre-line">
              {a.portfolioIntro}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {a.portfolioBrands.map((brand) => (
              <div
                key={brand.id}
                className="group bg-white rounded-[24px] overflow-hidden border border-gray-100/50 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-500"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
                  <img
                    src={brand.img}
                    alt={brand.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60"></div>
                  <div className="absolute bottom-6 left-6 text-white">
                    <div className="text-2xl font-bold tracking-widest uppercase mb-1">{brand.name}</div>
                  </div>
                </div>
                <div className="p-8">
                  <h4 className="text-[14px] font-medium text-[#111111] mb-3 flex items-center gap-2">
                    <Hexagon size={14} className="text-gray-300" /> {brand.subtitle}
                  </h4>
                  <p className="text-[13px] text-gray-500 font-light leading-relaxed whitespace-pre-line">{brand.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <button
              type="button"
              onClick={() => followHref(navigate, a.portfolioCtaHref || '/services')}
              className="group inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.1em] text-gray-500 hover:text-[#111111] transition-colors border-b border-transparent hover:border-[#111111] pb-1"
            >
              {a.portfolioCtaLabel}{' '}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <div className="mb-16">
            <h3 className="text-3xl font-light mb-4 text-[#111111]">{a.certSectionTitle}</h3>
            <p className="text-gray-400 font-light text-[13px] tracking-widest uppercase">{a.certSectionSubtitle}</p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 text-gray-800 max-w-5xl mx-auto">
            {a.certifications.map((c, idx) => {
              const IconComp = aboutCertIcon(c.icon);
              return (
                <div
                  key={`${c.title}-${idx}`}
                  className="flex flex-col items-center gap-4 opacity-50 hover:opacity-100 transition-opacity duration-300"
                >
                  <IconComp size={36} strokeWidth={1} />
                  <span className="text-lg font-bold tracking-widest">{c.title}</span>
                  <span className="text-[11px] text-gray-400 font-light">{c.subtitle}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <SharedContactCTA source="about" />
    </div>
  );
};

// --- OEM/ODM Services ---
const ServicesPage = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  return (
    <div className="yozo-animate-page-in pt-28 md:pt-36 lg:pt-40 bg-white min-h-screen">
      {/* Hero Section */}
      <div className="container mx-auto px-6 md:px-12 text-center mb-24 md:mb-32">
        <div className="inline-flex items-center gap-3 mb-6">
          <span className="h-px w-8 bg-gray-200"></span>
          <span className="text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase">{t('services.eyebrow')}</span>
          <span className="h-px w-8 bg-gray-200"></span>
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6 sm:mb-8 leading-[1.1] px-1">
          {t('services.h1l1')}
          <br className="hidden sm:block" />
          {t('services.h1l2')}
        </h1>
        <p className="text-gray-500 font-light max-w-2xl mx-auto text-[15px] sm:text-lg leading-relaxed mb-8 sm:mb-10 px-1">
          {t('services.lead').split('\n').map((line, i, arr) => (
            <span key={i}>
              {line}
              {i < arr.length - 1 ? <br className="hidden md:block" /> : null}
            </span>
          ))}
        </p>
        <button onClick={() => navigate('/contact')} className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-8 py-3.5 text-[14px] font-medium tracking-wide transition-all duration-300 rounded-full hover:bg-black hover:shadow-lg">
          {t('services.cta')} <ArrowRight size={16} />
        </button>
      </div>
      
      {/* 核心服务模式 */}
      <section className="bg-[#FAFAFA] py-24 border-y border-gray-100">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4 text-[#111111]">{t('services.modelsTitle')}</h2>
            <p className="text-gray-500 text-[15px] font-light max-w-2xl mx-auto">{t('services.modelsLead')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* OEM */}
            <article className="bg-white border border-gray-100/50 p-10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 flex flex-col h-full rounded-[24px]">
              <Settings size={32} className="mb-8 text-gray-300" strokeWidth={1} />
              <div className="text-[11px] font-bold tracking-widest text-[#111111] mb-3 uppercase">Original Equipment Mfg</div>
              <h3 className="text-2xl font-light mb-4">{t('services.oemH')}</h3>
              <p className="text-[14px] text-gray-500 font-light leading-relaxed mb-6">{t('services.oemP')}</p>
              <ul className="text-[13px] text-gray-400 font-light space-y-3 mt-auto border-t border-gray-100 pt-6">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#111111]"/>{t('services.oemL1')}</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#111111]"/>{t('services.oemL2')}</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#111111]"/>{t('services.oemL3')}</li>
              </ul>
            </article>
            
            {/* ODM */}
            <article className="bg-[#1A1A1A] text-white p-10 shadow-[0_10px_40px_rgb(0,0,0,0.1)] transform md:-translate-y-4 flex flex-col h-full rounded-[24px]">
              <Beaker size={32} className="mb-8 text-gray-400" strokeWidth={1} />
              <div className="text-[11px] font-bold tracking-widest text-gray-400 mb-3 uppercase">Original Design Mfg</div>
              <h3 className="text-2xl font-light mb-4">{t('services.odmH')}</h3>
              <p className="text-[14px] text-gray-400 font-light leading-relaxed mb-6">{t('services.odmP')}</p>
              <ul className="text-[13px] text-gray-400 font-light space-y-3 mt-auto border-t border-white/10 pt-6">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-white"/>{t('services.odmL1')}</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-white"/>{t('services.odmL2')}</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-white"/>{t('services.odmL3')}</li>
              </ul>
            </article>
            
            {/* OBM */}
            <article className="bg-white border border-gray-100/50 p-10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 flex flex-col h-full rounded-[24px]">
              <Box size={32} className="mb-8 text-gray-300" strokeWidth={1} />
              <div className="text-[11px] font-bold tracking-widest text-[#111111] mb-3 uppercase">Private Label / OBM</div>
              <h3 className="text-2xl font-light mb-4">{t('services.obmH')}</h3>
              <p className="text-[14px] text-gray-500 font-light leading-relaxed mb-6">{t('services.obmP')}</p>
              <ul className="text-[13px] text-gray-400 font-light space-y-3 mt-auto border-t border-gray-100 pt-6">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#111111]"/>{t('services.obmL1')}</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#111111]"/>{t('services.obmL2')}</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#111111]"/>{t('services.obmL3')}</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* 标准化代工流程 */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 md:px-12 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light tracking-tight mb-4 text-[#111111]">{t('services.flowTitle')}</h2>
            <p className="text-gray-500 text-[15px] font-light">{t('services.flowLead')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
             <div className="hidden lg:block absolute top-[40px] left-[10%] right-[10%] h-[1px] bg-gray-100 -z-10"></div>
             {[
               { step: '01', title: t('services.flow1t'), desc: t('services.flow1d') },
               { step: '02', title: t('services.flow2t'), desc: t('services.flow2d') },
               { step: '03', title: t('services.flow3t'), desc: t('services.flow3d') },
               { step: '04', title: t('services.flow4t'), desc: t('services.flow4d') },
             ].map((item, idx) => (
               <div key={idx} className="bg-white border border-gray-100 rounded-[20px] p-8 relative hover:-translate-y-2 transition-transform duration-500 shadow-sm">
                 <div className="w-12 h-12 rounded-full bg-[#FAFAFA] text-[#111111] flex items-center justify-center font-bold text-lg mb-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                   {item.step}
                 </div>
                 <h4 className="text-xl font-medium mb-3 text-[#111111]">{item.title}</h4>
                 <p className="text-[13px] text-gray-500 font-light leading-relaxed">{item.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* 核心工艺与产能 */}
      <section className="py-24 bg-[#1A1A1A] text-white">
        <div className="container mx-auto px-6 md:px-12 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <div className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-4">{t('services.capEyebrow')}</div>
              <h2 className="text-3xl font-light tracking-tight text-white">{t('services.capTitle')}</h2>
            </div>
            <p className="text-gray-400 font-light max-w-lg text-[14px]">
              {t('services.capLead')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-white/10 p-8 rounded-[20px] bg-white/5 backdrop-blur-sm">
              <Droplets className="text-gray-300 mb-6" size={28} strokeWidth={1.5} />
              <h4 className="text-xl font-medium mb-3">{t('services.cap1t')}</h4>
              <p className="text-[13px] text-gray-400 font-light leading-relaxed mb-4">
                {t('services.cap1d')}
              </p>
            </div>
            <div className="border border-white/10 p-8 rounded-[20px] bg-white/5 backdrop-blur-sm">
              <Layers className="text-gray-300 mb-6" size={28} strokeWidth={1.5} />
              <h4 className="text-xl font-medium mb-3">{t('services.cap2t')}</h4>
              <p className="text-[13px] text-gray-400 font-light leading-relaxed mb-4">
                {t('services.cap2d')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <SharedContactCTA source="services" />
    </div>
  );
};

// --- Products Center ---
const ProductsPage = () => {
  const navigate = useNavigate();
  const { locale, t } = useLocale();
  const { products, productCategories, loading, error, reload } = useCms();
  const [activeCategory, setActiveCategory] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(8);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = activeCategory === "全部" || p.category === activeCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [products, activeCategory, searchQuery]);

  if (loading) return <CmsLoadingScreen />;
  if (error) {
    return (
      <div className="pt-28 md:pt-36 lg:pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{error}</p>
        <button type="button" onClick={() => reload()} className="mt-6 text-[#111111] underline">
          {t('common.retry')}
        </button>
      </div>
    );
  }

  const hasMore = visibleCount < filteredProducts.length;

  return (
    <div className="yozo-animate-page-in pt-28 md:pt-36 lg:pt-40 pb-32 bg-[#FAFAFA] min-h-screen">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="h-px w-8 bg-gray-200"></span><span className="text-[11px] tracking-[0.2em] text-gray-400 uppercase font-bold">{t('products.eyebrow')}</span><span className="h-px w-8 bg-gray-200"></span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-6">{t('products.title')}</h1>
          <p className="text-gray-500 font-light max-w-2xl mx-auto text-[15px]">
            {t('products.lead').split('\n').map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 sm:gap-6 mb-12 bg-white p-4 sm:p-5 border border-gray-100 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] min-w-0">
          <div className="flex flex-nowrap md:flex-wrap items-center gap-2.5 w-full min-w-0 lg:w-auto flex-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0 [-webkit-overflow-scrolling:touch]">
            <Filter size={16} className="text-gray-300 mr-2 hidden lg:block shrink-0" />
            {productCategories.map((tab) => (
              <button 
                key={tab.canonical} onClick={() => { setActiveCategory(tab.canonical); setVisibleCount(8); }}
                className={`px-5 py-2 text-[13px] transition-all duration-300 rounded-full whitespace-nowrap border ${
                  activeCategory === tab.canonical ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md' : 'bg-transparent text-gray-500 hover:text-[#111111] border-gray-200 hover:border-gray-300'
                }`}
              >
                {labelProductCategoryTab(tab, locale, t)}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72 flex-shrink-0 mt-4 lg:mt-0">
            <input 
              type="text" placeholder={t('products.searchPh')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-gray-200 pl-10 pr-4 py-2.5 text-[13px] focus:outline-none focus:border-gray-400 rounded-full transition-colors"
            />
            <Search size={14} className="absolute left-4 top-3.5 text-gray-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
          {filteredProducts.slice(0, visibleCount).map(product => (
            <div key={product.id} className="group cursor-pointer bg-white border border-gray-100/80 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-500 flex flex-col h-full rounded-[20px]" onClick={() => navigate(`/products/${product.id}`)}>
              <div className="relative aspect-[4/4] overflow-hidden bg-gray-50 rounded-t-[20px]">
                <img src={product.img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <div className="text-[10px] tracking-widest text-gray-400 uppercase mb-2">{labelProductCategory(product, locale)}</div>
                <h3 className="text-[16px] font-medium mb-4 group-hover:text-[#111111] transition-colors line-clamp-1 text-[#333]">{product.name}</h3>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {product.tags.map((tag, i) => (
                    <span key={i} className="bg-[#FAFAFA] border border-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-sm"><Tag size={8} className="inline mr-1 opacity-50"/>{tag}</span>
                  ))}
                </div>
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-2 text-[11px] text-gray-400 font-light">
                  <Package size={12} /><span className="truncate">{t('products.packagingSuggest')}: {product.packaging}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="text-center">
            <button onClick={() => setVisibleCount(prev => prev + 4)} className="bg-white border border-gray-200 text-[#111111] px-10 py-3.5 text-[13px] font-medium hover:bg-gray-50 transition-colors rounded-full shadow-sm">
              {t('common.loadMoreFormulas')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 产品详情页 ---
const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { locale, t } = useLocale();
  const { products, loading, error, reload } = useCms();
  const [openFaq, setOpenFaq] = useState(0);

  const resolvedProduct = resolveProductByRouteParam(products, productId);
  const product = resolvedProduct ?? products[0];

  useEffect(() => {
    if (!loading && products.length && !resolvedProduct) {
      navigate(`/products/${products[0].id}`, { replace: true });
    }
  }, [loading, products, resolvedProduct, navigate]);

  if (loading || !products.length) return <CmsLoadingScreen />;
  if (error) {
    return (
      <div className="pt-28 md:pt-36 lg:pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{error}</p>
        <button type="button" onClick={() => reload()} className="mt-6 text-[#111111] underline">
          {t('common.retry')}
        </button>
      </div>
    );
  }

  const relatedProducts = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);

  const productFaqs = useMemo(
    () => [
      {
        q: t('products.faq1q').replace(/\{\{name\}\}/g, product.name),
        a: t('products.faq1a')
          .replace(/\{\{name\}\}/g, product.name)
          .replace(/\{\{oem\}\}/g, product.oemDesc || ''),
      },
      { q: t('products.faq2q'), a: t('products.faq2a') },
      { q: t('products.faq3q'), a: t('products.faq3a') },
    ],
    [t, product.name, product.oemDesc],
  );

  return (
    <div className="yozo-animate-page-in bg-white min-h-screen">
      
      {/* 1. 首屏：核心产品信息区 (Hero Section) */}
      <section className="pt-28 md:pt-36 lg:pt-40 pb-20 bg-[#FAFAFA] border-b border-gray-100">
        <div className="container mx-auto px-6 md:px-12">
          <button onClick={() => navigate('/products')} className="group text-[12px] font-medium tracking-[0.1em] text-gray-400 hover:text-[#111111] mb-12 flex items-center gap-2 transition-colors uppercase">
             <ArrowRight size={14} className="rotate-180 transition-transform group-hover:-translate-x-1" /> {t('common.backToFormulas')}
          </button>
          
          <article itemScope itemType="https://schema.org/Product" className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-24">
            
            {/* 左侧：产品视觉图 */}
            <div className="lg:col-span-5 relative min-w-0">
              <div className="bg-white aspect-[4/5] max-h-[min(70vh,520px)] lg:max-h-none rounded-[20px] sm:rounded-[24px] overflow-hidden border border-gray-100/80 p-4 sm:p-6 flex items-center justify-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] relative lg:sticky lg:top-28 xl:top-32">
                <img src={product.img} alt={product.name} itemProp="image" className="w-full h-full object-cover rounded-[12px] hover:scale-105 transition-transform duration-1000" />
                <div className="absolute top-4 left-4 sm:top-10 sm:left-10 bg-white/90 backdrop-blur text-[#111111] px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold tracking-widest uppercase shadow-sm">
                  Ready to Label
                </div>
              </div>
            </div>
            
            {/* 右侧：产品参数与转化核心 */}
            <div className="lg:col-span-7 flex flex-col justify-center py-4 lg:py-6 min-w-0">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[11px] font-bold tracking-[0.2em] text-[#111111] uppercase bg-gray-200/50 px-3 py-1 rounded-full">{labelProductCategory(product, locale)}</span>
                <span className="text-[11px] text-gray-400 tracking-widest uppercase flex items-center gap-1"><ShieldCheck size={12}/> Mature Formula</span>
              </div>
              
              <h1 className="text-3xl md:text-5xl lg:text-5xl font-light tracking-tight mb-6 leading-[1.15] text-[#111111]" itemProp="name">
                {product.name}
              </h1>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {product.tags.map((tag, i) => (
                  <span key={i} className="border border-gray-200 text-gray-500 text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    <Tag size={10} className="opacity-50"/> {tag}
                  </span>
                ))}
              </div>

              <p className="text-gray-500 font-light leading-relaxed mb-12 text-[15px] md:text-[16px]" itemProp="description">
                {product.desc}
              </p>
              {product.applicationScenarios ? (
                <p className="text-gray-600 font-light leading-relaxed mb-8 text-[14px] border-l-2 border-gray-200 pl-4">
                  {product.applicationScenarios}
                </p>
              ) : null}
              {product.detailContent?.length ? (
                <div className="mb-10 space-y-3 text-[14px] text-gray-600 font-light leading-relaxed">
                  {product.detailContent.map((block, idx) => (
                    <p key={idx}>{block.text}</p>
                  ))}
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-6 mb-12 border-y border-gray-200/60 py-8">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Settings size={12}/> {t('products.moqLabel')}</div>
                  <div className="text-[15px] font-medium text-[#111111]">{t('products.moqVal')}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Beaker size={12}/> {t('products.sampleLabel')}</div>
                  <div className="text-[15px] font-medium text-[#111111]">{t('products.sampleVal')}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Package size={12}/> {t('products.packLabel')}</div>
                  <div className="text-[14px] text-[#111111] font-light">{product.packaging}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Target size={12}/> {t('products.skinLabel')}</div>
                  <div className="text-[14px] text-[#111111] font-light line-clamp-1" title={product.skinType}>{product.skinType}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                <button onClick={() => navigate('/contact')} className="group bg-[#1A1A1A] text-white py-3.5 sm:py-4 px-8 sm:px-10 text-[13px] font-medium tracking-[0.1em] hover:bg-black transition-all duration-300 flex justify-center items-center gap-3 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.1)] w-full sm:w-auto">
                  {t('products.ctaSample')} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
                <button onClick={() => navigate('/contact')} className="group border border-gray-200 bg-white text-[#111111] py-3.5 sm:py-4 px-8 sm:px-10 text-[13px] font-medium tracking-[0.1em] hover:border-gray-400 transition-colors flex justify-center items-center gap-3 rounded-full w-full sm:w-auto">
                  {t('products.ctaQuote')}
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* 2. 深度信息模块 (Detail Modules) */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 md:px-12 max-w-6xl">
          
          {/* 模块 A：核心功效与受众 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-24">
            <div className="md:col-span-4">
              <h2 className="text-2xl md:text-3xl font-light text-[#111111] mb-4">{t('products.efficacyH')}</h2>
              <p className="text-[13px] tracking-widest text-gray-400 uppercase font-bold">{t('products.efficacySub')}</p>
            </div>
            <div className="md:col-span-8 bg-[#FAFAFA] p-8 md:p-12 rounded-[24px] border border-gray-100/50">
              <div className="mb-8">
                <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Target size={14}/> {t('products.effClaim')}</h3>
                <ul className="space-y-4">
                  {product.efficacy.map((eff, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-[#1A1A1A] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                      <span className="text-[15px] text-gray-600 font-light leading-relaxed">{eff}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8 border-t border-gray-200/60">
                <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={14}/> {t('products.skinScene')}</h3>
                <p className="text-[15px] text-gray-600 font-light leading-relaxed">{product.skinType}</p>
              </div>
            </div>
          </div>

          {/* 模块 B：前沿成分剖析 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-24">
            <div className="md:col-span-4 md:order-last">
              <h2 className="text-2xl md:text-3xl font-light text-[#111111] mb-4">{t('products.ingH')}</h2>
              <p className="text-[13px] tracking-widest text-gray-400 uppercase font-bold">{t('products.ingSub')}</p>
            </div>
            <div className="md:col-span-8 grid sm:grid-cols-2 gap-6">
              {product.ingredients.map((ing, i) => (
                <div key={i} className="bg-white border border-gray-100 p-8 rounded-[20px] hover:shadow-[0_10px_30px_rgba(0,0,0,0.03)] transition-shadow duration-300">
                  <Microscope size={24} className="text-gray-300 mb-6" strokeWidth={1.5}/>
                  <h4 className="text-[16px] font-medium text-[#111111] mb-3">{ing.name}</h4>
                  <p className="text-[14px] text-gray-500 font-light leading-relaxed">{ing.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 模块 C：OEM/ODM 柔性定制能力 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-24">
            <div className="md:col-span-4">
              <h2 className="text-2xl md:text-3xl font-light text-[#111111] mb-4">{t('products.custH')}</h2>
              <p className="text-[13px] tracking-widest text-gray-400 uppercase font-bold">{t('products.custSub')}</p>
            </div>
            <div className="md:col-span-8 bg-[#1A1A1A] text-white p-8 md:p-12 rounded-[24px] shadow-lg relative overflow-hidden">
              <Sparkles className="absolute -bottom-6 -right-6 text-white/5 w-48 h-48" strokeWidth={1} />
              <div className="relative z-10">
                <p className="text-[16px] text-gray-300 font-light leading-relaxed mb-8">
                  {t('products.custLead')}
                </p>
                <div className="bg-white/10 border border-white/20 p-6 rounded-[16px] backdrop-blur-sm">
                  <h4 className="text-[14px] font-medium text-white mb-2 flex items-center gap-2"><Settings size={16}/> {t('products.custBox')}</h4>
                  <p className="text-[14px] text-gray-300 font-light leading-relaxed">{product.oemDesc}</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* 3. GEO/SEO 优化：结构化问答 FAQ */}
      <section className="py-24 bg-[#FAFAFA] border-y border-gray-100">
        <div className="container mx-auto px-6 md:px-12 max-w-4xl" itemScope itemType="https://schema.org/FAQPage">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4 text-[#111111]">{t('products.faqH')}</h2>
            <p className="text-gray-500 text-[15px] font-light">{t('products.faqLead')}</p>
          </div>
          <div className="border-t border-gray-200/60 bg-white rounded-[20px] overflow-hidden shadow-sm">
            {productFaqs.map((faq, idx) => (
              <div key={idx} className="border-b border-gray-100 last:border-0 group" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                <button 
                  className="w-full py-6 px-8 flex justify-between items-center text-left hover:bg-gray-50 transition-colors" 
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  aria-expanded={openFaq === idx}
                >
                  <h4 className={`text-[15px] font-medium pr-8 m-0 ${openFaq === idx ? 'text-[#111111]' : 'text-[#333]'}`} itemProp="name">
                    {faq.q}
                  </h4>
                  <span className={`transition-transform duration-300 flex-shrink-0 ${openFaq === idx ? 'text-[#111111] rotate-180' : 'text-gray-400'}`}>
                    {openFaq === idx ? <Minus size={18} strokeWidth={1.5} /> : <Plus size={18} strokeWidth={1.5} />}
                  </span>
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out px-8 bg-white ${openFaq === idx ? 'max-h-[60rem] opacity-100 pb-6' : 'max-h-0 opacity-0'}`}
                  itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer"
                >
                  <p className="text-gray-500 font-light text-[14px] leading-relaxed m-0" itemProp="text">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. 关联推荐 (Cross-Selling) */}
      {relatedProducts.length > 0 && (
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6 md:px-12 max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-[#111111] mb-2">{t('products.relH')}</h2>
                <p className="text-[13px] tracking-[0.2em] text-gray-400 uppercase font-bold">{t('products.relSub')}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts.map(relProduct => (
                <div 
                  key={relProduct.id} 
                  className="group cursor-pointer bg-white border border-gray-100/80 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-500 flex flex-col h-full rounded-[20px]" 
                  onClick={() => { navigate(`/products/${relProduct.id}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  <div className="relative aspect-[4/4] overflow-hidden bg-gray-50 rounded-t-[20px]">
                    <img src={relProduct.img} alt={relProduct.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="text-[10px] tracking-widest text-gray-400 uppercase mb-2">{labelProductCategory(relProduct, locale)}</div>
                    <h3 className="text-[16px] font-medium mb-3 group-hover:text-[#111111] transition-colors line-clamp-1 text-[#333]">{relProduct.name}</h3>
                    <p className="text-[13px] text-gray-500 font-light line-clamp-2 mb-4">{relProduct.desc}</p>
                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] font-medium">
                      <span className="text-gray-400 group-hover:text-[#111111] transition-colors flex items-center gap-1">{t('common.seeDetail')} <ArrowUpRight size={12}/></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 全局底部 CTA 模块保持一致 */}
      <SharedContactCTA source="product-detail" sourceProductId={product.sanityId} />
    </div>
  );
};

// --- FAQ 页 ---
const FaqPage = () => {
  const { t } = useLocale();
  const { faqs, loading, error, reload } = useCms();
  const [openFaq, setOpenFaq] = useState(0);

  if (loading) return <CmsLoadingScreen />;
  if (error) {
    return (
      <div className="pt-28 md:pt-36 lg:pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{error}</p>
        <button type="button" onClick={() => reload()} className="mt-6 text-[#111111] underline">
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="yozo-animate-page-in pt-28 md:pt-36 lg:pt-40 bg-[#FAFAFA] min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl pb-32">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="h-px w-8 bg-gray-300"></span><span className="text-[11px] tracking-[0.2em] uppercase text-gray-400 font-bold">{t('faqPage.eyebrow')}</span><span className="h-px w-8 bg-gray-300"></span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-center mb-6">{t('faqPage.title')}</h1>
        </div>
        <div className="border-t border-gray-200/60">
          {faqs.map((faq, idx) => (
            <div key={faq.id ?? faq.q ?? idx} className="border-b border-gray-200/60 group">
              <button className="w-full py-8 flex justify-between items-center text-left hover:text-gray-600 transition-colors" onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}>
                <span className={`text-base md:text-lg font-light pr-8 ${openFaq === idx ? 'text-[#111111] font-medium' : 'text-gray-600'}`}>{faq.q}</span>
                <span className={`transition-transform duration-300 ${openFaq === idx ? 'text-[#111111] rotate-180' : 'text-gray-300'}`}>
                  {openFaq === idx ? <Minus size={20} strokeWidth={1.5} /> : <Plus size={20} strokeWidth={1.5} />}
                </span>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-[60rem] opacity-100 pb-8' : 'max-h-0 opacity-0'}`}>
                <p className="text-gray-500 font-light text-[14px] leading-relaxed pr-8">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <SharedContactCTA source="faq" />
    </div>
  );
};

// --- 联系我们 ---
const ContactPage = () => {
  const { t } = useLocale();
  const hubDots = useMemo(
    () => [
      { top: '35%', left: '20%', label: t('contact.hubNA'), sub: 'New York' },
      { top: '40%', left: '48%', label: t('contact.hubEU'), sub: 'Paris' },
      { top: '55%', left: '60%', label: t('contact.hubME'), sub: 'Dubai' },
      { top: '48%', left: '75%', label: t('contact.hubHQ'), sub: 'Shantou, CN', isHQ: true },
      { top: '42%', left: '85%', label: t('contact.hubAP'), sub: 'Tokyo' },
      { top: '70%', left: '82%', label: t('contact.hubOC'), sub: 'Sydney' },
    ],
    [t],
  );
  return (
  <div className="yozo-animate-page-in pt-28 md:pt-36 lg:pt-40 bg-[#FAFAFA] min-h-screen">
    <div className="container mx-auto px-6 md:px-12 text-center mb-16">
      <div className="inline-flex items-center gap-3 mb-6">
        <span className="h-px w-8 bg-gray-300"></span><span className="text-[11px] font-bold tracking-[0.3em] uppercase text-gray-400">{t('contact.eyebrow')}</span><span className="h-px w-8 bg-gray-300"></span>
      </div>
      <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-6 text-[#111111]">{t('contact.title')}</h1>
      <p className="text-gray-500 font-light text-lg">{t('contact.lead')}</p>
    </div>

    {/* Global Network Map Section */}
    <section className="container mx-auto px-6 md:px-12 mb-24">
      <div className="relative w-full rounded-[32px] overflow-hidden bg-[#111111] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)]">
        {/* Earth/Network Background */}
        <div className="absolute inset-0 z-0">
           <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000" alt="Global Network" className="w-full h-full object-cover opacity-[0.35] mix-blend-screen" />
           <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/30 via-transparent to-[#111111]/90"></div>
        </div>

        <div className="relative z-10 p-6 sm:p-10 md:p-16 lg:p-20">
           <div className="text-center mb-16">
             <h2 className="text-3xl md:text-4xl font-light text-white mb-6 tracking-tight">{t('contact.mapH')}</h2>
             <p className="text-white/60 font-light text-[15px] max-w-2xl mx-auto leading-relaxed">
               {t('contact.mapP')}
             </p>
           </div>

           {/* Interactive Map Visual */}
           <div className="relative w-full h-[300px] md:h-[450px] rounded-[24px] border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden mb-16 flex items-center justify-center">
             {/* CSS Grid Pattern */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"></div>

             {/* Hub Nodes */}
             {hubDots.map((dot, i) => (
               <div key={i} className="absolute flex flex-col items-center group cursor-pointer" style={{ top: dot.top, left: dot.left, transform: 'translate(-50%, -50%)' }}>
                 <div className="relative flex items-center justify-center w-6 h-6 mb-2">
                   <span className={`absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping ${dot.isHQ ? 'bg-white duration-1000' : 'bg-gray-400 duration-1000'}`}></span>
                   <span className={`relative inline-flex rounded-full transition-transform duration-300 group-hover:scale-150 ${dot.isHQ ? 'w-3 h-3 bg-white shadow-[0_0_15px_#fff]' : 'w-2 h-2 bg-gray-300'}`}></span>
                 </div>
                 <div className={`flex flex-col items-center bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg transition-all duration-300 ${dot.isHQ ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}`}>
                    <span className="text-[11px] font-bold tracking-widest text-white whitespace-nowrap">{dot.label}</span>
                    <span className="text-[9px] tracking-widest text-white/50 uppercase font-light mt-0.5">{dot.sub}</span>
                 </div>
               </div>
             ))}

             <div className="absolute bottom-6 right-6 flex items-center gap-4 text-[10px] text-white/40 tracking-widest uppercase font-bold">
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff]"></span> {t('contact.legHQ')}</span>
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-gray-400 rounded-full"></span> {t('contact.legHub')}</span>
             </div>
           </div>

           {/* Key Stats */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center divide-x-0 md:divide-x divide-white/10">
              <div>
                 <div className="text-4xl font-light text-white mb-2">50<span className="text-2xl text-white/50">+</span></div>
                 <div className="text-[11px] tracking-[0.2em] text-white/50 uppercase font-bold">{t('contact.statCountries')}</div>
              </div>
              <div>
                 <div className="text-4xl font-light text-white mb-2">100<span className="text-2xl text-white/50">%</span></div>
                 <div className="text-[11px] tracking-[0.2em] text-white/50 uppercase font-bold">{t('contact.statFda')}</div>
              </div>
              <div>
                 <div className="text-4xl font-light text-white mb-2">15<span className="text-2xl text-white/50">d</span></div>
                 <div className="text-[11px] tracking-[0.2em] text-white/50 uppercase font-bold">{t('contact.statDelivery')}</div>
              </div>
              <div>
                 <div className="text-4xl font-light text-white mb-2">7<span className="text-xl text-white/50">x</span>24</div>
                 <div className="text-[11px] tracking-[0.2em] text-white/50 uppercase font-bold">{t('contact.statSupport')}</div>
              </div>
           </div>
        </div>
      </div>
    </section>

    {/* Global Offices Cards */}
    <section className="container mx-auto px-6 md:px-12 mb-24 max-w-6xl">
       <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:-translate-y-1 transition-transform">
             <div className="w-10 h-10 rounded-full bg-[#FAFAFA] flex items-center justify-center mb-6 text-[#111111]">
               <MapPin size={18} strokeWidth={1.5}/>
             </div>
             <h4 className="text-[16px] font-medium text-[#111111] mb-2">{t('contact.card1h')}</h4>
             <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Shantou, China</div>
             <p className="text-[13px] text-gray-500 font-light leading-relaxed">{t('contact.card1p')}</p>
          </div>
          <div className="bg-white p-8 rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:-translate-y-1 transition-transform">
             <div className="w-10 h-10 rounded-full bg-[#FAFAFA] flex items-center justify-center mb-6 text-[#111111]">
               <Phone size={18} strokeWidth={1.5}/>
             </div>
             <h4 className="text-[16px] font-medium text-[#111111] mb-2">{t('contact.card2h')}</h4>
             <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">24/7 Global Support</div>
             <p className="text-[13px] text-gray-500 font-light leading-relaxed space-y-2 flex flex-col">
               <span>{t('contact.card2l1')}</span>
               <span>{t('contact.card2l2')}</span>
             </p>
          </div>
          <div className="bg-white p-8 rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:-translate-y-1 transition-transform">
             <div className="w-10 h-10 rounded-full bg-[#FAFAFA] flex items-center justify-center mb-6 text-[#111111]">
               <Mail size={18} strokeWidth={1.5}/>
             </div>
             <h4 className="text-[16px] font-medium text-[#111111] mb-2">{t('contact.card3h')}</h4>
             <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Business Inquiry</div>
             <p className="text-[13px] text-gray-500 font-light leading-relaxed">
               {t('contact.card3p')}
               <br/><span className="text-[#111111] font-medium mt-2 block">yozobeauty@outlook.com</span>
             </p>
          </div>
       </div>
    </section>

    <SharedContactCTA source="contact" />
  </div>
  );
};

// --- 资讯中心列表页 ---
const NewsPage = () => {
  const navigate = useNavigate();
  const { t } = useLocale();
  const { articles, articleCategories, loading, error, reload } = useCms();
  const [activeCategory, setActiveCategory] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);

  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchCategory = activeCategory === "全部" || a.category === activeCategory;
      const matchSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [articles, activeCategory, searchQuery]);

  const featuredArticle = articles[0];
  const hasMore = visibleCount < filteredArticles.length;

  if (loading) return <CmsLoadingScreen />;
  if (error) {
    return (
      <div className="pt-28 md:pt-36 lg:pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{error}</p>
        <button type="button" onClick={() => reload()} className="mt-6 text-[#111111] underline">
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="yozo-animate-page-in pt-28 md:pt-36 lg:pt-40 pb-32 bg-[#FAFAFA] min-h-screen">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="h-px w-8 bg-gray-200"></span><span className="text-[11px] tracking-[0.2em] text-gray-400 uppercase font-bold">{t('news.eyebrow')}</span><span className="h-px w-8 bg-gray-200"></span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-6 text-[#111111]">{t('news.title')}</h1>
          <p className="text-gray-500 font-light max-w-2xl mx-auto text-[15px]">
            {t('news.lead')}
          </p>
        </div>

        {/* 推荐文章板块 */}
        {activeCategory === "全部" && searchQuery === "" && featuredArticle && (
          <div 
            onClick={() => navigate(`/news/${featuredArticle.id}`)}
            className="mb-20 bg-white rounded-[24px] overflow-hidden border border-gray-100 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-500 cursor-pointer group flex flex-col lg:flex-row"
          >
            <div className="w-full lg:w-3/5 h-[300px] lg:h-[450px] relative overflow-hidden">
              <img src={featuredArticle.img} alt={featuredArticle.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur text-[#111111] px-4 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase">
                {t('common.featured')}
              </div>
            </div>
            <div className="w-full lg:w-2/5 p-10 lg:p-16 flex flex-col justify-center">
              <div className="flex items-center gap-4 text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-4">
                <span className="text-[#111111]">{featuredArticle.category}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span>{featuredArticle.date}</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-light mb-6 leading-snug group-hover:text-gray-600 transition-colors">
                {featuredArticle.title}
              </h2>
              <p className="text-gray-500 font-light leading-relaxed mb-8 text-[14px]">
                {featuredArticle.summary}
              </p>
              <div className="inline-flex items-center gap-2 text-[13px] font-medium text-[#111111] group-hover:gap-4 transition-all mt-auto">
                {t('common.readLong')} <ArrowRight size={16} />
              </div>
            </div>
          </div>
        )}

        {/* 筛选与搜索 */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 sm:gap-6 mb-12 bg-white p-4 sm:p-5 border border-gray-100 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)] min-w-0">
          <div className="flex flex-nowrap md:flex-wrap items-center gap-2.5 w-full min-w-0 lg:w-auto flex-1 overflow-x-auto md:overflow-visible pb-1 md:pb-0 [-webkit-overflow-scrolling:touch]">
            <Filter size={16} className="text-gray-300 mr-2 hidden lg:block shrink-0" />
            {articleCategories.map((cat) => (
              <button 
                key={cat} onClick={() => { setActiveCategory(cat); setVisibleCount(6); }}
                className={`px-5 py-2 text-[13px] transition-all duration-300 rounded-full whitespace-nowrap border ${
                  activeCategory === cat ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md' : 'bg-transparent text-gray-500 hover:text-[#111111] border-gray-200 hover:border-gray-300'
                }`}
              >
                {formatCategoryTabLabel(cat, t)}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72 flex-shrink-0 mt-4 lg:mt-0">
            <input 
              type="text" placeholder={t('news.searchPh')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-gray-200 pl-10 pr-4 py-2.5 text-[13px] focus:outline-none focus:border-gray-400 rounded-full transition-colors"
            />
            <Search size={14} className="absolute left-4 top-3.5 text-gray-400" />
          </div>
        </div>

        {/* 文章列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredArticles.slice(activeCategory === "全部" && searchQuery === "" ? 1 : 0, visibleCount).map(article => (
            <article 
              key={article.id} 
              onClick={() => navigate(`/news/${article.id}`)}
              className="group cursor-pointer bg-white border border-gray-100/80 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all duration-500 flex flex-col h-full rounded-[24px] overflow-hidden"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-gray-50">
                <img src={article.img} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex justify-between items-center text-[10px] tracking-widest text-gray-400 uppercase mb-4">
                  <span className="text-[#1A1A1A] font-bold bg-gray-100 px-3 py-1 rounded-full">{article.category}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={12}/> {article.date}</span>
                </div>
                <h3 className="text-xl font-light mb-4 group-hover:text-gray-500 transition-colors line-clamp-2 leading-snug text-[#111111]">
                  {article.title}
                </h3>
                <p className="text-gray-500 text-[13px] font-light leading-relaxed mb-6 line-clamp-3">
                  {article.summary}
                </p>
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400 font-light uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Clock size={12}/> {article.readTime} {t('common.readTimeSuffix')}</span>
                  <span className="text-[#111111] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">{t('common.read')} <ChevronRight size={14}/></span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {hasMore && (
          <div className="text-center">
            <button onClick={() => setVisibleCount(prev => prev + 6)} className="bg-white border border-gray-200 text-[#111111] px-10 py-3.5 text-[13px] font-medium hover:bg-gray-50 transition-colors rounded-full shadow-sm">
              {t('common.loadMoreInsights')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 资讯详情页 ---
const NewsDetailPage = () => {
  const navigate = useNavigate();
  const { articleId } = useParams();
  const { t } = useLocale();
  const { articles, loading, error, reload } = useCms();
  const [openFaq, setOpenFaq] = useState(0);

  const resolvedArticle = resolveArticleByRouteParam(articles, articleId);
  const article = resolvedArticle ?? articles[0];

  useEffect(() => {
    if (!loading && articles.length && !resolvedArticle) {
      navigate(`/news/${articles[0].id}`, { replace: true });
    }
  }, [loading, articles, resolvedArticle, navigate]);

  if (loading || !articles.length) return <CmsLoadingScreen />;
  if (error) {
    return (
      <div className="pt-28 md:pt-36 lg:pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{error}</p>
        <button type="button" onClick={() => reload()} className="mt-6 text-[#111111] underline">
          {t('common.retry')}
        </button>
      </div>
    );
  }

  const relatedArticles = articles.filter((a) => a.id !== article.id && a.category === article.category).slice(0, 2);

  return (
    <div className="yozo-animate-page-in bg-white min-h-screen">
      
      {/* 头部区 */}
      <header className="relative pt-28 md:pt-36 lg:pt-40 pb-20 md:pb-32 bg-[#FAFAFA] border-b border-gray-100">
        <div className="container mx-auto px-6 md:px-12 max-w-4xl">
          <button onClick={() => navigate('/news')} className="group text-[12px] font-medium tracking-[0.1em] text-gray-400 hover:text-[#111111] mb-12 flex items-center gap-2 transition-colors uppercase">
            <ArrowRight size={14} className="rotate-180 transition-transform group-hover:-translate-x-1" /> {t('common.backToNews')}
          </button>
          <div className="flex items-center gap-4 text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-6">
             <span className="bg-[#111111] text-white px-3 py-1 rounded-full">{article.category}</span>
             <time dateTime={article.date}>{article.date}</time>
             <span className="w-1 h-1 rounded-full bg-gray-300"></span>
             <span className="flex items-center gap-1.5"><Clock size={12}/> {article.readTime} {t('common.readTimeSuffix')}</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-light tracking-tight mb-8 leading-[1.2] text-[#111111]" itemProp="headline">
            {article.title}
          </h1>
          <p className="text-xl font-light text-gray-500 leading-relaxed border-l-2 border-[#111111] pl-6" itemProp="description">
            {article.summary}
          </p>
        </div>
      </header>

      {/* 文章主内容区 */}
      <main className="py-20">
        <article itemScope itemType="http://schema.org/Article" className="container mx-auto px-6 md:px-12 max-w-4xl">
          <div className="w-full aspect-video rounded-[24px] overflow-hidden mb-16 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100">
            <img src={article.img} alt={article.title} itemProp="image" className="w-full h-full object-cover" />
          </div>

          <div className="max-w-none text-gray-600 font-light leading-loose selection:bg-gray-200" itemProp="articleBody">
            {article.content.map((block, index) => {
              if (block.type === 'h2') {
                return <h2 key={index} className="text-2xl md:text-3xl font-light text-[#111111] mt-16 mb-6 tracking-tight">{block.text}</h2>;
              }
              if (block.type === 'p') {
                return <p key={index} className="mb-6 text-[16px]">{block.text}</p>;
              }
              if (block.type === 'quote') {
                return (
                  <blockquote key={index} className="border-l-4 border-gray-200 pl-8 my-12 py-4">
                    <p className="text-2xl font-light italic text-[#111111] leading-relaxed">{block.text}</p>
                  </blockquote>
                );
              }
              return null;
            })}
          </div>
          
          <div className="mt-16 pt-8 border-t border-gray-100 flex justify-between items-center">
             <div className="flex gap-2">
                <span className="text-[11px] font-medium tracking-widest text-gray-400 uppercase bg-gray-50 px-3 py-1.5 rounded-full">{article.category}</span>
                <span className="text-[11px] font-medium tracking-widest text-gray-400 uppercase bg-gray-50 px-3 py-1.5 rounded-full">YOZO Insights</span>
             </div>
             <div className="text-[12px] font-medium tracking-widest text-gray-400 uppercase cursor-pointer hover:text-[#111111] transition-colors">
                Share Article
             </div>
          </div>
        </article>
      </main>

      {/* FAQ 延伸阅读区 */}
      {article.faqs && article.faqs.length > 0 && (
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="container mx-auto px-6 md:px-12 max-w-4xl" itemScope itemType="https://schema.org/FAQPage">
            <h3 className="text-2xl font-light mb-8 text-[#111111] tracking-tight">本文相关问答 (FAQ)</h3>
            <div className="border-t border-gray-200/60">
              {article.faqs.map((faq, idx) => (
                <div key={idx} className="border-b border-gray-200/60 group" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                  <button 
                    className="w-full py-6 flex justify-between items-center text-left hover:text-gray-600 transition-colors" 
                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                    aria-expanded={openFaq === idx}
                  >
                    <h4 className={`text-[15px] md:text-[16px] font-light pr-8 m-0 ${openFaq === idx ? 'text-[#111111] font-medium' : 'text-gray-600'}`} itemProp="name">
                      {faq.q}
                    </h4>
                    <span className={`transition-transform duration-300 ${openFaq === idx ? 'text-[#111111] rotate-180' : 'text-gray-300'}`}>
                      {openFaq === idx ? <Minus size={18} strokeWidth={1.5} /> : <Plus size={18} strokeWidth={1.5} />}
                    </span>
                  </button>
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-[60rem] opacity-100 pb-6' : 'max-h-0 opacity-0'}`}
                    itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer"
                  >
                    <p className="text-gray-500 font-light text-[14px] leading-relaxed pr-8 m-0" itemProp="text">
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 相关推荐 */}
      {relatedArticles.length > 0 && (
        <aside className="py-20 bg-[#FAFAFA] border-t border-gray-100" aria-label="相关文章推荐">
          <div className="container mx-auto px-6 md:px-12 max-w-6xl">
            <h3 className="text-2xl font-light mb-10 text-center tracking-tight text-[#111111]">延伸阅读</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedArticles.map(rel => (
                <article 
                  key={rel.id} 
                  onClick={() => { navigate(`/news/${rel.id}`); setOpenFaq(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="group cursor-pointer bg-white p-6 md:p-8 rounded-[24px] border border-gray-100 hover:shadow-lg transition-all duration-300 flex items-center gap-6"
                >
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-[16px] overflow-hidden flex-shrink-0 bg-gray-50">
                    <img src={rel.img} alt={rel.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div>
                    <time dateTime={rel.date} className="block text-[10px] tracking-widest text-gray-400 uppercase mb-2">{rel.date}</time>
                    <h4 className="text-[16px] font-medium leading-snug text-[#111111] group-hover:text-gray-500 transition-colors line-clamp-2">{rel.title}</h4>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </aside>
      )}

      <SharedContactCTA source="news-detail" />
    </div>
  );
};

// --- 案例详情（路由 /cases/:slug）---
const CaseStudyDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useLocale();
  const { caseStudies, loading, error, reload } = useCms();
  const study = slug ? resolveCaseStudyBySlug(caseStudies, slug) : null;

  if (loading) return <CmsLoadingScreen />;
  if (error) {
    return (
      <div className="pt-28 md:pt-36 lg:pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{error}</p>
        <button type="button" onClick={() => reload()} className="mt-6 text-[#111111] underline">
          {t('common.retry')}
        </button>
      </div>
    );
  }
  if (!study) {
    return (
      <div className="pt-28 md:pt-36 lg:pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{t('common.notFoundCase')}</p>
        <button type="button" onClick={() => navigate('/')} className="mt-6 text-[#111111] underline">
          {t('common.backHome')}
        </button>
      </div>
    );
  }

  return (
    <div className="yozo-animate-page-in pt-28 md:pt-36 lg:pt-40 pb-24 bg-white min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group text-[12px] font-medium tracking-[0.1em] text-gray-400 hover:text-[#111111] mb-10 flex items-center gap-2 transition-colors uppercase"
        >
          <ArrowRight size={14} className="rotate-180 transition-transform group-hover:-translate-x-1" /> {t('common.back')}
        </button>
        {study.industry ? (
          <span className="text-[11px] tracking-widest text-gray-400 uppercase">{study.industry}</span>
        ) : null}
        <h1 className="text-3xl md:text-4xl font-light text-[#111111] mt-4 mb-6">{study.title}</h1>
        {study.img ? (
          <img src={study.img} alt="" className="w-full rounded-2xl border border-gray-100 mb-10 object-cover max-h-[420px]" />
        ) : null}
        <div className="prose prose-gray max-w-none text-[15px] text-gray-600 font-light leading-relaxed space-y-4">
          {(study.content?.length ? study.content : [{ type: 'p', text: study.excerpt || '' }]).map((block, i) => (
            <p key={i}>{block.text}</p>
          ))}
        </div>
        <SharedContactCTA source="case-detail" />
      </div>
    </div>
  );
};

// --- 通用页面（路由 /p/:slug，与 Studio simplePage 对齐）---
const SimplePageView = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useLocale();
  const { simplePages, loading, error, reload } = useCms();
  const page = slug ? resolveSimplePageBySlug(simplePages, slug) : null;

  if (loading) return <CmsLoadingScreen />;
  if (error) {
    return (
      <div className="pt-28 md:pt-36 lg:pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{error}</p>
        <button type="button" onClick={() => reload()} className="mt-6 text-[#111111] underline">
          {t('common.retry')}
        </button>
      </div>
    );
  }
  if (!page) {
    return (
      <div className="pt-28 md:pt-36 lg:pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{t('common.notFoundPage')}</p>
        <button type="button" onClick={() => navigate('/')} className="mt-6 text-[#111111] underline">
          {t('common.backHome')}
        </button>
      </div>
    );
  }

  return (
    <div className="yozo-animate-page-in pt-28 md:pt-36 lg:pt-40 pb-24 bg-[#FAFAFA] min-h-screen">
      {page.banner?.bgUrl ? (
        <div
          className="h-[240px] md:h-[320px] bg-cover bg-center relative mb-12"
          style={{ backgroundImage: `url(${page.banner.bgUrl})` }}
        >
          <div className="absolute inset-0 bg-black/40 flex flex-col justify-center px-6 md:px-12 text-white">
            <h1 className="text-3xl md:text-4xl font-light max-w-3xl">
              {page.banner.title || page.title}
            </h1>
            {page.banner.subtitle ? (
              <p className="mt-4 text-white/90 font-light max-w-2xl">{page.banner.subtitle}</p>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="container mx-auto px-6 md:px-12 max-w-4xl bg-white rounded-2xl border border-gray-100 p-10 md:p-14 shadow-sm">
        {!page.banner?.bgUrl ? (
          <h1 className="text-3xl md:text-4xl font-light text-[#111111] mb-6">{page.title}</h1>
        ) : null}
        {page.excerpt ? <p className="text-gray-500 font-light mb-8">{page.excerpt}</p> : null}
        <div className="space-y-4 text-[15px] text-gray-600 font-light leading-relaxed">
          {(page.content?.length ? page.content : [{ type: 'p', text: '' }]).map((block, i) => (
            <p key={i}>{block.text}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 主应用渲染 (Main App & Layout)
// ==========================================

function LanguageSwitcher({ navOnLight }) {
  const { locale, setLocale, t } = useLocale();
  const opts = [
    { id: 'zh', label: '中文' },
    { id: 'en', label: 'EN' },
    { id: 'es', label: 'ES' },
  ];
  return (
    <div
      role="group"
      aria-label={t('shell.ariaLang')}
      className={`inline-flex shrink-0 items-center rounded-full border p-0.5 gap-0.5 ${
        navOnLight ? 'border-gray-200/80 bg-white/70' : 'border-white/30 bg-black/25'
      }`}
    >
      {opts.map((o) => {
        const active = locale === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => setLocale(o.id)}
            className={`text-[11px] font-medium tracking-wide px-2.5 py-1 rounded-full transition-colors ${
              active
                ? navOnLight
                  ? 'bg-[#111111] text-white'
                  : 'bg-white text-[#111111]'
                : navOnLight
                  ? 'text-gray-600 hover:text-[#111111]'
                  : 'text-white/80 hover:text-white'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SiteShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale, t } = useLocale();
  const { siteSettings, products } = useCms();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [floatingFormOpen, setFloatingFormOpen] = useState(false);
  const [floatName, setFloatName] = useState('');
  const [floatPhone, setFloatPhone] = useState('');
  const [floatMsg, setFloatMsg] = useState('');
  const [floatHint, setFloatHint] = useState('');
  const [floatSending, setFloatSending] = useState(false);

  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const navItems = useMemo(() => {
    const list = siteSettings?.mainNavigation;
    if (Array.isArray(list) && list.length > 0) {
      return list
        .map((n) => ({
          path: String(n?.href ?? '/').trim() || '/',
          label: String(n?.label ?? '').trim(),
          external: isExternalHref(n?.href),
          newTab: Boolean(n?.openInNewTab),
        }))
        .filter((n) => n.label);
    }
    return DEFAULT_MAIN_NAV;
  }, [siteSettings?.mainNavigation]);

  const navOnLight = isScrolled || !isHome;
  const siteBrandTitle = siteSettings?.title?.trim();
  const headerCta = siteSettings?.headerCta;

  return (
    <div className="min-h-screen min-w-0 bg-[#FDFDFD] font-sans text-[#222222] selection:bg-gray-200 relative overflow-x-clip">
      
      {/* 现代化高端导航栏 */}
      <nav className={`fixed w-full z-50 transition-all duration-700 ${
        navOnLight
          ? 'bg-white/75 backdrop-blur-2xl border-b border-gray-200/50 shadow-[0_4px_30px_rgba(0,0,0,0.03)] py-4' 
          : 'bg-transparent border-b border-white/10 py-8'
      }`}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex justify-between items-center relative">
          
          <div className={`text-xl sm:text-2xl font-bold tracking-[0.12em] sm:tracking-[0.15em] uppercase cursor-pointer transition-colors duration-500 shrink-0 ${navOnLight ? 'text-[#111111]' : 'text-white'}`} onClick={() => navigate('/')}>
            {siteBrandTitle ? (
              <span>{siteBrandTitle}</span>
            ) : (
              <>
                YOZO<span className="text-gray-400">.</span>
              </>
            )}
          </div>
          
          <div className={`hidden xl:flex absolute left-1/2 -translate-x-1/2 items-center gap-5 2xl:gap-8 transition-colors duration-500 ${navOnLight ? 'text-gray-500' : 'text-white/80'}`}>
            {navItems.map((item) => {
              const isActive = navItemActive(location.pathname, item);
              return (
                <button
                  type="button"
                  key={`${item.path}-${item.label}`}
                  onClick={() => followHref(navigate, item.path, item.newTab)}
                  className="group relative flex flex-col items-center gap-1.5"
                >
                  <span className={`text-[12px] 2xl:text-[13px] tracking-wide transition-colors duration-300 ${
                    isActive 
                      ? (navOnLight ? 'text-[#111111] font-medium' : 'text-white font-medium')
                      : (navOnLight ? 'hover:text-[#111111]' : 'hover:text-white')
                  }`}>
                    {navLabelForItem(item, t)}
                  </span>
                  <div className={`w-1 h-1 rounded-full transition-all duration-300 ${
                    isActive 
                      ? (navOnLight ? 'bg-[#111111] opacity-100' : 'bg-white opacity-100') 
                      : 'bg-current opacity-0 group-hover:opacity-30'
                  }`} />
                </button>
              );
            })}
          </div>

          <div className="hidden xl:flex items-center gap-3 2xl:gap-4 shrink-0">
            <LanguageSwitcher navOnLight={navOnLight} />
            <button
              type="button"
              onClick={() =>
                headerCta?.href && headerCta?.label
                  ? followHref(navigate, headerCta.href)
                  : navigate('/contact')
              }
              className={`px-5 2xl:px-7 py-2.5 text-[11px] 2xl:text-[12px] tracking-[0.1em] font-medium transition-all duration-500 border rounded-full whitespace-nowrap ${
              navOnLight
                ? 'bg-transparent border-gray-300 text-[#111111] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A]' 
                : 'bg-white border-white text-[#111111] hover:bg-transparent hover:text-white'
            }`}
            >
              {locale === 'zh' && headerCta?.label?.trim()
                ? headerCta.label.trim()
                : t('common.freeInquiry')}
            </button>
          </div>

          <button type="button" className={`xl:hidden transition-colors duration-500 ${navOnLight ? 'text-[#111111]' : 'text-white'}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={28} strokeWidth={1.5} /> : <Menu size={28} strokeWidth={1.5} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="xl:hidden absolute top-full left-0 w-full max-h-[min(80dvh,calc(100vh-4rem))] overflow-y-auto overscroll-contain bg-white shadow-2xl border-t border-gray-100 py-6 flex flex-col">
             {navItems.map((item) => (
               <button
                 key={`${item.path}-${item.label}`}
                 type="button"
                 onClick={() => {
                   followHref(navigate, item.path, item.newTab);
                   setMobileMenuOpen(false);
                 }}
                 className="w-full text-center px-6 py-4 text-[#111111] text-[14px] tracking-widest hover:bg-gray-50 transition-colors"
               >
                 {navLabelForItem(item, t)}
               </button>
             ))}
             <div className="px-6 pt-6 pb-2 flex justify-center">
               <LanguageSwitcher navOnLight={true} />
             </div>
          </div>
        )}
      </nav>

      {/* 动态页面渲染区域 */}
      <main className="min-h-screen">
        <Outlet />
      </main>

      {/* 底部 Footer */}
      <footer className="bg-[#111111] text-white pt-20 pb-10 border-t border-white/10">
        <div className="container mx-auto px-6 md:px-12 max-w-[1400px]">
           <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-20">
              {/* 品牌信息区 */}
              <div className="md:col-span-12 lg:col-span-5 pr-0 lg:pr-12">
                <div className="text-3xl font-bold tracking-[0.15em] text-white uppercase mb-6 flex items-center gap-2">
                  {siteBrandTitle ? siteBrandTitle : (
                    <>
                      YOZO<span className="text-white/30">.</span>
                    </>
                  )}
                </div>
                <p className="text-[15px] font-light leading-relaxed max-w-md text-white/80 mb-8">
                  {locale === 'zh' && (siteSettings?.footerTagline || siteSettings?.description) ? (
                    <span className="whitespace-pre-line">
                      {siteSettings.footerTagline || siteSettings.description}
                    </span>
                  ) : (
                    <>
                      {t('footer.taglineL1')}
                      <br />
                      {t('footer.taglineL2')}
                    </>
                  )}
                </p>
                <div className="flex gap-4">
                  <div onClick={() => navigate('/contact')} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-[#111111] transition-all cursor-pointer">
                    <Mail size={16} strokeWidth={1.5} />
                  </div>
                  <div onClick={() => navigate('/about')} className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-[#111111] transition-all cursor-pointer">
                    <Globe2 size={16} strokeWidth={1.5} />
                  </div>
                </div>
              </div>

              {/* 导航与联系区 */}
              <div className="md:col-span-12 lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-10">
                {/* 快速导览 */}
                <div>
                  <h4 className="text-[12px] font-bold text-white tracking-[0.2em] uppercase mb-8 flex items-center gap-3">
                    <span className="w-3 h-px bg-white/40"></span> {t('footer.colQuick')}
                  </h4>
                  <ul className="space-y-5 text-[14px] font-light text-white/70">
                    <li><button onClick={()=>navigate('/about')} className="hover:text-white transition-colors relative group">{t('nav.about')}<span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span></button></li>
                    <li><button onClick={()=>navigate('/services')} className="hover:text-white transition-colors relative group">{t('nav.services')}<span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span></button></li>
                    <li><button onClick={()=>navigate('/products')} className="hover:text-white transition-colors relative group">{t('footer.linkFormulas')}<span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span></button></li>
                    <li><button onClick={()=>navigate('/faq')} className="hover:text-white transition-colors relative group">{t('nav.faq')}<span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span></button></li>
                  </ul>
                </div>
                
                {/* 业务中心 */}
                <div>
                  <h4 className="text-[12px] font-bold text-white tracking-[0.2em] uppercase mb-8 flex items-center gap-3">
                    <span className="w-3 h-px bg-white/40"></span> {t('footer.colBiz')}
                  </h4>
                  <ul className="space-y-5 text-[14px] font-light text-white/70">
                    <li><button onClick={()=>navigate('/news')} className="hover:text-white transition-colors relative group">{t('footer.industryNews')}<span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span></button></li>
                    <li><button onClick={()=>navigate('/contact')} className="hover:text-white transition-colors relative group">{t('footer.linkQuote')}<span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span></button></li>
                    <li><button onClick={()=>navigate('/contact')} className="hover:text-white transition-colors relative group">{t('footer.linkSample')}<span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span></button></li>
                  </ul>
                </div>

                {/* 联络枢纽 */}
                <div>
                  <h4 className="text-[12px] font-bold text-white tracking-[0.2em] uppercase mb-8 flex items-center gap-3">
                    <span className="w-3 h-px bg-white/40"></span> {t('footer.colContact')}
                  </h4>
                  <ul className="space-y-5 text-[14px] font-light text-white/70">
                    <li className="flex items-start gap-3 group">
                      <Phone size={16} className="mt-0.5 flex-shrink-0 text-white/50 group-hover:text-white transition-colors" />
                      <span className="hover:text-white transition-colors cursor-default">
                        {siteSettings?.contactPhone || '+86 0754-89920101'}
                      </span>
                    </li>
                    <li className="flex items-start gap-3 group">
                      <MessageCircle size={16} className="mt-0.5 flex-shrink-0 text-white/50 group-hover:text-white transition-colors" />
                      <span className="hover:text-white transition-colors cursor-default">
                        {siteSettings?.contactWhatsapp
                          ? `WhatsApp: ${siteSettings.contactWhatsapp}`
                          : 'WhatsApp: +86 13632470463'}
                      </span>
                    </li>
                    <li className="flex items-start gap-3 group">
                      <Mail size={16} className="mt-0.5 flex-shrink-0 text-white/50 group-hover:text-white transition-colors" />
                      <span className="hover:text-white transition-colors cursor-default">
                        {siteSettings?.contactEmail || 'yozobeauty@outlook.com'}
                      </span>
                    </li>
                    <li className="flex items-start gap-3 pt-1 group">
                      <MapPin size={16} className="mt-0.5 flex-shrink-0 text-white/50 group-hover:text-white transition-colors" />
                      <span className="leading-relaxed hover:text-white transition-colors cursor-default">
                        {siteSettings?.address ? (
                          siteSettings.address
                        ) : (
                          <>
                            {t('footer.addressL1')}
                            <br />
                            {t('footer.addressL2')}
                          </>
                        )}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
           </div>
           
           {/* 版权声明区 */}
           <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 text-[12px] sm:text-[13px] font-light text-white/50 px-1">
              <div className="text-center md:text-left order-2 md:order-1 tracking-wide">
                {locale === 'zh' && siteSettings?.footerCopyright?.trim()
                  ? siteSettings.footerCopyright.trim()
                  : `© ${new Date().getFullYear()} ${t('footer.copyrightFallback')}`}
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 order-1 md:order-2">
                <button type="button" className="hover:text-white transition-colors whitespace-nowrap">{t('footer.privacy')}</button>
                <button type="button" className="hover:text-white transition-colors whitespace-nowrap">{t('footer.terms')}</button>
              </div>
           </div>
        </div>
      </footer>

      {/* 全局右下角悬浮表单 */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-50 flex flex-col items-end max-w-[calc(100vw-1.5rem)]">
        {floatingFormOpen && (
          <div className="bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] border border-gray-100 rounded-2xl p-5 sm:p-8 mb-3 sm:mb-4 w-[min(22rem,calc(100vw-2rem))] sm:w-[min(24rem,calc(100vw-2.5rem))] md:w-[380px] yozo-animate-panel-up">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-[15px] font-medium text-[#111111] tracking-wide">{t('floating.title')}</h4>
              <button onClick={() => setFloatingFormOpen(false)} className="text-gray-400 hover:text-[#111111] transition-colors"><X size={18} strokeWidth={1.5}/></button>
            </div>
            <form className="space-y-5" onSubmit={async (e) => {
              e.preventDefault();
              setFloatHint('');
              if (!floatName.trim() || !floatPhone.trim()) {
                setFloatHint(t('floating.errRequired'));
                return;
              }
              setFloatSending(true);
              try {
                const path = location.pathname;
                const m = path.match(/^\/products\/([^/]+)/);
                const fromProduct = m ? resolveProductByRouteParam(products, m[1]) : null;
                await submitInquiry({
                  name: floatName.trim(),
                  phone: floatPhone.trim(),
                  message: floatMsg.trim(),
                  source: 'floating',
                  sourcePath: path,
                  sourceProductId: fromProduct?.sanityId,
                });
                setFloatHint(t('floating.success'));
                setFloatName('');
                setFloatPhone('');
                setFloatMsg('');
                setTimeout(() => setFloatingFormOpen(false), 1500);
              } catch (err) {
                setFloatHint(err.message || t('floating.errSubmit'));
              } finally {
                setFloatSending(false);
              }
            }}>
              <input type="text" placeholder={t('floating.phName')} value={floatName} onChange={(e) => setFloatName(e.target.value)} className="w-full bg-transparent border-b border-gray-200 pb-2 text-[13px] focus:outline-none focus:border-[#111111] transition-colors" />
              <input type="text" placeholder={t('floating.phPhone')} value={floatPhone} onChange={(e) => setFloatPhone(e.target.value)} className="w-full bg-transparent border-b border-gray-200 pb-2 text-[13px] focus:outline-none focus:border-[#111111] transition-colors" />
              <textarea placeholder={t('floating.phMsg')} rows={2} value={floatMsg} onChange={(e) => setFloatMsg(e.target.value)} className="w-full bg-transparent border-b border-gray-200 pb-2 text-[13px] focus:outline-none focus:border-[#111111] resize-none transition-colors"></textarea>
              {floatHint ? <p className="text-[12px] text-gray-500">{floatHint}</p> : null}
              <button type="submit" disabled={floatSending} className="group w-full bg-[#1A1A1A] text-white py-3.5 text-[12px] font-medium tracking-widest uppercase hover:bg-black transition-colors rounded-full mt-4 flex justify-center items-center gap-2 disabled:opacity-60">
                {floatSending ? t('contact.submitting') : t('floating.cta')} <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1"/>
              </button>
            </form>
          </div>
        )}
        
        <button 
          onClick={() => setFloatingFormOpen(!floatingFormOpen)}
          className="w-14 h-14 bg-[#1A1A1A] text-white rounded-full flex items-center justify-center shadow-[0_10px_25px_-5px_rgba(17,17,17,0.4)] hover:bg-black hover:-translate-y-1 transition-all duration-300"
        >
          {floatingFormOpen ? <X size={22} strokeWidth={1.5} /> : <MessageCircle size={22} strokeWidth={1.5} />}
        </button>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteShell />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:productId" element={<ProductDetailPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="news/:articleId" element={<NewsDetailPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="cases/:slug" element={<CaseStudyDetailPage />} />
        <Route path="p/:slug" element={<SimplePageView />} />
      </Route>
    </Routes>
  );
}