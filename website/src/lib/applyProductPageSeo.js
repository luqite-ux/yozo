/**
 * 产品详情页：写入 document.title、meta description、Open Graph（与 hreflang 由 App 内 SeoAlternateLinks 配合）。
 */

const META_IDS = {
  desc: 'yo-product-meta-desc',
  ogTitle: 'yo-product-meta-og-title',
  ogDesc: 'yo-product-meta-og-desc',
  ogImage: 'yo-product-meta-og-image',
  ogUrl: 'yo-product-meta-og-url',
  ogLocale: 'yo-product-meta-og-locale',
  twCard: 'yo-product-meta-tw-card',
  jsonLd: 'yo-product-jsonld',
};

const OG_LOCALE = {
  zh: 'zh_CN',
  en: 'en_US',
  es: 'es_ES',
  pt: 'pt_BR',
  ar: 'ar_SA',
  ru: 'ru_RU',
};

function truncateMeta(s, max = 160) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function ensureMetaTag(id, setAttrs) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('meta');
    el.id = id;
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(setAttrs)) {
    if (v == null || v === '') continue;
    el.setAttribute(k, String(v));
  }
}

function ensureJsonLd(id, json) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(json);
}

/**
 * @param {{
 *   title: string,
 *   description: string,
 *   locale: string,
 *   canonicalUrl: string,
 *   imageUrl?: string,
 *   productName: string,
 * }} opts
 */
export function applyProductPageSeo(opts) {
  if (typeof document === 'undefined') return;
  const {
    title,
    description,
    locale,
    canonicalUrl,
    imageUrl = '',
    productName,
  } = opts;

  document.title = truncateMeta(title, 70);

  const desc = truncateMeta(description, 160);
  ensureMetaTag(META_IDS.desc, { name: 'description', content: desc });

  ensureMetaTag(META_IDS.ogTitle, { property: 'og:title', content: truncateMeta(title, 70) });
  ensureMetaTag(META_IDS.ogDesc, { property: 'og:description', content: desc });
  if (imageUrl) {
    ensureMetaTag(META_IDS.ogImage, { property: 'og:image', content: imageUrl });
  }
  if (canonicalUrl) {
    ensureMetaTag(META_IDS.ogUrl, { property: 'og:url', content: canonicalUrl });
  }
  const ol = OG_LOCALE[locale] || OG_LOCALE.en;
  ensureMetaTag(META_IDS.ogLocale, { property: 'og:locale', content: ol });
  ensureMetaTag(META_IDS.twCard, { name: 'twitter:card', content: imageUrl ? 'summary_large_image' : 'summary' });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    description: desc,
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(canonicalUrl ? { url: canonicalUrl } : {}),
  };
  ensureJsonLd(META_IDS.jsonLd, jsonLd);
}

export function clearProductPageSeo() {
  if (typeof document === 'undefined') return;
  for (const id of Object.values(META_IDS)) {
    document.getElementById(id)?.remove();
  }
}
