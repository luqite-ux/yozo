import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isSanityConfigured, readCmsPayloadFromSanity } from '../lib/sanity/index.js';

const CmsContext = createContext(null);

export function CmsProvider({ children, initialPayload }) {
  /** 有完整 SSR / hydration 数据；null 表示服务端已失败，客户端需再拉取 */
  const hasServerPayload = initialPayload != null && typeof initialPayload === 'object';
  const [loading, setLoading] = useState(() => !hasServerPayload);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState(() =>
    hasServerPayload ? initialPayload.products : [],
  );
  const [articles, setArticles] = useState(() =>
    hasServerPayload ? initialPayload.articles : [],
  );
  const [faqs, setFaqs] = useState(() => (hasServerPayload ? initialPayload.faqs : []));
  const [caseStudies, setCaseStudies] = useState(() =>
    hasServerPayload ? initialPayload.caseStudies : [],
  );
  const [simplePages, setSimplePages] = useState(() =>
    hasServerPayload ? initialPayload.simplePages : [],
  );
  const [productCategories, setProductCategories] = useState(() =>
    hasServerPayload ? initialPayload.productCategories : [],
  );
  const [articleCategories, setArticleCategories] = useState(() =>
    hasServerPayload ? initialPayload.articleCategories : [],
  );
  const [siteSettings, setSiteSettings] = useState(() =>
    hasServerPayload ? initialPayload.siteSettings : null,
  );
  const [aboutPage, setAboutPage] = useState(() =>
    hasServerPayload ? initialPayload.aboutPage : null,
  );
  const [servicePage, setServicePage] = useState(() =>
    hasServerPayload ? initialPayload.servicePage : null,
  );

  const applyPayload = useCallback((payload) => {
    setProducts(payload.products);
    setArticles(payload.articles);
    setFaqs(payload.faqs);
    setCaseStudies(payload.caseStudies);
    setSimplePages(payload.simplePages);
    setProductCategories(payload.productCategories);
    setArticleCategories(payload.articleCategories);
    setSiteSettings(payload.siteSettings);
    setAboutPage(payload.aboutPage);
    setServicePage(payload.servicePage);
  }, []);

  const load = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      if (!isSanityConfigured()) {
        throw new Error(
          '未配置 Sanity：请在 website/.env 中设置 VITE_SANITY_PROJECT_ID 与 VITE_SANITY_DATASET（参见 .env.example）。',
        );
      }
      const payload = await readCmsPayloadFromSanity();
      applyPayload(payload);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [applyPayload]);

  useEffect(() => {
    if (hasServerPayload) {
      setLoading(false);
      // 避免 SSR/hydration 种子数据过期：客户端静默拉取一次最新 CMS 数据。
      if (typeof window !== 'undefined' && isSanityConfigured()) {
        load({ showLoading: false });
      }
      return;
    }
    load();
  }, [hasServerPayload, load]);

  const value = useMemo(
    () => ({
      loading,
      error,
      products,
      articles,
      faqs,
      caseStudies,
      simplePages,
      productCategories,
      articleCategories,
      siteSettings,
      aboutPage,
      servicePage,
      reload: load,
    }),
    [
      loading,
      error,
      products,
      articles,
      faqs,
      caseStudies,
      simplePages,
      productCategories,
      articleCategories,
      siteSettings,
      aboutPage,
      servicePage,
      load,
    ],
  );

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
}

/** @returns {import('react').ContextType<typeof CmsContext>} */
// Fast refresh: hook 与 Provider 同文件为常规模块
export function useCms() {
  const ctx = useContext(CmsContext);
  if (!ctx) throw new Error('useCms must be used within CmsProvider');
  return ctx;
}
