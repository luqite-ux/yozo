/**
 * Generic locale field picker: given a base (Chinese) value and a map of
 * locale-suffixed values, return the best match for the active locale.
 * Falls back to base value.
 */
function pickLocale(locale, base, translations) {
  if (locale === 'zh') return base || '';
  return translations[locale] || base || '';
}
function pickLocaleArr(locale, base, translations) {
  if (locale === 'zh') return base || [];
  const arr = translations[locale];
  return Array.isArray(arr) && arr.length ? arr : (base || []);
}

/**
 * 按 locale 选产品的文本字段，有翻译则用翻译，否则降级到中文原文。
 */
export function localizeProduct(product, locale) {
  if (!product || locale === 'zh') return product;
  const p = (field) => pickLocale(locale, product[field], {
    en: product[`${field}_en`], es: product[`${field}_es`],
    pt: product[`${field}_pt`], ar: product[`${field}_ar`], ru: product[`${field}_ru`],
  });
  const pArr = (field) => pickLocaleArr(locale, product[field], {
    en: product[`${field}_en`], es: product[`${field}_es`],
    pt: product[`${field}_pt`], ar: product[`${field}_ar`], ru: product[`${field}_ru`],
  });
  const pickSpecs = (specs) => {
    if (!Array.isArray(specs) || specs.length === 0) return [];
    return specs.map((r) => ({
      ...r,
      label: pickLocale(locale, r?.label, {
        en: r?.label_en, es: r?.label_es, pt: r?.label_pt, ar: r?.label_ar, ru: r?.label_ru,
      }),
      value: pickLocale(locale, r?.value, {
        en: r?.value_en, es: r?.value_es, pt: r?.value_pt, ar: r?.value_ar, ru: r?.value_ru,
      }),
    }));
  };
  const pickIngredients = (ings) => {
    if (!Array.isArray(ings) || ings.length === 0) return [];
    return ings.map((ing) => ({
      ...ing,
      name: pickLocale(locale, ing?.name, {
        en: ing?.name_en, es: ing?.name_es, pt: ing?.name_pt, ar: ing?.name_ar, ru: ing?.name_ru,
      }),
      desc: pickLocale(locale, ing?.desc, {
        en: ing?.desc_en, es: ing?.desc_es, pt: ing?.desc_pt, ar: ing?.desc_ar, ru: ing?.desc_ru,
      }),
    }));
  };
  return {
    ...product,
    name: p('name'),
    desc: p('desc'),
    packaging: p('packaging'),
    skinType: p('skinType'),
    oemDesc: p('oemDesc'),
    applicationScenarios: p('applicationScenarios'),
    efficacy: pArr('efficacy'),
    tags: pArr('tags'),
    specifications: pickSpecs(product.specifications),
    ingredients: pickIngredients(product.ingredients),
    detailContent: pArr('detailContent'),
  };
}

/**
 * 按 locale 选文章的标题、摘要和分类。支持双向翻译（EN 原文 → ZH，ZH 原文 → EN 等）。
 */
export function localizePost(article, locale) {
  if (!article) return article;
  const faqs = Array.isArray(article.faqs)
    ? article.faqs
        .map((f) => {
          const picked = pickFaqLocale(f, locale);
          return { ...f, q: picked.q, a: picked.a };
        })
        .filter((f) => f.q || f.a)
    : article.faqs;

  const pf = (field) => pickLocale(locale, article[field], {
    zh: article[`${field}_zh`], en: article[`${field}_en`], es: article[`${field}_es`],
    pt: article[`${field}_pt`], ar: article[`${field}_ar`], ru: article[`${field}_ru`],
  });

  return {
    ...article,
    title: pf('title'),
    summary: pf('summary'),
    category: pf('category'),
    faqs,
  };
}

export function pickFaqLocale(faq, locale) {
  const q = pickLocale(locale, faq.q, {
    en: faq.q_en, es: faq.q_es, pt: faq.q_pt, ar: faq.q_ar, ru: faq.q_ru,
  });
  const a = pickLocale(locale, faq.a, {
    en: faq.a_en, es: faq.a_es, pt: faq.a_pt, ar: faq.a_ar, ru: faq.a_ru,
  });
  return { q, a };
}

/** CMS 文案仅在中文界面优先展示；其他语言使用翻译键。 */
export function cmsZhElseT(locale, cmsValue, tKey, t) {
  if (locale === 'zh') {
    const s = typeof cmsValue === 'string' ? cmsValue.trim() : '';
    if (s) return s;
  }
  return t(tKey);
}

/** 与 Sanity buildProductCategoryTabs 首项一致，用于筛选逻辑 */
export const CATEGORY_ALL = '全部';

export function formatCategoryTabLabel(cat, t) {
  return cat === CATEGORY_ALL ? t('common.all') : cat;
}

/** 文章分类 Tab */
export function labelArticleCategoryTab(tab, locale, t) {
  if (!tab?.canonical || tab.canonical === CATEGORY_ALL) return t('common.all');
  const localeKey = `title${locale.charAt(0).toUpperCase()}${locale.slice(1)}`;
  if (tab[localeKey]?.trim()) return tab[localeKey].trim();
  return tab.canonical;
}

/** 产品分类 Tab */
export function labelProductCategoryTab(tab, locale, t) {
  if (!tab?.canonical || tab.canonical === CATEGORY_ALL) return t('common.all');
  const localeKey = `title${locale.charAt(0).toUpperCase()}${locale.slice(1)}`;
  if (tab[localeKey]?.trim()) return tab[localeKey].trim();
  return tab.canonical;
}

/** 产品卡片/详情上的分类文案 */
export function labelProductCategory(product, locale) {
  if (!product) return '';
  const localeKey = `categoryTitle${locale.charAt(0).toUpperCase()}${locale.slice(1)}`;
  if (product[localeKey]?.trim()) return product[localeKey].trim();
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
