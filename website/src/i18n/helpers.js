/**
 * 按 locale 选 FAQ 的问题或答案，有翻译则用翻译，否则降级到中文原文。
 * @param {object} faq  mapSanityFaq 的输出
 * @param {string} locale
 * @returns {{ q: string, a: string }}
 */
/**
 * Sanity 仅有 zh / en / es 三套字段时：pt、ar、ru 等优先英文再西语，最后中文，避免界面落回纯中文。
 */
function trimStr(v) {
  if (v == null) return '';
  return String(v).trim();
}

export function pickCmsI18nString(zh, en, es, locale) {
  const z = trimStr(zh);
  const e = trimStr(en);
  const s = trimStr(es);
  const loc = locale || 'zh';
  if (loc === 'zh') return z || e || s;
  if (loc === 'en') return e || z || s;
  if (loc === 'es') return s || e || z;
  return e || s || z;
}

export function pickCmsI18nArray(zhArr, enArr, esArr, locale) {
  const z = Array.isArray(zhArr) && zhArr.length ? zhArr : null;
  const e = Array.isArray(enArr) && enArr.length ? enArr : null;
  const s = Array.isArray(esArr) && esArr.length ? esArr : null;
  const loc = locale || 'zh';
  if (loc === 'zh') return z || e || s || [];
  if (loc === 'en') return e || z || s || [];
  if (loc === 'es') return s || e || z || [];
  return e || s || z || [];
}

/**
 * 按 locale 选产品的文本字段，有翻译则用翻译，否则降级到中文原文。
 * @param {object} product  mapSanityProduct 的输出
 * @param {string} locale
 */
export function localizeProduct(product, locale) {
  if (!product || locale === 'zh') return product;
  const pick = (zh, en, es) => pickCmsI18nString(zh, en, es, locale);
  const pickArr = (zh, en, es) => pickCmsI18nArray(zh, en, es, locale);
  const pickSpecs = (specs) => {
    if (!Array.isArray(specs) || specs.length === 0) return [];
    return specs.map((r) => ({
      ...r,
      label: pick(r?.label, r?.label_en, r?.label_es),
      value: pick(r?.value, r?.value_en, r?.value_es),
    }));
  };
  return {
    ...product,
    name: pick(product.name, product.name_en, product.name_es),
    desc: pick(product.desc, product.desc_en, product.desc_es),
    packaging: pick(product.packaging, product.packaging_en, product.packaging_es),
    skinType: pick(product.skinType, product.skinType_en, product.skinType_es),
    oemDesc: pick(product.oemDesc, product.oemDesc_en, product.oemDesc_es),
    applicationScenarios: pick(
      product.applicationScenarios,
      product.applicationScenarios_en,
      product.applicationScenarios_es,
    ),
    efficacy: pickArr(product.efficacy, product.efficacy_en, product.efficacy_es),
    tags: pickArr(product.tags, product.tags_en, product.tags_es),
    specifications: pickSpecs(product.specifications),
    detailContent: pickArr(
      product.detailContent,
      product.detailContent_en,
      product.detailContent_es,
    ),
  };
}

/**
 * 按 locale 选文章的标题和摘要。
 * @param {object} article  mapSanityPost 的输出
 * @param {string} locale
 */
export function localizePost(article, locale) {
  if (!article) return article;
  const faqs = Array.isArray(article.faqs)
    ? article.faqs
        .map((f) => {
          const picked = pickFaqLocale(
            {
              q: f.q,
              a: f.a,
              q_en: f.q_en,
              q_es: f.q_es,
              a_en: f.a_en,
              a_es: f.a_es,
            },
            locale,
          );
          return { ...f, q: picked.q, a: picked.a };
        })
        .filter((f) => f.q || f.a)
    : article.faqs;
  const pickArr = (zh, en, es) => pickCmsI18nArray(zh, en, es, locale);
  const categoryDisplay = pickArticleCategoryDisplay(article.category, locale);
  if (locale === 'zh') {
    return { ...article, faqs, categoryDisplay };
  }
  return {
    ...article,
    title: pickCmsI18nString(article.title, article.title_en, article.title_es, locale),
    summary: pickCmsI18nString(article.summary, article.summary_en, article.summary_es, locale),
    content: pickArr(article.content, article.content_en, article.content_es),
    categoryDisplay,
    faqs,
  };
}

export function pickFaqLocale(faq, locale) {
  if (!faq) return { q: '', a: '' };
  const loc = locale || 'zh';
  if (loc === 'zh') {
    return { q: trimStr(faq.q), a: trimStr(faq.a) };
  }
  if (loc === 'en') {
    return { q: trimStr(faq.q_en) || trimStr(faq.q), a: trimStr(faq.a_en) || trimStr(faq.a) };
  }
  if (loc === 'es') {
    return {
      q: trimStr(faq.q_es) || trimStr(faq.q_en) || trimStr(faq.q),
      a: trimStr(faq.a_es) || trimStr(faq.a_en) || trimStr(faq.a),
    };
  }
  return {
    q: trimStr(faq.q_en) || trimStr(faq.q_es) || trimStr(faq.q),
    a: trimStr(faq.a_en) || trimStr(faq.a_es) || trimStr(faq.a),
  };
}

/** CMS 文案仅在中文界面优先展示；英文/西语使用翻译键，避免整站仍显示中文。 */
export function cmsZhElseT(locale, cmsValue, tKey, t) {
  if (locale === 'zh') {
    const s = typeof cmsValue === 'string' ? cmsValue.trim() : '';
    if (s) return s;
  }
  return t(tKey);
}

/** 与 Sanity buildProductCategoryTabs 首项一致，用于筛选逻辑 */
export const CATEGORY_ALL = '全部';

/** CMS 常用英文栏目 slug → 中文界面展示（筛选仍用英文 canonical 与文档一致） */
const ARTICLE_CATEGORY_EN_TO_ZH = {
  'COMPLIANCE AND QUALITY': '合规与质量',
  'BRAND LAUNCH GUIDE': '品牌发布指南',
  'SKINCARE KNOWLEDGE BASE': '护肤知识库',
  'OEM/ODM GUIDE': 'OEM/ODM 指南',
  'INDUSTRY INSIGHTS': '行业洞察',
  'COMPANY NEWS': '公司新闻',
};

const ARTICLE_CATEGORY_EN_TO_ES = {
  'COMPLIANCE AND QUALITY': 'Cumplimiento y calidad',
  'BRAND LAUNCH GUIDE': 'Guía de lanzamiento de marca',
  'SKINCARE KNOWLEDGE BASE': 'Base de conocimiento de cuidado de la piel',
  'OEM/ODM GUIDE': 'Guía OEM/ODM',
  'INDUSTRY INSIGHTS': 'Perspectivas del sector',
  'COMPANY NEWS': 'Noticias de la empresa',
};

/**
 * 资讯栏目：界面展示文案（zh/es 下将常见英文 canonical 映射为本地化）
 * @param {string} category mapSanityPost 的 category（与筛选一致）
 * @param {'zh'|'en'|'es'|'pt'|'ar'|'ru'} locale
 */
export function pickArticleCategoryDisplay(category, locale) {
  const c = String(category || '').trim();
  if (!c) return '';
  const key = c.toUpperCase();
  if (locale === 'zh') return ARTICLE_CATEGORY_EN_TO_ZH[key] || c;
  if (locale === 'es') return ARTICLE_CATEGORY_EN_TO_ES[key] || c;
  return c;
}

/**
 * 阅读时长：避免中文站出现「5 min 阅读」混排
 * @param {string} raw Sanity readTime，如 "5 min"
 */
export function formatArticleReadTime(raw, locale, t) {
  const s = String(raw ?? '').trim();
  const m = s.match(/^(\d+)\s*min(?:utes?)?$/i);
  if (m) {
    const n = m[1];
    const tpl = t('news.readTimeMinutes');
    if (typeof tpl === 'string' && tpl.includes('{{n}}')) return tpl.replace(/\{\{n\}\}/g, n);
    if (locale === 'zh') return `约 ${n} 分钟阅读`;
    if (locale === 'es') return `${n} min de lectura`;
    return `${n} min read`;
  }
  if (locale === 'zh' && /\d/.test(s)) {
    return s
      .replace(/\s*min(?:utes?)?/gi, ' 分钟')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return s ? `${s} ${t('common.readTimeSuffix')}`.trim() : '';
}

export function formatCategoryTabLabel(cat, t) {
  return cat === CATEGORY_ALL ? t('common.all') : cat;
}

/** 资讯筛选 Tab（canonical 与文章 category 字段一致） */
export function labelArticleCategoryTab(tab, locale, t) {
  if (!tab?.canonical || tab.canonical === CATEGORY_ALL) return t('common.all');
  if (locale === 'en' && tab.titleEn?.trim()) return tab.titleEn.trim();
  if (locale === 'es' && tab.titleEs?.trim()) return tab.titleEs.trim();
  return pickArticleCategoryDisplay(tab.canonical, locale);
}

/** 产品分类 Tab（canonical + 可选 titleEn/titleEs） */
export function labelProductCategoryTab(tab, locale, t) {
  if (!tab?.canonical || tab.canonical === CATEGORY_ALL) return t('common.all');
  if (locale === 'en' && tab.titleEn?.trim()) return tab.titleEn.trim();
  if (locale === 'es' && tab.titleEs?.trim()) return tab.titleEs.trim();
  if (locale !== 'zh' && locale !== 'en' && locale !== 'es') {
    if (tab.titleEn?.trim()) return tab.titleEn.trim();
    if (tab.titleEs?.trim()) return tab.titleEs.trim();
  }
  return tab.canonical;
}

/** 产品卡片/详情上的分类文案 */
export function labelProductCategory(product, locale) {
  if (!product) return '';
  if (locale === 'en' && product.categoryTitleEn?.trim()) return product.categoryTitleEn.trim();
  if (locale === 'es' && product.categoryTitleEs?.trim()) return product.categoryTitleEs.trim();
  if (locale !== 'zh' && locale !== 'en' && locale !== 'es') {
    if (product.categoryTitleEn?.trim()) return product.categoryTitleEn.trim();
    if (product.categoryTitleEs?.trim()) return product.categoryTitleEs.trim();
  }
  return product.category || '';
}

function normalizeInternalPath(href) {
  const s = String(href || '').trim();
  if (!s || /^https?:\/\//i.test(s)) return null;
  const path = (s.startsWith('/') ? s : `/${s}`).split('?')[0].replace(/\/+$/, '') || '/';
  return path;
}

const PATH_NAV_KEYS = [
  ['/', 'home'],
  ['/about', 'about'],
  ['/services', 'services'],
  ['/products', 'products'],
  ['/news', 'news'],
  ['/faq', 'faq'],
  ['/contact', 'contact'],
];

/** 站内路径映射到 nav.*；未知路径保留 CMS 原 label */
export function navLabelForItem(item, t) {
  if (item.external) return item.label;
  const p = normalizeInternalPath(item.path);
  if (!p) return item.label;
  for (const [prefix, key] of PATH_NAV_KEYS) {
    if (prefix === '/' && p === '/') return t(`nav.${key}`);
    if (prefix !== '/' && (p === prefix || p.startsWith(`${prefix}/`))) return t(`nav.${key}`);
  }
  return item.label;
}
