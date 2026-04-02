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

function normalizeIngredients(list) {
  if (!Array.isArray(list) || !list.length) return [];
  return list.map((ing) => ({
    name: coalescePlain(ing?.name, ing?.title, ing?.ingredient),
    desc: coalescePlain(ing?.desc, ing?.description, ing?.text, ing?.detail),
  }));
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

  return {
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
}

function normalizeSpecs(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => ({
      label: coalescePlain(row?.label, row?.name),
      value: coalescePlain(row?.value, row?.text),
    }))
    .filter((x) => x.label || x.value);
}

/**
 * @param {Record<string, unknown>} raw
 */
export function mapSanityFaq(raw) {
  return {
    id: sanityRefToLegacyId(String(raw._id)),
    sanityId: raw._id,
    q: coalescePlain(raw.question, raw.q, raw.title),
    a: coalescePlain(
      raw.answer,
      raw.a,
      raw.body,
      typeof raw.content === 'string' ? raw.content : '',
    ),
    showOnHome: Boolean(raw.showOnHome),
  };
}

function mapArticleFaqs(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item) => ({
      q: coalescePlain(item?.question, item?.q, item?.title),
      a: coalescePlain(item?.answer, item?.a, item?.body),
    }))
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

  return {
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

/**
 * @param {Record<string, unknown>|null} settings
 * @param {string[]} fromDocs
 */
export function buildProductCategoryTabs(settings, fromDocs) {
  const fromSettings = settings?.productCategories ?? settings?.productCategoriesLabels;
  if (Array.isArray(fromSettings) && fromSettings.length) {
    const labels = fromSettings
      .map((x) => (typeof x === 'string' ? x : x?.title || x?.name || ''))
      .filter(Boolean)
      .filter((x) => x !== '全部');
    return ['全部', ...labels];
  }
  const rest = fromDocs.filter((x) => x !== '全部');
  return ['全部', ...rest];
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
      .filter((x) => x !== '全部');
    return ['全部', ...labels];
  }
  const unique = [...new Set(articles.map((a) => a.category).filter(Boolean))];
  unique.sort();
  return ['全部', ...unique];
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
