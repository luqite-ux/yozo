/**
 * Sanity 文档 → 原 JSON API 形状（页面样式不变）。
 * 若 Studio 字段名不同，在此统一映射。
 */

/** @param {string} ref */
export function sanityRefToLegacyId(ref) {
  if (!ref || typeof ref !== 'string') return 1;
  let h = 5381;
  for (let i = 0; i < ref.length; i += 1) {
    h = (h * 33) ^ ref.charCodeAt(i);
  }
  return Math.abs(h >>> 0) || 1;
}

/**
 * Portable Text block[] → 页面沿用结构 { type: 'h2'|'p'|'quote', text }
 * @param {unknown} blocks
 */
export function portableTextToLegacyContent(blocks) {
  if (!blocks || !Array.isArray(blocks)) return [];
  const out = [];
  for (const block of blocks) {
    if (!block || block._type !== 'block') continue;
    const text = (block.children || [])
      .map((c) => (c && typeof c.text === 'string' ? c.text : ''))
      .join('');
    if (!text.trim()) continue;
    const style = block.style || 'normal';
    if (style === 'h2' || style === 'h3' || style === 'h4') {
      out.push({ type: 'h2', text });
    } else if (style === 'blockquote') {
      out.push({ type: 'quote', text });
    } else {
      out.push({ type: 'p', text });
    }
  }
  return out;
}

/** Webhook 写入的译文本（双换行分段）→ 与 detailContent 相近的段落列表 */
function legacyContentFromPlain(text) {
  if (!text || typeof text !== 'string') return [];
  const parts = text
    .split(/\n\n+/)
    .map((t) => t.trim())
    .filter(Boolean);
  return parts.map((t) => ({ type: 'p', text: t }));
}

function coalescePlain(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return '';
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags
      .map((t) => {
        if (typeof t === 'string') return t;
        if (t && typeof t === 'object') return t.title || t.label || t.name || '';
        return '';
      })
      .filter(Boolean);
  }
  return [];
}

const EXTRA_LANGS = ['en', 'es', 'pt', 'ar', 'ru'];

function normalizeIngredients(list) {
  if (!Array.isArray(list) || !list.length) return [];
  return list.map((ing) => {
    const out = {
      name: coalescePlain(ing?.name, ing?.title, ing?.ingredient),
      desc: coalescePlain(ing?.desc, ing?.description, ing?.text, ing?.detail),
    };
    for (const l of EXTRA_LANGS) {
      out[`name_${l}`] = coalescePlain(ing?.[`name_${l}`]);
      out[`desc_${l}`] = coalescePlain(ing?.[`description_${l}`], ing?.[`desc_${l}`]);
    }
    return out;
  });
}

function normalizeEfficacy(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((e) => {
        if (typeof e === 'string') return e;
        if (e && typeof e === 'object') return e.text || e.title || e.label || '';
        return '';
      })
      .filter(Boolean);
  }
  if (typeof raw === 'string') return [raw];
  return [];
}

/**
 * @param {Record<string, unknown>} raw Sanity product 文档（已 GROQ 展开）
 */
export function mapSanityProduct(raw) {
  const cat = raw.category;
  const categoryTitle =
    typeof cat === 'string'
      ? cat
      : coalescePlain(cat?.title, cat?.name, raw.categoryTitle, raw.categoryLabel, '未分类');
  const catObj = typeof cat === 'object' && cat ? cat : null;

  const ingredients = normalizeIngredients(
    raw.ingredientsList || raw.ingredients || raw.keyIngredients,
  );
  const tags = normalizeTags(raw.tagsList || raw.tags || raw.tagLabels);
  const efficacy = normalizeEfficacy(raw.efficacy || raw.efficacyClaims || raw.benefits);

  const img = coalescePlain(
    raw.imageUrl,
    raw.mainImageUrl,
    raw.img,
    raw.image?.asset?.url,
    raw.mainImage?.asset?.url,
  );

  const bodyContent = portableTextToLegacyContent(raw.body);
  const desc = coalescePlain(raw.desc, raw.description, raw.excerpt, raw.summary);
  const applicationScenarios = coalescePlain(raw.applicationScenarios, raw.applications);
  const specs = normalizeSpecs(raw.specifications);

  const out = {
    id: sanityRefToLegacyId(String(raw._id)),
    sanityId: raw._id,
    slug: raw.slug || null,
    category: categoryTitle,
    name: coalescePlain(raw.name, raw.title),
    img,
    desc: desc || (bodyContent[0]?.text ?? ''),
    galleryUrls: Array.isArray(raw.galleryUrls) ? raw.galleryUrls.filter(Boolean) : [],
    detailContent: bodyContent,
    applicationScenarios,
    specifications: specs,
    tags,
    packaging: coalescePlain(raw.packaging, raw.packagingSuggestion, raw.packagingType),
    supportOem: Boolean(raw.supportOem ?? raw.supportOEM ?? raw.oem),
    skinType: coalescePlain(raw.skinType, raw.skinTypes, raw.targetSkin, raw.audience),
    ingredients,
    efficacy,
    oemDesc: coalescePlain(raw.oemDesc, raw.customization, raw.odmNote, raw.customNotes),
    isFeatured: Boolean(raw.isFeatured),
  };

  for (const l of EXTRA_LANGS) {
    const cap = l.charAt(0).toUpperCase() + l.slice(1);
    out[`categoryTitle${cap}`] = coalescePlain(catObj?.[`title${cap}`]);
    out[`name_${l}`] = coalescePlain(raw[`name_${l}`]);
    out[`desc_${l}`] = coalescePlain(raw[`description_${l}`], raw[`excerpt_${l}`]);
    out[`detailContent_${l}`] = legacyContentFromPlain(coalescePlain(raw[`bodyPlain_${l}`]));
    out[`applicationScenarios_${l}`] = coalescePlain(raw[`applicationScenarios_${l}`]);
    out[`tags_${l}`] = normalizeTags(raw[`tags_${l}`]);
    out[`packaging_${l}`] = coalescePlain(raw[`packaging_${l}`]);
    out[`skinType_${l}`] = coalescePlain(raw[`skinType_${l}`]);
    out[`efficacy_${l}`] = normalizeEfficacy(raw[`efficacy_${l}`]);
    out[`oemDesc_${l}`] = coalescePlain(raw[`oemDesc_${l}`]);
  }

  return out;
}

function normalizeSpecs(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => ({
      label: coalescePlain(row?.label, row?.name),
      value: coalescePlain(row?.value, row?.text),
      label_en: coalescePlain(row?.label_en),
      label_es: coalescePlain(row?.label_es),
      value_en: coalescePlain(row?.value_en),
      value_es: coalescePlain(row?.value_es),
    }))
    .filter((x) => x.label || x.value);
}

/**
 * @param {Record<string, unknown>} raw
 */
export function mapSanityFaq(raw) {
  const out = {
    id: sanityRefToLegacyId(String(raw._id)),
    sanityId: raw._id,
    q: coalescePlain(raw.question, raw.q, raw.title),
    a: coalescePlain(raw.answer, raw.a, raw.body, typeof raw.content === 'string' ? raw.content : ''),
    showOnHome: Boolean(raw.showOnHome),
  };
  for (const l of EXTRA_LANGS) {
    out[`q_${l}`] = coalescePlain(raw[`question_${l}`]);
    out[`a_${l}`] = coalescePlain(raw[`answer_${l}`]);
  }
  return out;
}

function mapArticleFaqs(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item) => {
      const out = {
        q: coalescePlain(item?.question, item?.q, item?.title),
        a: coalescePlain(item?.answer, item?.a, item?.body),
      };
      for (const l of EXTRA_LANGS) {
        out[`q_${l}`] = coalescePlain(item?.[`question_${l}`]);
        out[`a_${l}`] = coalescePlain(item?.[`answer_${l}`]);
      }
      return out;
    })
    .filter((x) => x.q || x.a);
}

/**
 * @param {Record<string, unknown>} raw Sanity post
 */
/**
 * @param {Record<string, unknown>} raw
 */
export function mapSanityCaseStudy(raw) {
  const img = coalescePlain(raw.coverUrl, raw.coverImageUrl, raw.img);
  let content = portableTextToLegacyContent(raw.body);
  if (!content.length && raw.excerpt) {
    content = [{ type: 'p', text: String(raw.excerpt) }];
  }
  const tags = normalizeTags(raw.tags);
  return {
    id: sanityRefToLegacyId(String(raw._id)),
    sanityId: raw._id,
    slug: raw.slug || null,
    title: coalescePlain(raw.title),
    excerpt: coalescePlain(raw.excerpt),
    industry: coalescePlain(raw.industry),
    tags,
    img,
    galleryUrls: Array.isArray(raw.galleryUrls) ? raw.galleryUrls.filter(Boolean) : [],
    content,
    isFeatured: Boolean(raw.isFeatured),
  };
}

/**
 * @param {Record<string, unknown>} raw
 */
export function mapSanitySimplePage(raw) {
  let content = portableTextToLegacyContent(raw.body);
  if (!content.length && raw.excerpt) {
    content = [{ type: 'p', text: String(raw.excerpt) }];
  }
  const b = raw.banner && typeof raw.banner === 'object' ? raw.banner : null;
  return {
    id: sanityRefToLegacyId(String(raw._id)),
    sanityId: raw._id,
    slug: raw.slug || null,
    title: coalescePlain(raw.title),
    excerpt: coalescePlain(raw.excerpt),
    content,
    banner: b
      ? {
          title: coalescePlain(b.title),
          subtitle: coalescePlain(b.subtitle),
          bgUrl: coalescePlain(raw.bannerBgUrl, b.backgroundImage?.asset?.url),
        }
      : null,
    seoTitle: coalescePlain(raw.seo?.seoTitle, raw.seoTitle),
    seoDescription: coalescePlain(raw.seo?.seoDescription, raw.seoDescription),
  };
}

export function mapSanityPost(raw) {
  const published = raw.publishedAt || raw.date;
  let dateStr = '';
  if (typeof published === 'string') {
    dateStr = published.includes('T') ? published.slice(0, 10) : published.slice(0, 10);
  } else if (published instanceof Date) {
    dateStr = published.toISOString().slice(0, 10);
  }

  const img = coalescePlain(raw.coverUrl, raw.mainImageUrl, raw.img, raw.imageUrl);
  const summary = coalescePlain(raw.summary, raw.excerpt, raw.blurb);
  let content = portableTextToLegacyContent(raw.body);
  if (!content.length && raw.plainBody && typeof raw.plainBody === 'string') {
    content = [{ type: 'p', text: raw.plainBody }];
  }
  if (!content.length && summary) {
    content = [{ type: 'p', text: summary }];
  }

  const category = coalescePlain(
    raw.categoryTitle,
    typeof raw.category === 'string' ? raw.category : raw.category?.title,
    raw.category?.name,
    '资讯',
  );

  const faqs = mapArticleFaqs(raw.articleFaqs || raw.faqs || raw.relatedFaqs);

  const postOut = {
    id: sanityRefToLegacyId(String(raw._id)),
    sanityId: raw._id,
    slug: raw.slug || null,
    category,
    title: coalescePlain(raw.title, raw.headline),
    date: dateStr || new Date().toISOString().slice(0, 10),
    readTime: coalescePlain(raw.readTime, raw.readingTime, '5 min') || '5 min',
    views: coalescePlain(raw.views, raw.viewCount, '—'),
    img,
    summary: summary || (content[0]?.text ?? ''),
    content,
    faqs,
  };
  for (const l of [...EXTRA_LANGS, 'zh']) {
    postOut[`category_${l}`] = coalescePlain(raw[`category_${l}`]);
    postOut[`title_${l}`] = coalescePlain(raw[`title_${l}`]);
    postOut[`summary_${l}`] = coalescePlain(raw[`summary_${l}`]);
  }
  return postOut;
}

/**
 * @param {Record<string, unknown>[]} docs productCategory[]
 */
export function productCategoryDocsToLabels(docs) {
  if (!Array.isArray(docs)) return [];
  return docs
    .map((d) => coalescePlain(d.title, d.name, d.label))
    .filter(Boolean);
}

const TAB_ALL = '全部';

/**
 * 产品筛选 Tab：canonical 始终为中文「名称」（与 product.category 一致，用于筛选）。
 * titleEn / titleEs 来自 productCategory 文档；站点设置里手写的字符串列表无多语言字段时各语种显示同一条文案。
 * @param {Record<string, unknown>|null} settings
 * @param {Record<string, unknown>[]|null} rawPcatDocs
 * @returns {{ canonical: string, titleEn?: string, titleEs?: string }[]}
 */
export function buildProductCategoryTabs(settings, rawPcatDocs) {
  const fromSettings = settings?.productCategories ?? settings?.productCategoriesLabels;
  if (Array.isArray(fromSettings) && fromSettings.length) {
    const labels = fromSettings
      .map((x) => (typeof x === 'string' ? x : x?.title || x?.name || ''))
      .filter(Boolean)
      .filter((x) => x !== TAB_ALL);
    return [{ canonical: TAB_ALL }, ...labels.map((s) => ({ canonical: s }))];
  }
  const docs = Array.isArray(rawPcatDocs) ? rawPcatDocs : [];
  const rows = docs
    .map((d) => {
      const canonical = coalescePlain(d.title, d.name, d.label);
      if (!canonical || canonical === TAB_ALL) return null;
      const tab = { canonical };
      for (const l of EXTRA_LANGS) {
        tab[`title${l.charAt(0).toUpperCase()}${l.slice(1)}`] = coalescePlain(d[`title${l.charAt(0).toUpperCase()}${l.slice(1)}`]);
      }
      return tab;
    })
    .filter(Boolean);
  return [{ canonical: TAB_ALL }, ...rows];
}

/**
 * @param {Record<string, unknown>|null} settings
 * @param {{ category: string }[]} articles 已映射文章
 */
export function buildArticleCategoryTabs(settings, articles) {
  const fromSettings = settings?.articleCategories ?? settings?.articleCategoriesLabels;
  if (Array.isArray(fromSettings) && fromSettings.length) {
    const labels = fromSettings
      .map((x) => (typeof x === 'string' ? x : x?.title || x?.name || ''))
      .filter(Boolean)
      .filter((x) => x !== TAB_ALL);
    return [{ canonical: TAB_ALL }, ...labels.map((s) => ({ canonical: s }))];
  }
  const seen = new Set();
  const rows = [];
  for (const a of articles) {
    const cat = a.category;
    if (!cat || cat === TAB_ALL || seen.has(cat)) continue;
    seen.add(cat);
    const tab = { canonical: cat };
    for (const l of [...EXTRA_LANGS, 'zh']) {
      tab[`title${l.charAt(0).toUpperCase()}${l.slice(1)}`] = a[`category_${l}`] || '';
    }
    rows.push(tab);
  }
  rows.sort((a, b) => a.canonical.localeCompare(b.canonical));
  return [{ canonical: TAB_ALL }, ...rows];
}

/**
 * 首页可选用站点配置（缺省时页面沿用原硬编码）
 * @param {Record<string, unknown>|null} raw
 */
export function mapSiteSettingsForHome(raw) {
  if (!raw) return null;
  const heroTitle =
    typeof raw.heroTitle === 'string' && raw.heroTitle.trim()
      ? raw.heroTitle
      : coalescePlain(raw.title, raw.siteTitle) || '';
  const heroSubtitle =
    typeof raw.heroSubtitle === 'string' && raw.heroSubtitle.trim()
      ? raw.heroSubtitle
      : coalescePlain(raw.tagline, raw.description) || '';

  return {
    ...raw,
    heroTitle: heroTitle || null,
    heroSubtitle: heroSubtitle || null,
    heroImageUrl: coalescePlain(
      raw.heroImageUrl,
      raw.homeHeroImage?.asset?.url,
      raw.heroImage?.asset?.url,
    ),
    trustBadge: coalescePlain(raw.trustBadge, raw.certificationBadge) || null,
    /** 联系与品牌（供组件读取；无则页面内硬编码兜底） */
    contactPhone: coalescePlain(raw.contactPhone),
    contactWhatsapp: coalescePlain(raw.contactWhatsapp),
    contactEmail: coalescePlain(raw.contactEmail),
    address: coalescePlain(raw.address),
    footerCopyright: coalescePlain(raw.footerCopyright),
    footerTagline: coalescePlain(raw.footerTagline),
    footerNote: coalescePlain(raw.footerNote),
    socialLinks: Array.isArray(raw.socialLinks) ? raw.socialLinks : [],
    logoUrl: coalescePlain(raw.logoUrl),
    seoTitleResolved: coalescePlain(raw.seoTitleResolved, raw.defaultSeo?.seoTitle),
    seoDescriptionResolved: coalescePlain(raw.seoDescriptionResolved, raw.defaultSeo?.seoDescription),
  };
}

/**
 * 首页单例 homePage 覆盖 siteSettings 中与首屏重叠的字段
 * @param {Record<string, unknown>|null} mappedBase mapSiteSettingsForHome 的结果
 * @param {Record<string, unknown>|null} homeRaw homePage GROQ 原始
 */
export function mergeHomePageIntoSiteSettings(mappedBase, homeRaw) {
  if (!homeRaw) return mappedBase;
  const m = mappedBase ? { ...mappedBase } : {};
  const hero = homeRaw.hero && typeof homeRaw.hero === 'object' ? homeRaw.hero : null;

  const hi = coalescePlain(
    hero?.backgroundImageUrl,
    homeRaw.heroImageUrl,
    homeRaw.heroImage?.asset?.url,
  );
  if (hi) m.heroImageUrl = hi;

  if (hero?.title) {
    m.heroTitle = String(hero.title).trim();
  } else if (typeof homeRaw.heroTitle === 'string' && homeRaw.heroTitle.trim()) {
    m.heroTitle = homeRaw.heroTitle.trim();
  }
  if (hero?.subtitle) {
    m.heroSubtitle = String(hero.subtitle).trim();
  } else if (typeof homeRaw.heroSubtitle === 'string' && homeRaw.heroSubtitle.trim()) {
    m.heroSubtitle = homeRaw.heroSubtitle.trim();
  }
  if (hero?.trustBadge) {
    m.trustBadge = String(hero.trustBadge).trim();
  } else if (typeof homeRaw.trustBadge === 'string' && homeRaw.trustBadge.trim()) {
    m.trustBadge = homeRaw.trustBadge.trim();
  }
  if (hero?.backgroundVideoUrl) {
    m.heroBackgroundVideoUrl = hero.backgroundVideoUrl;
  }
  if (hero?.primaryCtaLabel) {
    m.heroPrimaryCta = { label: hero.primaryCtaLabel, href: hero.primaryCtaUrl || '#' };
  }
  if (hero?.secondaryCtaLabel) {
    m.heroSecondaryCta = { label: hero.secondaryCtaLabel, href: hero.secondaryCtaUrl || '#' };
  }

  const homeFeaturedProducts = Array.isArray(homeRaw.featuredProducts)
    ? homeRaw.featuredProducts.map(mapSanityProduct)
    : [];
  const homeFeaturedCaseStudies = Array.isArray(homeRaw.featuredCaseStudies)
    ? homeRaw.featuredCaseStudies.map(mapSanityCaseStudy)
    : [];
  const homeFeaturedFaqs = Array.isArray(homeRaw.featuredFaqs)
    ? homeRaw.featuredFaqs.map(mapSanityFaq)
    : [];

  m.homeFeaturedProducts = homeFeaturedProducts;
  m.homeFeaturedCaseStudies = homeFeaturedCaseStudies;
  m.homeFeaturedFaqs = homeFeaturedFaqs;
  m.faqSectionTitle = homeRaw.faqSectionTitle || null;
  m.homeCtaSection = homeRaw.ctaSection || null;
  m.homeSeoOgImageUrl = coalescePlain(homeRaw.seoOgImageUrl, homeRaw.seo?.ogImage?.asset?.url);

  return m;
}

/** 国内部分网络环境无法加载 Unsplash；默认图改为 dummyimage + Sanity 上传 */
const DUMMY = (w, h, t) =>
  `https://dummyimage.com/${w}x${h}/e5e7eb/374151.png&text=${encodeURIComponent(t)}`;

/**
 * /about 品牌探索页：与历史 App.jsx 硬编码一致的默认数据（无 aboutPage 文档时使用）
 */
export function getDefaultAboutPage() {
  return {
    heroEyebrow: 'About YOZO',
    heroTitle: '从卓越制造，\n到伟大的品牌孵化器。',
    heroSubtitle:
      '汕头市贞丽芙生物科技有限公司。我们不仅是隐于幕后的顶级代工执行者，更是多个知名美妆品牌背后的商业起盘者与核心科研大脑。',
    labImageUrl: DUMMY(2000, 1125, 'YOZO Lab'),
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
        id: 'yozo',
        name: 'YOZO',
        subtitle: '院线级高端抗衰标杆',
        desc: '专研前沿生物科技与抗老成分的先锋品牌。将实验室级别的精纯抗衰分子转化为看得见的卓效年轻体验。',
        img: DUMMY(800, 600, 'YOZO'),
      },
      {
        id: 'yozo-all',
        name: 'YOZO ALL IN ONE',
        subtitle: '极简多效精简护肤',
        desc: '为现代快节奏都市人群打造。倡导以一抵多的极简护肤哲学，在精简步骤的同时不妥协深层修护功效。',
        img: DUMMY(800, 600, 'AIO'),
      },
      {
        id: 'ohines',
        name: 'OHINES',
        subtitle: '敏感肌微生态修护',
        desc: '专注受损屏障修护与敏感肌精研护理。以纯净植物精粹复配神经酰胺，重建肌肤健康微生态网络。',
        img: DUMMY(800, 600, 'OHINES'),
      },
      {
        id: 'vivimiyu',
        name: 'VIVIMIYU',
        subtitle: '新锐东方色彩美学',
        desc: '融合现代色彩工艺与轻养肤理念的彩妆品牌。重新定义亚洲肌肤的底妆质感与高定色彩表达。',
        img: DUMMY(800, 600, 'VIVIMIYU'),
      },
      {
        id: 'janeage',
        name: 'JaneAge',
        subtitle: '熟龄肌分阶抗老专家',
        desc: '针对 35+ 熟龄肌肤痛点量身定制。提供从紧致轮廓到密集抗皱的结构化、全周期抗老解决方案。',
        img: DUMMY(800, 600, 'JaneAge'),
      },
    ],
    portfolioCtaLabel: '探索我们的 OBM 贴牌全案服务',
    portfolioCtaHref: '/services',
    certSectionTitle: '全球化合规准入实力',
    certSectionSubtitle: 'Strict Global Quality Control & Certifications',
    certifications: [
      { icon: 'shield', title: 'ISO 22716', subtitle: '国际化妆品优良制造规范' },
      { icon: 'award', title: 'GMPC Certified', subtitle: '10万级净化无尘车间认证' },
      { icon: 'globe', title: 'FDA Compliant', subtitle: '符合北美市场高标准准入' },
      { icon: 'activity', title: 'SGS Tested', subtitle: '瑞士权威机构理化与安全检测' },
    ],
  };
}

/**
 * Sanity aboutPage → 前台 About 区块
 * @param {Record<string, unknown>|null} raw
 */
export function mapAboutPageFromSanity(raw) {
  const d = getDefaultAboutPage();
  if (!raw) return d;

  const pickImg = (b, i) =>
    coalescePlain(b.imageUrl, b.imageAssetUrl) || d.portfolioBrands[i]?.img || DUMMY(800, 600, 'Brand');

  const portfolioBrands =
    Array.isArray(raw.portfolioBrands) && raw.portfolioBrands.length > 0
      ? raw.portfolioBrands.map((b, i) => ({
          id: coalescePlain(b._key, `brand-${i}`),
          name: coalescePlain(b.name) || '—',
          subtitle: coalescePlain(b.subtitle),
          desc: coalescePlain(b.description),
          img: pickImg(b, i),
        }))
      : d.portfolioBrands;

  const certifications =
    Array.isArray(raw.certifications) && raw.certifications.length > 0
      ? raw.certifications.map((c) => ({
          icon: coalescePlain(c.icon, 'shield'),
          title: coalescePlain(c.title),
          subtitle: coalescePlain(c.subtitle),
        }))
      : d.certifications;

  return {
    heroEyebrow: coalescePlain(raw.heroEyebrow, d.heroEyebrow),
    heroTitle: coalescePlain(raw.heroTitle, d.heroTitle),
    heroSubtitle: coalescePlain(raw.heroSubtitle, d.heroSubtitle),
    labImageUrl: coalescePlain(raw.labImageResolved, raw.labImageUrl, d.labImageUrl),
    labOverlayTitle: coalescePlain(raw.labOverlayTitle, d.labOverlayTitle),
    labOverlaySubtitle: coalescePlain(raw.labOverlaySubtitle, d.labOverlaySubtitle),
    manifestoQuote: coalescePlain(raw.manifestoQuote, d.manifestoQuote),
    manifestoBody: coalescePlain(raw.manifestoBody, d.manifestoBody),
    portfolioEyebrow: coalescePlain(raw.portfolioEyebrow, d.portfolioEyebrow),
    portfolioTitle: coalescePlain(raw.portfolioTitle, d.portfolioTitle),
    portfolioIntro: coalescePlain(raw.portfolioIntro, d.portfolioIntro),
    portfolioBrands,
    portfolioCtaLabel: coalescePlain(raw.portfolioCtaLabel, d.portfolioCtaLabel),
    portfolioCtaHref: coalescePlain(raw.portfolioCtaHref, d.portfolioCtaHref),
    certSectionTitle: coalescePlain(raw.certSectionTitle, d.certSectionTitle),
    certSectionSubtitle: coalescePlain(raw.certSectionSubtitle, d.certSectionSubtitle),
    certifications,
  };
}
