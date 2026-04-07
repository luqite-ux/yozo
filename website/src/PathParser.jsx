import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { CmsProvider } from './cms/CmsContext.jsx';
import App from './App.jsx';
import { LocaleProvider } from './i18n/LocaleContext.jsx';
import { splitLocalePrefix } from './i18n/routing.js';

function readHydrationPayload() {
  if (typeof window === 'undefined') return undefined;
  const p = window.__CMS_INITIAL__;
  if (p) {
    try {
      delete window.__CMS_INITIAL__;
    } catch {
      window.__CMS_INITIAL__ = undefined;
    }
  }
  return p;
}

/**
 * 根据真实 URL 解析 /en /es 前缀，向内层 Routes 注入「裸路径」location。
 * @param {{ initialCms?: object }} props
 */
export default function PathParser({ initialCms }) {
  const loc = useLocation();
  const { locale, pathname: bare } = splitLocalePrefix(loc.pathname);

  const routesLocation = useMemo(
    () => ({
      pathname: bare,
      search: loc.search,
      hash: loc.hash,
      state: loc.state,
      key: loc.key,
    }),
    [bare, loc.search, loc.hash, loc.state, loc.key],
  );

  /** null = SSR 已尝试但失败；undefined = 走浏览器 hydration / 纯 CSR */
  const cmsSeed = initialCms !== undefined ? initialCms : readHydrationPayload();

  return (
    <LocaleProvider routeLocale={locale} barePathname={bare}>
      <CmsProvider initialPayload={cmsSeed}>
        <App routesLocation={routesLocation} />
      </CmsProvider>
    </LocaleProvider>
  );
}
