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

function CmsLoadingScreen({ message = '载入内容…' }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-gray-400 text-[14px] font-light tracking-wide">
      {message}
    </div>
  );
}

const SharedContactCTA = ({ source = 'cta', sourceProductId }) => {
  const { siteSettings } = useCms();
  const location = useLocation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hint, setHint] = useState('');

  const phoneDisplay = siteSettings?.contactPhone
    ? `全球热线：${siteSettings.contactPhone}`
    : '全球热线：+86 0754-89920101';
  const waDisplay = siteSettings?.contactWhatsapp
    ? `WhatsApp: ${siteSettings.contactWhatsapp}`
    : 'WhatsApp: +86 13632470463';
  const mailDisplay = siteSettings?.contactEmail || 'yozobeauty@outlook.com';

  const submit = async (e) => {
    e.preventDefault();
    setHint('');
    if (!name.trim() || (!phone.trim() && !email.trim())) {
      setHint('请填写姓名，并至少填写电话或邮箱');
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
      setHint('提交成功，我们会尽快与您联系。');
      setName('');
      setPhone('');
      setEmail('');
      setCompany('');
      setMessage('');
    } catch (err) {
      setHint(err.message || '提交失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact-cta" className="py-24 md:py-32 bg-white">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-gray-100 rounded-[24px] bg-white overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="p-12 md:p-16 flex flex-col justify-between relative overflow-hidden bg-[#FAFAFA]">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-[#111111]"></div>
                <span className="text-[11px] tracking-[0.2em] text-gray-500 uppercase font-medium">Let's Build Together</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-6 leading-[1.15] text-[#111111]">提交您的诉求，<br/>索取免费打样。</h2>
              <p className="text-gray-500 font-light leading-relaxed mb-12 text-[15px]">
                专业的业务与产品经理团队 24 小时待命。即刻获取最新的美妆行业趋势、打样方案 (Fast Sampling) 及专属的高级定制报价。
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
          <div className="bg-white p-12 md:p-16 text-[#111111] flex flex-col justify-center">
            <h3 className="text-2xl font-light mb-10">意向需求表</h3>
            <form className="space-y-8" onSubmit={submit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="您的姓名 *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent border-b border-gray-200 pb-3 text-[14px] focus:outline-none focus:border-[#111111] transition-colors placeholder:text-gray-400 font-light"
                  />
                </div>
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="电话 / WhatsApp"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent border-b border-gray-200 pb-3 text-[14px] focus:outline-none focus:border-[#111111] transition-colors placeholder:text-gray-400 font-light"
                  />
                </div>
              </div>
              <div className="relative group">
                <input
                  type="email"
                  placeholder="邮箱（与电话至少填一项）"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-gray-200 pb-3 text-[14px] focus:outline-none focus:border-[#111111] transition-colors placeholder:text-gray-400 font-light"
                />
              </div>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="公司或品牌名称"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-transparent border-b border-gray-200 pb-3 text-[14px] focus:outline-none focus:border-[#111111] transition-colors placeholder:text-gray-400 font-light"
                />
              </div>
              <div className="relative group">
                <textarea
                  placeholder="简述您的定制需求（如：研发抗老面霜，预估量5000支...）"
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
                {submitting ? '提交中…' : '提交意向申请'}{' '}
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

  if (loading) return <CmsLoadingScreen />;
  if (error) {
    return (
      <div className="pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{error}</p>
        <button type="button" onClick={() => reload()} className="mt-6 text-[#111111] underline">
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="yozo-animate-page-in">
      
      {/* 1. 首屏模块 */}
      <section className="relative h-screen min-h-[750px] flex items-center justify-center overflow-hidden bg-[#FAFAFA]">
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
            <img src={siteSettings?.heroImageUrl || 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=2000'} alt="" className="w-full h-full object-cover scale-105 animate-[pulse_30s_ease-in-out_infinite] opacity-60 filter grayscale-[10%]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/60 via-[#111111]/30 to-[#FAFAFA]"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10 text-center text-white mt-20">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xl border border-white/30 px-5 py-2 rounded-full text-[11px] tracking-widest uppercase mb-8 text-white">
            <ShieldCheck size={14}/>{' '}
            {siteSettings?.trustBadge || 'ISO 22716 & GMPC Certified'}
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6 leading-[1.15] max-w-5xl mx-auto drop-shadow-sm">
            {(siteSettings?.heroTitle || '以前沿生物科技，\n赋能顶尖美妆品牌。')
              .split('\n')
              .map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 ? <br /> : null}
                </span>
              ))}
          </h1>
          <p className="text-base md:text-xl font-light text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            {siteSettings?.heroSubtitle ? (
              siteSettings.heroSubtitle.split('\n').map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 ? <br /> : null}
                </span>
              ))
            ) : (
              <>
                提供国际标准的 OEM / ODM 全链路代工方案。
                <br className="hidden md:block" />
                从配方研发到全球出海，为您构筑绝对护城河。
              </>
            )}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              type="button"
              onClick={() =>
                siteSettings?.heroPrimaryCta?.href
                  ? followHref(navigate, siteSettings.heroPrimaryCta.href)
                  : navigate('/services')
              }
              className="group bg-white text-[#111111] px-8 py-3.5 text-[14px] font-medium tracking-wide transition-all duration-300 rounded-full flex items-center justify-center gap-2 hover:shadow-lg"
            >
              {siteSettings?.heroPrimaryCta?.label || '探索代工引擎'}{' '}
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
              {siteSettings?.heroSecondaryCta?.label || '索取打样方案'}
            </button>
          </div>
        </div>
      </section>

      {/* 2. 国际认证与供应链信任背书墙 */}
      <section className="bg-[#FAFAFA] pt-8 pb-20 relative z-20">
        <div className="container mx-auto px-4">
          <div className="text-[11px] tracking-[0.2em] text-center text-gray-400 uppercase mb-8 font-medium">Trusted by Global Brands & Premium Suppliers</div>
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
      <section className="bg-white py-20">
        <div className="container mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl">
          <div className="bg-[#FAFAFA] rounded-2xl p-8 text-center hover:-translate-y-1 transition-transform duration-300">
            <div className="text-4xl md:text-5xl font-light mb-2 text-[#111111]">15+</div><div className="text-[12px] text-gray-500 font-medium">年深耕高端代工</div>
          </div>
          <div className="bg-[#FAFAFA] rounded-2xl p-8 text-center hover:-translate-y-1 transition-transform duration-300">
            <div className="text-4xl md:text-5xl font-light mb-2 text-[#111111]">10k+</div><div className="text-[12px] text-gray-500 font-medium">成熟配方档案库</div>
          </div>
          <div className="bg-[#FAFAFA] rounded-2xl p-8 text-center hover:-translate-y-1 transition-transform duration-300">
            <div className="text-4xl md:text-5xl font-light mb-2 text-[#111111]">10w</div><div className="text-[12px] text-gray-500 font-medium">GMPC 无尘车间</div>
          </div>
          <div className="bg-[#FAFAFA] rounded-2xl p-8 text-center hover:-translate-y-1 transition-transform duration-300">
            <div className="text-4xl md:text-5xl font-light mb-2 text-[#111111]">1M+</div><div className="text-[12px] text-gray-500 font-medium">日均峰值产能 (支)</div>
          </div>
        </div>
      </section>

      {/* 4. OEM/ODM 模式总览 */}
      <section className="py-24 md:py-32 bg-[#FAFAFA]">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16 md:mb-20">
            <div className="text-[11px] tracking-[0.2em] text-gray-400 uppercase mb-4 font-bold">Service Models</div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-6 text-[#111111]">全链路代工解决方案</h2>
            <p className="text-gray-500 font-light max-w-2xl mx-auto text-[15px]">为全球跨国品牌、新锐国货以及跨界创作者提供高匹配度的柔性化制造与孵化服务。</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white border border-gray-100/50 p-10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 group cursor-pointer rounded-[24px]" onClick={() => navigate('/services')}>
              <Settings size={32} className="mb-6 text-gray-400 group-hover:text-[#111111] transition-colors" strokeWidth={1.5} />
              <div className="text-[11px] font-bold tracking-widest text-[#1A1A1A] mb-2 uppercase">Original Equipment Mfg</div>
              <h3 className="text-2xl font-light mb-4">OEM 敏捷制造</h3>
              <p className="text-[14px] text-gray-500 font-light leading-relaxed">您提供核心配方，我们依托 10 万级 GMPC 自动化车间进行精准复刻与规模化量产，保障极速响应与成本优势。</p>
            </div>
            <div className="bg-[#1A1A1A] text-white p-10 shadow-[0_10px_40px_rgb(0,0,0,0.1)] transform md:-translate-y-4 cursor-pointer rounded-[24px]" onClick={() => navigate('/services')}>
              <Beaker size={32} className="mb-6 text-gray-300" strokeWidth={1.5} />
              <div className="text-[11px] font-bold tracking-widest text-gray-400 mb-2 uppercase">Original Design Mfg</div>
              <h3 className="text-2xl font-light mb-4">ODM 深度定制</h3>
              <p className="text-[14px] text-gray-400 font-light leading-relaxed">联合生物实验室提供从专属配方研发、全套临床评估到包材甄选的端到端服务，打造绝对产品护城河。</p>
            </div>
            <div className="bg-white border border-gray-100/50 p-10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 group cursor-pointer rounded-[24px]" onClick={() => navigate('/services')}>
              <Box size={32} className="mb-6 text-gray-400 group-hover:text-[#111111] transition-colors" strokeWidth={1.5} />
              <div className="text-[11px] font-bold tracking-widest text-[#1A1A1A] mb-2 uppercase">Private Label / OBM</div>
              <h3 className="text-2xl font-light mb-4">贴牌与全案</h3>
              <p className="text-[14px] text-gray-500 font-light leading-relaxed">海量验证过的成熟配方库，极低门槛启动 (Low MOQ)。提供商标注册、视觉包装与药监合规代办的保姆级孵化。</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 厂房与研发实力 */}
      <section className="py-24 md:py-32 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-20">
            <div className="text-[11px] tracking-[0.2em] text-gray-400 uppercase mb-4 font-bold">Core Competence</div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-6">看得见的科研与智造底气</h2>
            <p className="text-gray-500 font-light max-w-2xl mx-auto text-[15px]">拒绝代工黑盒操作，为您呈现透明化、数据驱动的产品诞生全链路。</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">
            <div className="group bg-[#FAFAFA] p-8 md:p-12 border border-gray-100/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 rounded-[24px]">
              <div className="mb-8 overflow-hidden relative aspect-[16/9] rounded-[16px]">
                <img
                  src={
                    siteSettings?.coreCompetenceLabImageUrl ||
                    'https://dummyimage.com/1600x900/e5e7eb/374151.png&text=Lab'
                  }
                  alt="实验室"
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
                <h3 className="text-2xl font-light text-[#111111]">联合生物研发中心</h3>
              </div>
              <p className="text-[14px] text-gray-500 font-light leading-relaxed">
                汇聚国内外顶尖皮肤学配方专家。自建 3D 皮肤模型与精密的临床功效测试平台。从靶向促渗技术到全球臻稀原料复配，确保每一款配方兼具卓效与安全。
              </p>
            </div>

            <div className="group bg-[#1A1A1A] text-white p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-all duration-500 rounded-[24px]">
              <div className="mb-8 overflow-hidden relative aspect-[16/9] rounded-[16px]">
                <img
                  src={
                    siteSettings?.coreCompetenceGmpcImageUrl ||
                    'https://dummyimage.com/1600x900/111827/e5e7eb.png&text=GMPC'
                  }
                  alt="无菌车间"
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
                <h3 className="text-2xl font-light">10万级 GMPC 智造中心</h3>
              </div>
              <p className="text-[14px] text-gray-400 font-light leading-relaxed">
                对标制药级空气净化标准。引进 18 条进口全自动化无接触灌装流水线，深度集成 MES 系统，实现从原料投递到成品赋码的 100% 数据溯源。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. 四大核心商业优势 */}
      <section className="py-24 bg-[#FAFAFA]">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <div className="text-[11px] tracking-[0.2em] text-gray-400 uppercase mb-4 font-bold">Why Choose Us</div>
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">解决痛点，超越期待</h2>
            <p className="text-gray-500 font-light text-[15px] max-w-2xl mx-auto">不仅提供卓越的制造产能，更为您构筑坚实的商业后盾。</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: <Target size={28} strokeWidth={1.5}/>, title: "灵活起订 (Low MOQ)", desc: "打破代工高门槛。成熟配方支持小批量快返测试，缓解新锐品牌的资金压力。" },
              { icon: <Zap size={28} strokeWidth={1.5}/>, title: "极速打样 (Fast Sampling)", desc: "依托成熟数据库与敏捷研发团队，常规需求最快 3 天精准出样，抢占市场先机。" },
              { icon: <Lock size={28} strokeWidth={1.5}/>, title: "配方保密 (IP Protection)", desc: "签署严格保密协议 (NDA)。定制配方知识产权归属品牌方，保障商业机密。" },
              { icon: <Activity size={28} strokeWidth={1.5}/>, title: "极致性价比 (Cost Efficiency)", desc: "源头工厂直供，从包材集采到全自动化灌装，将成本优势最大化让利于您。" }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 border border-gray-100/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 rounded-[20px]">
                <div className="text-[#111111] mb-5">{item.icon}</div>
                <h4 className="text-[16px] font-medium mb-2">{item.title}</h4>
                <p className="text-[13px] text-gray-500 font-light leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. 全球出口与市场覆盖 */}
      <div className="relative py-32 md:py-40 bg-[#1A1A1A] text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000" alt="全球网络" className="w-full h-full object-cover opacity-[0.15] filter grayscale mix-blend-screen" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A1A] via-[#1A1A1A]/80 to-transparent"></div>
        </div>

        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-white"></div>
              <span className="text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase">Worldwide Service</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-6 leading-[1.15]">
              跨越国界的<br />全球交付网络。
            </h2>
            <p className="text-gray-400 font-light text-base md:text-lg leading-relaxed mb-12 max-w-xl">
              依托完善的国际合规团队与优质的跨境物流枢纽，我们的代工服务已成功覆盖多个海外主流及新兴市场。深谙各地区准入法规，为您的高效出海扫清障碍。
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-white/10 pt-10">
               <div className="group">
                  <div className="flex items-center gap-3 mb-3">
                    <ShieldCheck size={20} className="text-white" strokeWidth={1.5} />
                    <h4 className="text-[15px] font-medium text-white">国际法规准入</h4>
                  </div>
                  <p className="text-[13px] text-gray-400 font-light leading-relaxed">
                    熟练应对 FDA、CPNP 等严苛审查，提供全套清关所需的理化检测报告、MSDS 及 COA 文件。
                  </p>
               </div>
               <div className="group">
                  <div className="flex items-center gap-3 mb-3">
                    <Globe2 size={20} className="text-white" strokeWidth={1.5} />
                    <h4 className="text-[15px] font-medium text-white">无缝跨境物流</h4>
                  </div>
                  <p className="text-[13px] text-gray-400 font-light leading-relaxed">
                    支持 EXW, FOB, CIF 等多种贸易条款，与多家顶级物流网络深度绑定，确保大货安全准时抵达。
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* 8. 精选热门配方 */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <div className="text-[11px] tracking-[0.2em] text-gray-400 uppercase mb-4 font-bold">Featured Formulas</div>
              <h2 className="text-3xl md:text-4xl font-light tracking-tight">热销配方与质地档案</h2>
            </div>
            <button onClick={() => navigate('/products')} className="group flex items-center gap-2 text-[14px] font-medium tracking-wide text-gray-500 hover:text-[#111111] transition-colors">
              浏览产品中心 <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <div key={product.id} className="group cursor-pointer bg-[#FAFAFA] border border-gray-100/50 rounded-[20px] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-500" onClick={() => navigate(productDetailPath(product))}>
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-50 mb-3 rounded-t-[20px]">
                  <img src={product.img} alt={``} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-5 pt-2">
                  <div className="text-[10px] tracking-widest text-gray-400 uppercase mb-1.5">{product.category}</div>
                  <h3 className="text-[15px] font-medium group-hover:text-[#1A1A1A] transition-colors line-clamp-1 text-[#333]">{product.name}</h3>
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
                <h2 className="text-3xl md:text-4xl font-light tracking-tight">合作案例精选</h2>
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
              {siteSettings?.faqSectionTitle || '合作答疑指南'}
            </h2>
            <p className="text-gray-500 font-light text-[15px]">解答您在选择代工厂时最关注的核心政策与周期问题。</p>
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
              浏览完整指引 <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1"/>
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
  const { aboutPage, loading, error, reload } = useCms();
  const a = aboutPage ?? getDefaultAboutPage();

  if (loading && !aboutPage) {
    return <CmsLoadingScreen />;
  }
  if (error) {
    return (
      <div className="pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{error}</p>
        <button type="button" onClick={() => reload()} className="mt-6 text-[#111111] underline">
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="yozo-animate-page-in bg-white">
      <div className="pt-40 pb-24 container mx-auto px-6 md:px-12 text-center">
        <div className="inline-flex items-center gap-3 mb-8">
          <span className="h-px w-8 bg-gray-200"></span>
          <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-gray-400">{a.heroEyebrow}</span>
          <span className="h-px w-8 bg-gray-200"></span>
        </div>
        <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-8 leading-[1.15] text-[#111111]">
          {String(a.heroTitle || '')
            .split('\n')
            .map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 ? <br className="hidden md:block" /> : null}
              </span>
            ))}
        </h1>
        <p className="text-gray-500 font-light max-w-2xl mx-auto text-lg leading-relaxed whitespace-pre-line">
          {a.heroSubtitle}
        </p>
      </div>

      <div className="relative h-[60vh] min-h-[500px] w-full overflow-hidden mb-24">
        <img
          src={a.labImageUrl}
          alt=""
          className="w-full h-full object-cover filter grayscale-[20%]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-white text-3xl md:text-5xl font-light tracking-widest uppercase mb-4 leading-snug">
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
  return (
    <div className="yozo-animate-page-in pt-40 bg-white min-h-screen">
      {/* Hero Section */}
      <div className="container mx-auto px-6 md:px-12 text-center mb-24 md:mb-32">
        <div className="inline-flex items-center gap-3 mb-6">
          <span className="h-px w-8 bg-gray-200"></span>
          <span className="text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase">Global Cosmetic Manufacturing</span>
          <span className="h-px w-8 bg-gray-200"></span>
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight mb-8 leading-[1.1]">从卓越概念，<br/>到全球热销单品。</h1>
        <p className="text-gray-500 font-light max-w-2xl mx-auto text-lg leading-relaxed mb-10">
          依托符合国际 GMPC 及 ISO 22716 标准的智慧工厂，<br className="hidden md:block"/>YOZO 提供贯穿产品生命周期的端到端制造解决方案。赋能品牌高效出海，构筑核心产品护城河。
        </p>
        <button onClick={() => navigate('/contact')} className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white px-8 py-3.5 text-[14px] font-medium tracking-wide transition-all duration-300 rounded-full hover:bg-black hover:shadow-lg">
          获取专属代工方案 <ArrowRight size={16} />
        </button>
      </div>
      
      {/* 核心服务模式 */}
      <section className="bg-[#FAFAFA] py-24 border-y border-gray-100">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4 text-[#111111]">适应多维商业周期的全链路智造引擎</h2>
            <p className="text-gray-500 text-[15px] font-light max-w-2xl mx-auto">无论您是寻求产能突破的国际大牌，还是从 0 孵化的新锐国货，我们均提供高匹配度的柔性制造模块。</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* OEM */}
            <article className="bg-white border border-gray-100/50 p-10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 flex flex-col h-full rounded-[24px]">
              <Settings size={32} className="mb-8 text-gray-300" strokeWidth={1} />
              <div className="text-[11px] font-bold tracking-widest text-[#111111] mb-3 uppercase">Original Equipment Mfg</div>
              <h3 className="text-2xl font-light mb-4">OEM 敏捷代工</h3>
              <p className="text-[14px] text-gray-500 font-light leading-relaxed mb-6">您提供核心配方或品牌标准，我们依托 10 万级无尘自动化产线进行高标准复刻，保障大批量品质一致性与极致的成本控制。</p>
              <ul className="text-[13px] text-gray-400 font-light space-y-3 mt-auto border-t border-gray-100 pt-6">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#111111]"/> 严苛的原料溯源与来料质检 (IQC)</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#111111]"/> 日均超百万支的柔性灌装产能</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#111111]"/> 符合 FDA/CPNP 的出厂检测标准</li>
              </ul>
            </article>
            
            {/* ODM */}
            <article className="bg-[#1A1A1A] text-white p-10 shadow-[0_10px_40px_rgb(0,0,0,0.1)] transform md:-translate-y-4 flex flex-col h-full rounded-[24px]">
              <Beaker size={32} className="mb-8 text-gray-400" strokeWidth={1} />
              <div className="text-[11px] font-bold tracking-widest text-gray-400 mb-3 uppercase">Original Design Mfg</div>
              <h3 className="text-2xl font-light mb-4">ODM 深度定制研发</h3>
              <p className="text-[14px] text-gray-400 font-light leading-relaxed mb-6">整合全球顶级原料供应链与临床测试数据。从前瞻性的市场趋势企划、专属独家配方研发，到特殊包材结构开模，构筑绝对技术壁垒。</p>
              <ul className="text-[13px] text-gray-400 font-light space-y-3 mt-auto border-t border-white/10 pt-6">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-white"/> 诺奖级核心成分/植物提取复配研发</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-white"/> 3D皮肤模型及人体功效实证测试</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-white"/> 配方知识产权 (IP) 排他性买断支持</li>
              </ul>
            </article>
            
            {/* OBM */}
            <article className="bg-white border border-gray-100/50 p-10 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 flex flex-col h-full rounded-[24px]">
              <Box size={32} className="mb-8 text-gray-300" strokeWidth={1} />
              <div className="text-[11px] font-bold tracking-widest text-[#111111] mb-3 uppercase">Private Label / OBM</div>
              <h3 className="text-2xl font-light mb-4">品牌贴牌全案孵化</h3>
              <p className="text-[14px] text-gray-500 font-light leading-relaxed mb-6">专为电商达人及跨界品牌打造。精选 10,000+ 经过市场验证的成熟爆款配方库，支持极低门槛启动 (Low MOQ) 与保姆级落地方案。</p>
              <ul className="text-[13px] text-gray-400 font-light space-y-3 mt-auto border-t border-gray-100 pt-6">
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#111111]"/> 3-5天极速打样确认，抢占风口</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#111111]"/> 免费品牌视觉设计与包材选型</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#111111]"/> 药监局非特备案及特证代办服务</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* 标准化代工流程 */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 md:px-12 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light tracking-tight mb-4 text-[#111111]">标准化与透明化的高端代工流程</h2>
            <p className="text-gray-500 text-[15px] font-light">全链路数据驱动，拒绝“制造黑盒”，保障您的新品以最高效的速度推向全球市场。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
             <div className="hidden lg:block absolute top-[40px] left-[10%] right-[10%] h-[1px] bg-gray-100 -z-10"></div>
             {[
               { step: "01", title: "需求企划与对接", desc: "专属业务总监 1对1 沟通。确立核心受众、功效宣称诉求、包材材质偏好及成本核算。" },
               { step: "02", title: "联合实验室打样", desc: "资深配方师介入，调取数据库或重构配方体系。常规需求最快 3 天输出首版实物样品供评测。" },
               { step: "03", title: "评测与合规备案", desc: "进行高低温稳定性挑战测试及理化防腐测试。同时法务团队平行推进药监系统产品备案核准。" },
               { step: "04", title: "GMPC量产与交付", desc: "大货包材消毒入库，MES系统排单投料生产。全检合格后提供检测报告，并无缝对接跨境物流。" }
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
              <div className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-4">Core Capacities</div>
              <h2 className="text-3xl font-light tracking-tight text-white">驱动创新的核心工艺配置</h2>
            </div>
            <p className="text-gray-400 font-light max-w-lg text-[14px]">
              不仅局限于传统的膏霜水乳，我们斥资引进国际尖端设备，全面覆盖高难度剂型及医药级无菌包装生产线。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-white/10 p-8 rounded-[20px] bg-white/5 backdrop-blur-sm">
              <Droplets className="text-gray-300 mb-6" size={28} strokeWidth={1.5} />
              <h4 className="text-xl font-medium mb-3">BFS 无菌次抛与冻干线</h4>
              <p className="text-[13px] text-gray-400 font-light leading-relaxed mb-4">
                百级净化核心产区。配备吹灌封 (Blow-Fill-Seal) 一体机及真空冷冻干燥机，专攻高活性维C、蓝铜胜肽及冻干粉产品，确保无防腐剂添加条件下的绝佳鲜活度。
              </p>
            </div>
            <div className="border border-white/10 p-8 rounded-[20px] bg-white/5 backdrop-blur-sm">
              <Layers className="text-gray-300 mb-6" size={28} strokeWidth={1.5} />
              <h4 className="text-xl font-medium mb-3">多相微乳化与微囊包裹工艺</h4>
              <p className="text-[13px] text-gray-400 font-light leading-relaxed mb-4">
                引进德国 IKA 高剪切均质乳化系统。突破传统水油相融限制，实现纳米级粒径乳液。通过微脂囊技术实现核心活性成分的定向靶向缓释。
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
      <div className="pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{error}</p>
        <button type="button" onClick={() => reload()} className="mt-6 text-[#111111] underline">
          重试
        </button>
      </div>
    );
  }

  const hasMore = visibleCount < filteredProducts.length;

  return (
    <div className="yozo-animate-page-in pt-40 pb-32 bg-[#FAFAFA] min-h-screen">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="h-px w-8 bg-gray-200"></span><span className="text-[11px] tracking-[0.2em] text-gray-400 uppercase font-bold">Formula Center</span><span className="h-px w-8 bg-gray-200"></span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-6">配方档案库</h1>
          <p className="text-gray-500 font-light max-w-2xl mx-auto text-[15px]">
            浏览我们为您准备的精选代表作。<br/>所有配方均支持 OEM 极速复刻及 ODM 深度定制开模。
          </p>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 bg-white p-5 border border-gray-100 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto flex-1">
            <Filter size={16} className="text-gray-300 mr-2 hidden lg:block" />
            {productCategories.map((cat) => (
              <button 
                key={cat} onClick={() => { setActiveCategory(cat); setVisibleCount(8); }}
                className={`px-5 py-2 text-[13px] transition-all duration-300 rounded-full whitespace-nowrap border ${
                  activeCategory === cat ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md' : 'bg-transparent text-gray-500 hover:text-[#111111] border-gray-200 hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72 flex-shrink-0 mt-4 lg:mt-0">
            <input 
              type="text" placeholder="搜索配方功效..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
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
                <div className="text-[10px] tracking-widest text-gray-400 uppercase mb-2">{product.category}</div>
                <h3 className="text-[16px] font-medium mb-4 group-hover:text-[#111111] transition-colors line-clamp-1 text-[#333]">{product.name}</h3>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {product.tags.map((tag, i) => (
                    <span key={i} className="bg-[#FAFAFA] border border-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-sm"><Tag size={8} className="inline mr-1 opacity-50"/>{tag}</span>
                  ))}
                </div>
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-2 text-[11px] text-gray-400 font-light">
                  <Package size={12} /><span className="truncate">包装建议: {product.packaging}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="text-center">
            <button onClick={() => setVisibleCount(prev => prev + 4)} className="bg-white border border-gray-200 text-[#111111] px-10 py-3.5 text-[13px] font-medium hover:bg-gray-50 transition-colors rounded-full shadow-sm">
              加载更多配方
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
      <div className="pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{error}</p>
        <button type="button" onClick={() => reload()} className="mt-6 text-[#111111] underline">
          重试
        </button>
      </div>
    );
  }

  const relatedProducts = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 3);

  // 针对产品的动态 FAQ
  const productFaqs = [
    { q: `这款 ${product.name} 的配方可以微调吗？`, a: `完全可以。我们支持在现有成熟配方基础上，根据您的品牌定位对核心成分浓度、肤感质地及香型进行微调（ODM 敏捷定制）。${product.oemDesc}` },
    { q: "如果采用这款配方，最快多久可以大货交付？", a: "在包材与原料齐备、且不需要重新进行特证备案的情况下，依托我们 10 万级 GMPC 智造中心的柔性产线，首单通常可在 25-30 个工作日内完成交付。返单最快可压缩至 15 天。" },
    { q: "产品是否能提供相关的功效测试报告？", a: "我们的联合生物实验室可为您提供基础的理化与防腐挑战测试报告。如需 3D 皮肤模型或人体临床功效实证（如抗皱、美白），我们也可协助对接权威第三方检测机构（SGS 等）出具报告。" }
  ];

  return (
    <div className="yozo-animate-page-in bg-white min-h-screen">
      
      {/* 1. 首屏：核心产品信息区 (Hero Section) */}
      <section className="pt-40 pb-20 bg-[#FAFAFA] border-b border-gray-100">
        <div className="container mx-auto px-6 md:px-12">
          <button onClick={() => navigate('/products')} className="group text-[12px] font-medium tracking-[0.1em] text-gray-400 hover:text-[#111111] mb-12 flex items-center gap-2 transition-colors uppercase">
             <ArrowRight size={14} className="rotate-180 transition-transform group-hover:-translate-x-1" /> 返回配方档案库
          </button>
          
          <article itemScope itemType="https://schema.org/Product" className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
            
            {/* 左侧：产品视觉图 */}
            <div className="lg:col-span-5 relative">
              <div className="bg-white aspect-[4/5] rounded-[24px] overflow-hidden border border-gray-100/80 p-6 flex items-center justify-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] sticky top-32">
                <img src={product.img} alt={product.name} itemProp="image" className="w-full h-full object-cover rounded-[12px] hover:scale-105 transition-transform duration-1000" />
                <div className="absolute top-10 left-10 bg-white/90 backdrop-blur text-[#111111] px-4 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase shadow-sm">
                  Ready to Label
                </div>
              </div>
            </div>
            
            {/* 右侧：产品参数与转化核心 */}
            <div className="lg:col-span-7 flex flex-col justify-center py-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[11px] font-bold tracking-[0.2em] text-[#111111] uppercase bg-gray-200/50 px-3 py-1 rounded-full">{product.category}</span>
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

              <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-12 border-y border-gray-200/60 py-8">
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Settings size={12}/> 建议起订量 (MOQ)</div>
                  <div className="text-[15px] font-medium text-[#111111]">5,000 支起 (支持试单)</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Beaker size={12}/> 敏捷打样 (Sampling)</div>
                  <div className="text-[15px] font-medium text-[#111111]">3-5 个工作日内出样</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Package size={12}/> 推荐包材方案</div>
                  <div className="text-[14px] text-[#111111] font-light">{product.packaging}</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Target size={12}/> 适用肤质 / 人群</div>
                  <div className="text-[14px] text-[#111111] font-light line-clamp-1" title={product.skinType}>{product.skinType}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => navigate('/contact')} className="group bg-[#1A1A1A] text-white py-4 px-10 text-[13px] font-medium tracking-[0.1em] hover:bg-black transition-all duration-300 flex justify-center items-center gap-3 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.1)]">
                  索取配方样板 <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
                <button onClick={() => navigate('/contact')} className="group border border-gray-200 bg-white text-[#111111] py-4 px-10 text-[13px] font-medium tracking-[0.1em] hover:border-gray-400 transition-colors flex justify-center items-center gap-3 rounded-full">
                  获取专属报价
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
              <h2 className="text-2xl md:text-3xl font-light text-[#111111] mb-4">核心功效与受众</h2>
              <p className="text-[13px] tracking-widest text-gray-400 uppercase font-bold">Efficacy & Target</p>
            </div>
            <div className="md:col-span-8 bg-[#FAFAFA] p-8 md:p-12 rounded-[24px] border border-gray-100/50">
              <div className="mb-8">
                <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Target size={14}/> 核心功效宣称</h3>
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
                <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={14}/> 适用场景与肤质</h3>
                <p className="text-[15px] text-gray-600 font-light leading-relaxed">{product.skinType}</p>
              </div>
            </div>
          </div>

          {/* 模块 B：前沿成分剖析 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-24">
            <div className="md:col-span-4 md:order-last">
              <h2 className="text-2xl md:text-3xl font-light text-[#111111] mb-4">前沿成分剖析</h2>
              <p className="text-[13px] tracking-widest text-gray-400 uppercase font-bold">Key Ingredients</p>
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
              <h2 className="text-2xl md:text-3xl font-light text-[#111111] mb-4">柔性定制空间</h2>
              <p className="text-[13px] tracking-widest text-gray-400 uppercase font-bold">Customization</p>
            </div>
            <div className="md:col-span-8 bg-[#1A1A1A] text-white p-8 md:p-12 rounded-[24px] shadow-lg relative overflow-hidden">
              <Sparkles className="absolute -bottom-6 -right-6 text-white/5 w-48 h-48" strokeWidth={1} />
              <div className="relative z-10">
                <p className="text-[16px] text-gray-300 font-light leading-relaxed mb-8">
                  作为专业的 ODM 工厂，我们不仅提供标准化成品，更支持围绕您的品牌基因进行深度改造。针对该配方，我们为您提供以下维度的专属定制选项：
                </p>
                <div className="bg-white/10 border border-white/20 p-6 rounded-[16px] backdrop-blur-sm">
                  <h4 className="text-[14px] font-medium text-white mb-2 flex items-center gap-2"><Settings size={16}/> 专属定制项</h4>
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
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4 text-[#111111]">定制与交付答疑</h2>
            <p className="text-gray-500 text-[15px] font-light">关于该配方及生产周期的常见问题</p>
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
                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-[#111111] mb-2">更多同品类推荐</h2>
                <p className="text-[13px] tracking-[0.2em] text-gray-400 uppercase font-bold">Related Formulas</p>
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
                    <div className="text-[10px] tracking-widest text-gray-400 uppercase mb-2">{relProduct.category}</div>
                    <h3 className="text-[16px] font-medium mb-3 group-hover:text-[#111111] transition-colors line-clamp-1 text-[#333]">{relProduct.name}</h3>
                    <p className="text-[13px] text-gray-500 font-light line-clamp-2 mb-4">{relProduct.desc}</p>
                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] font-medium">
                      <span className="text-gray-400 group-hover:text-[#111111] transition-colors flex items-center gap-1">查看详情 <ArrowUpRight size={12}/></span>
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
  const { faqs, loading, error, reload } = useCms();
  const [openFaq, setOpenFaq] = useState(0);

  if (loading) return <CmsLoadingScreen />;
  if (error) {
    return (
      <div className="pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{error}</p>
        <button type="button" onClick={() => reload()} className="mt-6 text-[#111111] underline">
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="yozo-animate-page-in pt-40 bg-[#FAFAFA] min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl pb-32">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="h-px w-8 bg-gray-300"></span><span className="text-[11px] tracking-[0.2em] uppercase text-gray-400 font-bold">Guidelines</span><span className="h-px w-8 bg-gray-300"></span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-center mb-6">合作指引与答疑</h1>
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
const ContactPage = () => (
  <div className="yozo-animate-page-in pt-40 bg-[#FAFAFA] min-h-screen">
    <div className="container mx-auto px-6 md:px-12 text-center mb-16">
      <div className="inline-flex items-center gap-3 mb-6">
        <span className="h-px w-8 bg-gray-300"></span><span className="text-[11px] font-bold tracking-[0.3em] uppercase text-gray-400">Global Network</span><span className="h-px w-8 bg-gray-300"></span>
      </div>
      <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-6 text-[#111111]">全球联络枢纽</h1>
      <p className="text-gray-500 font-light text-lg">开启跨越国界的美妆制造合作之旅。</p>
    </div>

    {/* Global Network Map Section */}
    <section className="container mx-auto px-6 md:px-12 mb-24">
      <div className="relative w-full rounded-[32px] overflow-hidden bg-[#111111] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)]">
        {/* Earth/Network Background */}
        <div className="absolute inset-0 z-0">
           <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000" alt="Global Network" className="w-full h-full object-cover opacity-[0.35] mix-blend-screen" />
           <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/30 via-transparent to-[#111111]/90"></div>
        </div>

        <div className="relative z-10 p-10 md:p-16 lg:p-20">
           <div className="text-center mb-16">
             <h2 className="text-3xl md:text-4xl font-light text-white mb-6 tracking-tight">业务版图辐射全球</h2>
             <p className="text-white/60 font-light text-[15px] max-w-2xl mx-auto leading-relaxed">
               以中国智造为核心，我们的代工产品已成功远销北美、欧洲、中东及亚太等 50 多个国家与地区，具备完善的全球化清关与合规交付能力。
             </p>
           </div>

           {/* Interactive Map Visual */}
           <div className="relative w-full h-[300px] md:h-[450px] rounded-[24px] border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden mb-16 flex items-center justify-center">
             {/* CSS Grid Pattern */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]"></div>

             {/* Hub Nodes */}
             {[
               { top: '35%', left: '20%', label: '北美枢纽', sub: 'New York' },
               { top: '40%', left: '48%', label: '欧洲枢纽', sub: 'Paris' },
               { top: '55%', left: '60%', label: '中东枢纽', sub: 'Dubai' },
               { top: '48%', left: '75%', label: '全球制造总部', sub: 'Shantou, CN', isHQ: true },
               { top: '42%', left: '85%', label: '亚太运营', sub: 'Tokyo' },
               { top: '70%', left: '82%', label: '大洋洲枢纽', sub: 'Sydney' }
             ].map((dot, i) => (
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
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff]"></span> Headquarters</span>
                <span className="flex items-center gap-2"><span className="w-2 h-2 bg-gray-400 rounded-full"></span> Regional Hubs</span>
             </div>
           </div>

           {/* Key Stats */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center divide-x-0 md:divide-x divide-white/10">
              <div>
                 <div className="text-4xl font-light text-white mb-2">50<span className="text-2xl text-white/50">+</span></div>
                 <div className="text-[11px] tracking-[0.2em] text-white/50 uppercase font-bold">出口国家/地区</div>
              </div>
              <div>
                 <div className="text-4xl font-light text-white mb-2">100<span className="text-2xl text-white/50">%</span></div>
                 <div className="text-[11px] tracking-[0.2em] text-white/50 uppercase font-bold">FDA/CPNP 达标</div>
              </div>
              <div>
                 <div className="text-4xl font-light text-white mb-2">15<span className="text-2xl text-white/50">d</span></div>
                 <div className="text-[11px] tracking-[0.2em] text-white/50 uppercase font-bold">最快全球交付</div>
              </div>
              <div>
                 <div className="text-4xl font-light text-white mb-2">7<span className="text-xl text-white/50">x</span>24</div>
                 <div className="text-[11px] tracking-[0.2em] text-white/50 uppercase font-bold">全时区联络响应</div>
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
             <h4 className="text-[16px] font-medium text-[#111111] mb-2">全球制造与研发总部</h4>
             <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Shantou, China</div>
             <p className="text-[13px] text-gray-500 font-light leading-relaxed">中国广东省汕头市龙湖区鸥汀街道防汛路31号东侧 (10万级 GMPC 智造中心)</p>
          </div>
          <div className="bg-white p-8 rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:-translate-y-1 transition-transform">
             <div className="w-10 h-10 rounded-full bg-[#FAFAFA] flex items-center justify-center mb-6 text-[#111111]">
               <Phone size={18} strokeWidth={1.5}/>
             </div>
             <h4 className="text-[16px] font-medium text-[#111111] mb-2">业务与出海咨询专线</h4>
             <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">24/7 Global Support</div>
             <p className="text-[13px] text-gray-500 font-light leading-relaxed space-y-2 flex flex-col">
               <span>直线: +86 0754-89920101</span>
               <span>WhatsApp: +86 13632470463</span>
             </p>
          </div>
          <div className="bg-white p-8 rounded-[20px] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:-translate-y-1 transition-transform">
             <div className="w-10 h-10 rounded-full bg-[#FAFAFA] flex items-center justify-center mb-6 text-[#111111]">
               <Mail size={18} strokeWidth={1.5}/>
             </div>
             <h4 className="text-[16px] font-medium text-[#111111] mb-2">企业邮箱与商务合作</h4>
             <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">Business Inquiry</div>
             <p className="text-[13px] text-gray-500 font-light leading-relaxed">
               索取专属代工报价、产品图册或预约实地验厂，请发送邮件至：
               <br/><span className="text-[#111111] font-medium mt-2 block">yozobeauty@outlook.com</span>
             </p>
          </div>
       </div>
    </section>

    <SharedContactCTA source="contact" />
  </div>
);

// --- 资讯中心列表页 ---
const NewsPage = () => {
  const navigate = useNavigate();
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
      <div className="pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{error}</p>
        <button type="button" onClick={() => reload()} className="mt-6 text-[#111111] underline">
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="yozo-animate-page-in pt-40 pb-32 bg-[#FAFAFA] min-h-screen">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <span className="h-px w-8 bg-gray-200"></span><span className="text-[11px] tracking-[0.2em] text-gray-400 uppercase font-bold">News & Insights</span><span className="h-px w-8 bg-gray-200"></span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-6 text-[#111111]">资讯与洞察</h1>
          <p className="text-gray-500 font-light max-w-2xl mx-auto text-[15px]">
            获取美妆制造前沿动态、行业趋势研究与品牌孵化指南。
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
                Featured
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
                阅读深度长文 <ArrowRight size={16} />
              </div>
            </div>
          </div>
        )}

        {/* 筛选与搜索 */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 bg-white p-5 border border-gray-100 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto flex-1">
            <Filter size={16} className="text-gray-300 mr-2 hidden lg:block" />
            {articleCategories.map((cat) => (
              <button 
                key={cat} onClick={() => { setActiveCategory(cat); setVisibleCount(6); }}
                className={`px-5 py-2 text-[13px] transition-all duration-300 rounded-full whitespace-nowrap border ${
                  activeCategory === cat ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-md' : 'bg-transparent text-gray-500 hover:text-[#111111] border-gray-200 hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72 flex-shrink-0 mt-4 lg:mt-0">
            <input 
              type="text" placeholder="搜索资讯..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
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
                  <span className="flex items-center gap-1.5"><Clock size={12}/> {article.readTime} Read</span>
                  <span className="text-[#111111] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">阅读 <ChevronRight size={14}/></span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {hasMore && (
          <div className="text-center">
            <button onClick={() => setVisibleCount(prev => prev + 6)} className="bg-white border border-gray-200 text-[#111111] px-10 py-3.5 text-[13px] font-medium hover:bg-gray-50 transition-colors rounded-full shadow-sm">
              加载更多洞察
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
      <div className="pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{error}</p>
        <button type="button" onClick={() => reload()} className="mt-6 text-[#111111] underline">
          重试
        </button>
      </div>
    );
  }

  const relatedArticles = articles.filter((a) => a.id !== article.id && a.category === article.category).slice(0, 2);

  return (
    <div className="yozo-animate-page-in bg-white min-h-screen">
      
      {/* 头部区 */}
      <header className="relative pt-40 pb-20 md:pb-32 bg-[#FAFAFA] border-b border-gray-100">
        <div className="container mx-auto px-6 md:px-12 max-w-4xl">
          <button onClick={() => navigate('/news')} className="group text-[12px] font-medium tracking-[0.1em] text-gray-400 hover:text-[#111111] mb-12 flex items-center gap-2 transition-colors uppercase">
            <ArrowRight size={14} className="rotate-180 transition-transform group-hover:-translate-x-1" /> Back to News
          </button>
          <div className="flex items-center gap-4 text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-6">
             <span className="bg-[#111111] text-white px-3 py-1 rounded-full">{article.category}</span>
             <time dateTime={article.date}>{article.date}</time>
             <span className="w-1 h-1 rounded-full bg-gray-300"></span>
             <span className="flex items-center gap-1.5"><Clock size={12}/> {article.readTime} Read</span>
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
  const { caseStudies, loading, error, reload } = useCms();
  const study = slug ? resolveCaseStudyBySlug(caseStudies, slug) : null;

  if (loading) return <CmsLoadingScreen />;
  if (error) {
    return (
      <div className="pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{error}</p>
        <button type="button" onClick={() => reload()} className="mt-6 text-[#111111] underline">
          重试
        </button>
      </div>
    );
  }
  if (!study) {
    return (
      <div className="pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>未找到该案例</p>
        <button type="button" onClick={() => navigate('/')} className="mt-6 text-[#111111] underline">
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="yozo-animate-page-in pt-40 pb-24 bg-white min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="group text-[12px] font-medium tracking-[0.1em] text-gray-400 hover:text-[#111111] mb-10 flex items-center gap-2 transition-colors uppercase"
        >
          <ArrowRight size={14} className="rotate-180 transition-transform group-hover:-translate-x-1" /> 返回
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
  const { simplePages, loading, error, reload } = useCms();
  const page = slug ? resolveSimplePageBySlug(simplePages, slug) : null;

  if (loading) return <CmsLoadingScreen />;
  if (error) {
    return (
      <div className="pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>{error}</p>
        <button type="button" onClick={() => reload()} className="mt-6 text-[#111111] underline">
          重试
        </button>
      </div>
    );
  }
  if (!page) {
    return (
      <div className="pt-40 pb-32 text-center text-[14px] text-gray-500 font-light">
        <p>未找到页面</p>
        <button type="button" onClick={() => navigate('/')} className="mt-6 text-[#111111] underline">
          返回首页
        </button>
      </div>
    );
  }

  return (
    <div className="yozo-animate-page-in pt-40 pb-24 bg-[#FAFAFA] min-h-screen">
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

function SiteShell() {
  const navigate = useNavigate();
  const location = useLocation();
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
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-[#222222] selection:bg-gray-200 relative">
      
      {/* 现代化高端导航栏 */}
      <nav className={`fixed w-full z-50 transition-all duration-700 ${
        navOnLight
          ? 'bg-white/75 backdrop-blur-2xl border-b border-gray-200/50 shadow-[0_4px_30px_rgba(0,0,0,0.03)] py-4' 
          : 'bg-transparent border-b border-white/10 py-8'
      }`}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex justify-between items-center relative">
          
          <div className={`text-2xl font-bold tracking-[0.15em] uppercase cursor-pointer transition-colors duration-500 ${navOnLight ? 'text-[#111111]' : 'text-white'}`} onClick={() => navigate('/')}>
            {siteBrandTitle ? (
              <span>{siteBrandTitle}</span>
            ) : (
              <>
                YOZO<span className="text-gray-400">.</span>
              </>
            )}
          </div>
          
          <div className={`hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 transition-colors duration-500 ${navOnLight ? 'text-gray-500' : 'text-white/80'}`}>
            {navItems.map((item) => {
              const isActive = navItemActive(location.pathname, item);
              return (
                <button
                  type="button"
                  key={`${item.path}-${item.label}`}
                  onClick={() => followHref(navigate, item.path, item.newTab)}
                  className="group relative flex flex-col items-center gap-1.5"
                >
                  <span className={`text-[13px] tracking-wide transition-colors duration-300 ${
                    isActive 
                      ? (navOnLight ? 'text-[#111111] font-medium' : 'text-white font-medium')
                      : (navOnLight ? 'hover:text-[#111111]' : 'hover:text-white')
                  }`}>
                    {item.label}
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

          <div className="hidden lg:flex items-center gap-6">
            <button
              type="button"
              onClick={() =>
                headerCta?.href && headerCta?.label
                  ? followHref(navigate, headerCta.href)
                  : navigate('/contact')
              }
              className={`px-7 py-2.5 text-[12px] tracking-[0.1em] font-medium transition-all duration-500 border rounded-full ${
              navOnLight
                ? 'bg-transparent border-gray-300 text-[#111111] hover:bg-[#1A1A1A] hover:text-white hover:border-[#1A1A1A]' 
                : 'bg-white border-white text-[#111111] hover:bg-transparent hover:text-white'
            }`}
            >
              {headerCta?.label || '免费询盘'}
            </button>
          </div>

          <button className={`lg:hidden transition-colors duration-500 ${navOnLight ? 'text-[#111111]' : 'text-white'}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={28} strokeWidth={1.5} /> : <Menu size={28} strokeWidth={1.5} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white shadow-2xl border-t border-gray-100 py-6 flex flex-col">
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
                 {item.label}
               </button>
             ))}
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
                  {siteSettings?.footerTagline || siteSettings?.description ? (
                    <span className="whitespace-pre-line">{siteSettings.footerTagline || siteSettings.description}</span>
                  ) : (
                    <>
                      汕头市贞丽芙生物科技有限公司。<br />符合国际 GMPC 及 ISO 22716
                      标准的高端化妆品代工厂，以生物科技赋能全球顶级美妆生态。
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
                    <span className="w-3 h-px bg-white/40"></span> 快速导览
                  </h4>
                  <ul className="space-y-5 text-[14px] font-light text-white/70">
                    <li><button onClick={()=>navigate('/about')} className="hover:text-white transition-colors relative group">品牌探索<span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span></button></li>
                    <li><button onClick={()=>navigate('/services')} className="hover:text-white transition-colors relative group">代工方案<span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span></button></li>
                    <li><button onClick={()=>navigate('/products')} className="hover:text-white transition-colors relative group">配方档案<span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span></button></li>
                    <li><button onClick={()=>navigate('/faq')} className="hover:text-white transition-colors relative group">合作指引<span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span></button></li>
                  </ul>
                </div>
                
                {/* 业务中心 */}
                <div>
                  <h4 className="text-[12px] font-bold text-white tracking-[0.2em] uppercase mb-8 flex items-center gap-3">
                    <span className="w-3 h-px bg-white/40"></span> 业务中心
                  </h4>
                  <ul className="space-y-5 text-[14px] font-light text-white/70">
                    <li><button onClick={()=>navigate('/news')} className="hover:text-white transition-colors relative group">行业资讯<span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span></button></li>
                    <li><button onClick={()=>navigate('/contact')} className="hover:text-white transition-colors relative group">索取报价<span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span></button></li>
                    <li><button onClick={()=>navigate('/contact')} className="hover:text-white transition-colors relative group">申请打样<span className="absolute -bottom-1 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span></button></li>
                  </ul>
                </div>

                {/* 联络枢纽 */}
                <div>
                  <h4 className="text-[12px] font-bold text-white tracking-[0.2em] uppercase mb-8 flex items-center gap-3">
                    <span className="w-3 h-px bg-white/40"></span> 联络枢纽
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
                            中国广东省汕头市龙湖区
                            <br />
                            鸥汀街道防汛路31号东侧
                          </>
                        )}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
           </div>
           
           {/* 版权声明区 */}
           <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-[13px] font-light text-white/50">
              <div className="text-center md:text-left order-2 md:order-1 tracking-wide">
                {siteSettings?.footerCopyright ||
                  `© ${new Date().getFullYear()} 汕头市贞丽芙生物科技有限公司 (YOZO). All rights reserved.`}
              </div>
              <div className="flex gap-8 order-1 md:order-2">
                <button className="hover:text-white transition-colors">隐私政策 (Privacy Policy)</button>
                <button className="hover:text-white transition-colors">服务条款 (Terms of Service)</button>
              </div>
           </div>
        </div>
      </footer>

      {/* 全局右下角悬浮表单 */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
        {floatingFormOpen && (
          <div className="bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] border border-gray-100 rounded-2xl p-8 mb-4 w-[320px] md:w-[380px] yozo-animate-panel-up">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-[15px] font-medium text-[#111111] tracking-wide">发送询盘请求</h4>
              <button onClick={() => setFloatingFormOpen(false)} className="text-gray-400 hover:text-[#111111] transition-colors"><X size={18} strokeWidth={1.5}/></button>
            </div>
            <form className="space-y-5" onSubmit={async (e) => {
              e.preventDefault();
              setFloatHint('');
              if (!floatName.trim() || !floatPhone.trim()) {
                setFloatHint('请填写姓名与联系方式');
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
                setFloatHint('已提交，我们将尽快回复。');
                setFloatName('');
                setFloatPhone('');
                setFloatMsg('');
                setTimeout(() => setFloatingFormOpen(false), 1500);
              } catch (err) {
                setFloatHint(err.message || '提交失败');
              } finally {
                setFloatSending(false);
              }
            }}>
              <input type="text" placeholder="您的姓名 *" value={floatName} onChange={(e) => setFloatName(e.target.value)} className="w-full bg-transparent border-b border-gray-200 pb-2 text-[13px] focus:outline-none focus:border-[#111111] transition-colors" />
              <input type="text" placeholder="联系电话 / WhatsApp *" value={floatPhone} onChange={(e) => setFloatPhone(e.target.value)} className="w-full bg-transparent border-b border-gray-200 pb-2 text-[13px] focus:outline-none focus:border-[#111111] transition-colors" />
              <textarea placeholder="简述您的定制需求..." rows={2} value={floatMsg} onChange={(e) => setFloatMsg(e.target.value)} className="w-full bg-transparent border-b border-gray-200 pb-2 text-[13px] focus:outline-none focus:border-[#111111] resize-none transition-colors"></textarea>
              {floatHint ? <p className="text-[12px] text-gray-500">{floatHint}</p> : null}
              <button type="submit" disabled={floatSending} className="group w-full bg-[#1A1A1A] text-white py-3.5 text-[12px] font-medium tracking-widest uppercase hover:bg-black transition-colors rounded-full mt-4 flex justify-center items-center gap-2 disabled:opacity-60">
                {floatSending ? '提交中…' : '获取专属报价'} <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1"/>
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