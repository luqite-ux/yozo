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

/** 粗略检测汉字；避免非中文界面落回 Sanity 仅存中文的主文案字段 */
function hasHanScript(s) {
  const str = String(s || '');
  if (!str) return false;
  try {
    return /\p{Script=Han}/u.test(str);
  } catch {
    return /[\u3400-\u9fff\uf900-\ufaff]/.test(str);
  }
}

/**
 * 首页数据卡 label：非 zh 时只接受 label_*（或拉丁/阿语等非汉字文案），不使用仅含汉字的 `label`。
 * @param {Record<string, unknown>|null} row Sanity stats 单行
 */
export function pickHomeStatLabel(row, locale, fallbackLabel) {
  const fb = trimStr(fallbackLabel);
  if (!row || typeof row !== 'object') return fb;
  const loc = locale || 'zh';
  if (loc === 'zh') return trimStr(row.label) || fb;

  const en = trimStr(row.label_en);
  const es = trimStr(row.label_es);
  const pt = trimStr(row.label_pt);
  const ar = trimStr(row.label_ar);
  const ru = trimStr(row.label_ru);

  let cand = '';
  if (loc === 'pt') cand = pt || en || es;
  else if (loc === 'ar') cand = ar || en || es;
  else if (loc === 'ru') cand = ru || en || es;
  else if (loc === 'es') cand = es || en;
  else if (loc === 'en') cand = en || es;
  else cand = en || es;

  if (cand && !hasHanScript(cand)) return cand;
  const baseLatin = trimStr(row.label);
  if (baseLatin && !hasHanScript(baseLatin)) return baseLatin;
  return fb;
}

/** 首页数据卡数字：常用「Nw」万的简写在非中文下转为「Nk+」（如 20w → 200k+）。 */
export function localizeStatValueDisplay(raw, locale) {
  const s = trimStr(raw);
  if (!s || locale === 'zh') return s;
  const m = /^(\d+(?:\.\d+)?)w$/i.exec(s);
  if (!m) return s;
  const wan = Number(m[1]);
  const kUnits = wan * 10;
  if (!Number.isFinite(kUnits)) return s;
  const rounded =
    Math.abs(kUnits - Math.round(kUnits)) < 1e-6 ? Math.round(kUnits) : Number(kUnits.toFixed(1));
  return `${rounded}k+`;
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
 * 案例：按 locale 选择 title/excerpt/content（Sanity 仅提供 zh/en/es 字段时其余语种回退到 en/es）
 * @param {object} study mapSanityCaseStudy 输出
 * @param {string} locale
 */
export function localizeCaseStudy(study, locale) {
  if (!study) return study;
  if (locale === 'zh') return study;
  return {
    ...study,
    title: pickCmsI18nString(study.title, study.title_en, study.title_es, locale),
    excerpt: pickCmsI18nString(study.excerpt, study.excerpt_en, study.excerpt_es, locale),
    content: pickCmsI18nArray(study.content, study.content_en, study.content_es, locale),
  };
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
  const pickTextByLocale = (zh, en, es, pt, ar, ru) =>
    (locale === 'pt' && trimStr(pt)) ||
    (locale === 'ar' && trimStr(ar)) ||
    (locale === 'ru' && trimStr(ru)) ||
    pick(zh, en, es);
  const pickArrayByLocale = (zh, en, es, pt, ar, ru) => {
    if (locale === 'pt' && Array.isArray(pt) && pt.length) return pt;
    if (locale === 'ar' && Array.isArray(ar) && ar.length) return ar;
    if (locale === 'ru' && Array.isArray(ru) && ru.length) return ru;
    return pickArr(zh, en, es);
  };
  const pickSpecs = (specs) => {
    if (!Array.isArray(specs) || specs.length === 0) return [];
    return specs.map((r) => ({
      ...r,
      label: pickTextByLocale(r?.label, r?.label_en, r?.label_es, r?.label_pt, r?.label_ar, r?.label_ru),
      value: pickTextByLocale(r?.value, r?.value_en, r?.value_es, r?.value_pt, r?.value_ar, r?.value_ru),
    }));
  };
  return {
    ...product,
    name: pickTextByLocale(product.name, product.name_en, product.name_es, product.name_pt, product.name_ar, product.name_ru),
    desc: pickTextByLocale(product.desc, product.desc_en, product.desc_es, product.desc_pt, product.desc_ar, product.desc_ru),
    packaging: pickTextByLocale(product.packaging, product.packaging_en, product.packaging_es, product.packaging_pt, product.packaging_ar, product.packaging_ru),
    skinType: pickTextByLocale(product.skinType, product.skinType_en, product.skinType_es, product.skinType_pt, product.skinType_ar, product.skinType_ru),
    oemDesc: pickTextByLocale(product.oemDesc, product.oemDesc_en, product.oemDesc_es, product.oemDesc_pt, product.oemDesc_ar, product.oemDesc_ru),
    applicationScenarios: pickTextByLocale(
      product.applicationScenarios,
      product.applicationScenarios_en,
      product.applicationScenarios_es,
      product.applicationScenarios_pt,
      product.applicationScenarios_ar,
      product.applicationScenarios_ru,
    ),
    efficacy: pickArrayByLocale(product.efficacy, product.efficacy_en, product.efficacy_es, product.efficacy_pt, product.efficacy_ar, product.efficacy_ru),
    tags: pickArrayByLocale(product.tags, product.tags_en, product.tags_es, product.tags_pt, product.tags_ar, product.tags_ru),
    specifications: pickSpecs(product.specifications),
    detailContent: pickArrayByLocale(
      product.detailContent,
      product.detailContent_en,
      product.detailContent_es,
      product.detailContent_pt,
      product.detailContent_ar,
      product.detailContent_ru,
    ),
    ingredients: Array.isArray(product.ingredients)
      ? product.ingredients.map((ing) => ({
          ...ing,
          name:
            (locale === 'pt' && trimStr(ing?.name_pt)) ||
            (locale === 'ar' && trimStr(ing?.name_ar)) ||
            (locale === 'ru' && trimStr(ing?.name_ru)) ||
            pickCmsI18nString(ing?.name, ing?.name_en, ing?.name_es, locale),
          desc:
            (locale === 'pt' && trimStr(ing?.desc_pt)) ||
            (locale === 'ar' && trimStr(ing?.desc_ar)) ||
            (locale === 'ru' && trimStr(ing?.desc_ru)) ||
            pickCmsI18nString(ing?.desc, ing?.desc_en, ing?.desc_es, locale),
        }))
      : product.ingredients,
  };
}

/**
 * 按 locale 选文章的标题和摘要。
 * @param {object} article  mapSanityPost 的输出
 * @param {string} locale
 */
export function localizePost(article, locale) {
  if (!article) return article;
  const pick = (zh, en, es) => pickCmsI18nString(zh, en, es, locale);
  const pickTextByLocale = (zh, en, es, pt, ar, ru) =>
    (locale === 'pt' && trimStr(pt)) ||
    (locale === 'ar' && trimStr(ar)) ||
    (locale === 'ru' && trimStr(ru)) ||
    pick(zh, en, es);
  const faqs = Array.isArray(article.faqs)
    ? article.faqs
        .map((f) => {
          const picked = pickFaqLocale(
            {
              q: f.q,
              a: f.a,
              q_en: f.q_en,
              q_es: f.q_es,
              q_pt: f.q_pt,
              q_ar: f.q_ar,
              q_ru: f.q_ru,
              a_en: f.a_en,
              a_es: f.a_es,
              a_pt: f.a_pt,
              a_ar: f.a_ar,
              a_ru: f.a_ru,
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
    title: pickTextByLocale(
      article.title,
      article.title_en,
      article.title_es,
      article.title_pt,
      article.title_ar,
      article.title_ru,
    ),
    summary: pickTextByLocale(
      article.summary,
      article.summary_en,
      article.summary_es,
      article.summary_pt,
      article.summary_ar,
      article.summary_ru,
    ),
    content:
      (locale === 'pt' && Array.isArray(article.content_pt) && article.content_pt.length && article.content_pt) ||
      (locale === 'ar' && Array.isArray(article.content_ar) && article.content_ar.length && article.content_ar) ||
      (locale === 'ru' && Array.isArray(article.content_ru) && article.content_ru.length && article.content_ru) ||
      pickArr(article.content, article.content_en, article.content_es),
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
  const pickQ = () =>
    (loc === 'pt' && trimStr(faq.q_pt)) ||
    (loc === 'ar' && trimStr(faq.q_ar)) ||
    (loc === 'ru' && trimStr(faq.q_ru)) ||
    trimStr(faq.q_en) ||
    trimStr(faq.q_es) ||
    trimStr(faq.q);
  const pickA = () =>
    (loc === 'pt' && trimStr(faq.a_pt)) ||
    (loc === 'ar' && trimStr(faq.a_ar)) ||
    (loc === 'ru' && trimStr(faq.a_ru)) ||
    trimStr(faq.a_en) ||
    trimStr(faq.a_es) ||
    trimStr(faq.a);
  if (loc === 'pt' || loc === 'ar' || loc === 'ru') {
    return { q: pickQ(), a: pickA() };
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
