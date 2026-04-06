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

export function formatCategoryTabLabel(cat, t) {
  return cat === CATEGORY_ALL ? t('common.all') : cat;
}

/** 产品分类 Tab（canonical + 可选 titleEn/titleEs） */
export function labelProductCategoryTab(tab, locale, t) {
  if (!tab?.canonical || tab.canonical === CATEGORY_ALL) return t('common.all');
  if (locale === 'en' && tab.titleEn?.trim()) return tab.titleEn.trim();
  if (locale === 'es' && tab.titleEs?.trim()) return tab.titleEs.trim();
  return tab.canonical;
}

/** 产品卡片/详情上的分类文案 */
export function labelProductCategory(product, locale) {
  if (!product) return '';
  if (locale === 'en' && product.categoryTitleEn?.trim()) return product.categoryTitleEn.trim();
  if (locale === 'es' && product.categoryTitleEs?.trim()) return product.categoryTitleEs.trim();
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
