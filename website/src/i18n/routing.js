/** @typedef {'zh'|'en'|'es'|'pt'|'ar'|'ru'} AppLocale */

const LOCALE_PREFIXES = ['en', 'es', 'pt', 'ar', 'ru'];

export function normalizeAppLocale(input) {
  const raw = String(input || '').trim().toLowerCase();
  for (const prefix of LOCALE_PREFIXES) {
    if (raw.startsWith(prefix)) return /** @type {AppLocale} */ (prefix);
  }
  return /** @type {AppLocale} */ ('zh');
}

/**
 * 从完整 URL path 解析语言前缀与「站内裸路径」（不含 /en、/es 等）。
 * 中文默认无前缀：/products → zh + /products
 */
export function splitLocalePrefix(pathname) {
  const p = pathname && pathname !== '' ? pathname : '/';
  for (const prefix of LOCALE_PREFIXES) {
    if (p === `/${prefix}` || p.startsWith(`/${prefix}/`)) {
      return {
        locale: /** @type {AppLocale} */ (prefix),
        pathname: p === `/${prefix}` ? '/' : p.slice(prefix.length + 1) || '/',
      };
    }
  }
  return { locale: /** @type {AppLocale} */ ('zh'), pathname: p };
}

/**
 * 裸路径（如 /about）→ 当前语言下的完整 path
 */
export function bareToLocalized(barePath, locale) {
  const bp = !barePath || barePath === '/' ? '/' : barePath.startsWith('/') ? barePath : `/${barePath}`;
  if (locale === 'zh') return bp;
  const rest = bp === '/' ? '' : bp;
  return `/${locale}${rest}`;
}

/**
 * 当前完整 URL（可能含 /en）切换到另一语言后的 path + search
 */
export function pathForLocaleFromFullPath(fullPathname, search, targetLocale) {
  const { pathname: bare } = splitLocalePrefix(fullPathname);
  const qs = search || '';
  return bareToLocalized(bare, targetLocale) + qs;
}

/**
 * 供服务端/客户端 SEO：裸路径 → 各语言 pathname
 */
export function alternatePathsForBare(barePathname) {
  const bare = !barePathname || barePathname === '' ? '/' : barePathname.startsWith('/') ? barePathname : `/${barePathname}`;
  const result = { zh: bare };
  for (const prefix of LOCALE_PREFIXES) {
    result[prefix] = bareToLocalized(bare, prefix);
  }
  return result;
}
