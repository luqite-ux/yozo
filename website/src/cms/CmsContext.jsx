import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isSanityConfigured, readCmsPayloadFromSanity } from '../lib/sanity/index.js';

const CmsContext = createContext(null);

export function CmsProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [articles, setArticles] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [caseStudies, setCaseStudies] = useState([]);
  const [simplePages, setSimplePages] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [articleCategories, setArticleCategories] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isSanityConfigured()) {
        throw new Error(
          '未配置 Sanity：请在 website/.env 中设置 VITE_SANITY_PROJECT_ID 与 VITE_SANITY_DATASET（参见 .env.example）。',
        );
      }
      const payload = await readCmsPayloadFromSanity();
      setProducts(payload.products);
      setArticles(payload.articles);
      setFaqs(payload.faqs);
      setCaseStudies(payload.caseStudies);
      setSimplePages(payload.simplePages);
      setProductCategories(payload.productCategories);
      setArticleCategories(payload.articleCategories);
      setSiteSettings(payload.siteSettings);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
