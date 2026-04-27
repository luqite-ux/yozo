/**
 * 与 website/src/App.jsx 中「无 CMS 时」的兜底文案一致；供 seed 脚本与 NDJSON 导入共用。
 * @returns {{ siteSettingsDoc: object, homePageDoc: object, aboutPageDoc: object }}
 */
export function getSeedDocuments() {
  const dimg = (w, h, t) =>
    `https://dummyimage.com/${w}x${h}/e5e7eb/374151.png&text=${encodeURIComponent(t)}`;
  const mainNavigation = [
    { _type: 'navItem', _key: 'nav-home', label: '首页', href: '/', openInNewTab: false },
    { _type: 'navItem', _key: 'nav-about', label: '品牌探索', href: '/about', openInNewTab: false },
    { _type: 'navItem', _key: 'nav-services', label: '代工方案', href: '/services', openInNewTab: false },
    { _type: 'navItem', _key: 'nav-products', label: '产品中心', href: '/products', openInNewTab: false },
    { _type: 'navItem', _key: 'nav-news', label: '资讯中心', href: '/news', openInNewTab: false },
    { _type: 'navItem', _key: 'nav-faq', label: '合作指引', href: '/faq', openInNewTab: false },
    { _type: 'navItem', _key: 'nav-contact', label: '全球联络', href: '/contact', openInNewTab: false },
  ];

  const siteSettingsDoc = {
    _id: 'siteSettings',
    _type: 'siteSettings',
    title: 'YOZO',
    tagline: '以前沿生物科技，赋能顶尖美妆品牌',
    description:
      '汕头市贞丽芙生物科技有限公司。符合国际 GMPC 及 ISO 22716 标准的高端化妆品代工厂，以生物科技赋能全球顶级美妆生态。',
    localeDefault: 'zh-CN',
    contactPhone: '+86 0754-89920101',
    contactWhatsapp: '+86 13632470463',
    contactEmail: 'yozobeauty@outlook.com',
    address: '中国广东省汕头市龙湖区\n鸥汀街道防汛路31号东侧',
    headerCta: { label: '免费询盘', href: '/contact' },
    mainNavigation,
    footerTagline:
      '汕头市贞丽芙生物科技有限公司。符合国际 GMPC 及 ISO 22716 标准的高端化妆品代工厂，以生物科技赋能全球顶级美妆生态。',
    footerCopyright: `© ${new Date().getFullYear()} 汕头市贞丽芙生物科技有限公司 (YOZO). All rights reserved.`,
    defaultSeo: {
      _type: 'seo',
      seoTitle: 'YOZO · 高端化妆品 OEM/ODM',
      seoDescription:
        '国际标准 OEM/ODM 全链路代工，GMPC & ISO 22716 认证工厂，配方研发至全球交付。',
    },
  };

  const homePageDoc = {
    _id: 'homePage',
    _type: 'homePage',
    hero: {
      _type: 'heroBanner',
      title: '以前沿生物科技，\n赋能顶尖美妆品牌。',
      subtitle:
        '提供国际标准的 OEM / ODM 全链路代工方案。\n从配方研发到全球出海，为您构筑绝对护城河。',
      trustBadge: 'ISO 22716 & GMPC Certified',
      primaryCtaLabel: '探索代工引擎',
      primaryCtaUrl: '/services',
      secondaryCtaLabel: '索取打样方案',
      secondaryCtaUrl: '/contact',
    },
    content: {
      heroFallbackImageUrl:
        'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=2000',
      trustLine: 'Trusted by global ingredient and certification partners',
      trustBrands: ['SGS Tested', 'BASF', 'DSM', 'Symrise', 'Lubrizol', 'Givaudan', 'FDA Compliant'],
      stats: [
        { _type: 'object', value: '15+', label: 'Years Experience' },
        { _type: 'object', value: '10k+', label: 'Formula Library' },
        { _type: 'object', value: '10w', label: 'Grade Cleanroom' },
        { _type: 'object', value: '1M+', label: 'Monthly Capacity' },
      ],
      serviceEyebrow: 'Enterprise Manufacturing Models',
      serviceTitle: '高端 OEM / ODM 服务矩阵',
      serviceLead: '覆盖从概念验证到规模化交付的全流程合作模式。',
      oemTitle: 'OEM 敏捷制造',
      oemTagline: 'Original Equipment Mfg',
      oemCardLead: '成熟配方快速落地，稳定品控，适合快速上市项目。',
      oemCardUrl: '/services',
      odmTitle: 'ODM 深度定制',
      odmTagline: 'Original Design Mfg',
      odmCardLead: '从配方共创到视觉与包材联动，支持差异化竞争。',
      odmCardUrl: '/services',
      obmTitle: '贴牌与全案',
      obmTagline: 'Private Label / OBM',
      obmCardLead: '提供品牌孵化与商业化整案支持，缩短冷启动路径。',
      obmCardUrl: '/services',
      coreEyebrow: 'Core Competence',
      coreTitle: '从实验室到产线的闭环能力',
      coreLead: '以研发、合规和制造协同，提升品牌的长期确定性。',
      coreLabFallbackImageUrl: 'https://dummyimage.com/1600x900/e5e7eb/374151.png&text=Lab',
      coreGmpcFallbackImageUrl: 'https://dummyimage.com/1600x900/111827/e5e7eb.png&text=GMPC',
      whyEyebrow: 'Why Choose YOZO',
      whyTitle: '四大商业护城河',
      whyLead: '兼顾创新速度、交付质量与全球化合规。',
      why1t: '战略研发中台',
      why1d: '以市场洞察驱动选品与配方方向，降低试错成本。',
      why2t: '敏捷打样交付',
      why2d: '缩短从提案到样品的周期，支持快速验证与迭代。',
      why3t: '质量与合规并重',
      why3d: '全流程质量管理，匹配多区域法规准入要求。',
      why4t: '规模化供应保障',
      why4d: '稳定产能与供应链协同，支撑持续增长需求。',
      worldEyebrow: 'Global Capability',
      worldTitle1: '面向全球市场的',
      worldTitle2: '一站式出海支持',
      worldLead: '从配方到准入，协助品牌更快进入多区域市场。',
      worldFallbackImageUrl:
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000',
      worldLawT: 'Regulatory Readiness',
      worldLawD: '提供多市场法规支持与资料准备，降低出海门槛。',
      worldLogT: 'Logistics Collaboration',
      worldLogD: '联合供应链伙伴提升履约效率与交付稳定性。',
      featEyebrow: 'Featured Products',
      featTitle: '精选热门配方',
      browseProducts: '浏览全部配方',
      browseProductsUrl: '/products',
      casesEyebrow: 'Case Studies',
      casesTitle: '客户成功案例',
      faqSectionLead: '解答您在选择代工厂时最关注的核心政策与周期问题。',
      browseFullGuide: '浏览完整指引',
      browseFullGuideUrl: '/faq',
    },
    faqSectionTitle: '合作答疑指南',
    ctaSection: {
      title: '准备启动下一个爆款？',
      subtitle: '我们的工程师在 24 小时内响应您的初步提案。',
      buttonLabel: '预约技术路演',
      buttonUrl: '/contact',
    },
    seo: {
      _type: 'seo',
      seoTitle: '首页 · YOZO 高端代工',
      seoDescription: '以前沿生物科技赋能顶尖美妆品牌，OEM/ODM 全链路解决方案。',
    },
  };

  const aboutPageDoc = {
    _id: 'aboutPage',
    _type: 'aboutPage',
    heroEyebrow: 'About YOZO',
    heroTitle: '从卓越制造，\n到伟大的品牌孵化器。',
    heroSubtitle:
      '汕头市贞丽芙生物科技有限公司。我们不仅是隐于幕后的顶级代工执行者，更是多个知名美妆品牌背后的商业起盘者与核心科研大脑。',
    labImageUrl: dimg(2000, 1125, 'YOZO Lab'),
    labOverlayTitle: 'We engineer\nmarket leaders.',
    labOverlaySubtitle: '不止于造物，更赋能商业成功',
    manifestoQuote: '“一个优秀的代工厂，必须先懂得如何运营一个成功的品牌。”',
    manifestoBody:
      '依托十余年沉淀的研发壁垒与敏捷供应链，YOZO 突破了传统 OEM 仅停留在“代工加工”的局限。我们打通了从「前瞻性品类企划」、「核心独家配方研发」到「全案品牌落地」的完整闭环 (OBM)。这种深入骨髓的品牌运营基因，让我们在服务 B 端客户时，能够提供远超行业标准的战略级赋能。',
    portfolioEyebrow: 'Our Brand Portfolio',
    portfolioTitle: '多元化的自有品牌矩阵',
    portfolioIntro:
      '实战出真知。我们成功孵化并运营了以下细分赛道的标杆品牌，这是我们产品力与市场洞察力的最佳证明。',
    portfolioBrands: [
      {
        _type: 'aboutBrandCard',
        _key: 'yozo',
        name: 'YOZO',
        subtitle: '院线级高端抗衰标杆',
        description:
          '专研前沿生物科技与抗老成分的先锋品牌。将实验室级别的精纯抗衰分子转化为看得见的卓效年轻体验。',
        imageUrl: dimg(800, 600, 'YOZO'),
      },
      {
        _type: 'aboutBrandCard',
        _key: 'yozo-all',
        name: 'YOZO ALL IN ONE',
        subtitle: '极简多效精简护肤',
        description:
          '为现代快节奏都市人群打造。倡导以一抵多的极简护肤哲学，在精简步骤的同时不妥协深层修护功效。',
        imageUrl: dimg(800, 600, 'AIO'),
      },
      {
        _type: 'aboutBrandCard',
        _key: 'ohines',
        name: 'OHINES',
        subtitle: '敏感肌微生态修护',
        description:
          '专注受损屏障修护与敏感肌精研护理。以纯净植物精粹复配神经酰胺，重建肌肤健康微生态网络。',
        imageUrl: dimg(800, 600, 'OHINES'),
      },
      {
        _type: 'aboutBrandCard',
        _key: 'vivimiyu',
        name: 'VIVIMIYU',
        subtitle: '新锐东方色彩美学',
        description:
          '融合现代色彩工艺与轻养肤理念的彩妆品牌。重新定义亚洲肌肤的底妆质感与高定色彩表达。',
        imageUrl: dimg(800, 600, 'VIVIMIYU'),
      },
      {
        _type: 'aboutBrandCard',
        _key: 'janeage',
        name: 'JaneAge',
        subtitle: '熟龄肌分阶抗老专家',
        description:
          '针对 35+ 熟龄肌肤痛点量身定制。提供从紧致轮廓到密集抗皱的结构化、全周期抗老解决方案。',
        imageUrl: dimg(800, 600, 'JaneAge'),
      },
    ],
    portfolioCtaLabel: '探索我们的 OBM 贴牌全案服务',
    portfolioCtaHref: '/services',
    certSectionTitle: '全球化合规准入实力',
    certSectionSubtitle: 'Strict Global Quality Control & Certifications',
    certifications: [
      { _type: 'aboutCert', _key: 'c1', title: 'ISO 22716', subtitle: '国际化妆品优良制造规范', icon: 'shield' },
      { _type: 'aboutCert', _key: 'c2', title: 'GMPC Certified', subtitle: '10万级净化无尘车间认证', icon: 'award' },
      { _type: 'aboutCert', _key: 'c3', title: 'FDA Compliant', subtitle: '符合北美市场高标准准入', icon: 'globe' },
      { _type: 'aboutCert', _key: 'c4', title: 'SGS Tested', subtitle: '瑞士权威机构理化与安全检测', icon: 'activity' },
    ],
  };

  return { siteSettingsDoc, homePageDoc, aboutPageDoc };
}
