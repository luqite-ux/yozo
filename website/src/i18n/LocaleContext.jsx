import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import zh from './translations/zh.js';
import en from './translations/en.js';
import es from './translations/es.js';
import pt from './translations/pt.js';
import ar from './translations/ar.js';
import ru from './translations/ru.js';
import uiExtraZh from './translations/uiExtra.zh.js';
import uiExtraEn from './translations/uiExtra.en.js';
import uiExtraEs from './translations/uiExtra.es.js';
import uiExtraPt from './translations/uiExtra.pt.js';
import uiExtraAr from './translations/uiExtra.ar.js';
import uiExtraRu from './translations/uiExtra.ru.js';
import { bareToLocalized, normalizeAppLocale, splitLocalePrefix } from './routing.js';

function deepMerge(base, extra) {
  if (!base) return extra || {};
  if (!extra) return base;
  const out = { ...base };
  for (const k of Object.keys(extra)) {
    const bv = base[k];
    const ev = extra[k];
    if (
      ev &&
      typeof ev === 'object' &&
      !Array.isArray(ev) &&
      bv &&
      typeof bv === 'object' &&
      !Array.isArray(bv)
    ) {
      out[k] = deepMerge(bv, ev);
    } else {
      out[k] = ev;
    }
  }
  return out;
}

const dictionaries = {
  zh: deepMerge(zh, uiExtraZh),
  en: deepMerge(en, uiExtraEn),
  es: deepMerge(es, uiExtraEs),
  pt: deepMerge(pt, uiExtraPt),
  ar: deepMerge(ar, uiExtraAr),
  ru: deepMerge(ru, uiExtraRu),
};

const SUPPORTED_LOCALES = ['zh', 'en', 'es', 'pt', 'ar', 'ru'];

function normalizeLocale(input) {
  const raw = String(input || '').trim().toLowerCase();
  for (const loc of SUPPORTED_LOCALES) {
    if (raw.startsWith(loc)) return loc;
  }
  return 'zh';
}

function getByPath(obj, path) {
  if (!obj) return undefined;
  const parts = String(path || '').split('.');
  let cur = obj;
  for (const p of parts) {
    if (!p) continue;
    if (!cur || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

function createT(dict, fallbackDict) {
  return (key) => {
    const v = getByPath(dict, key);
    if (typeof v === 'string' && v) return v;
    const fb = getByPath(fallbackDict, key);
    if (typeof fb === 'string' && fb) return fb;
    return String(key || '');
  };
}

const LocaleContext = createContext(null);

/**
 * @param {{ children: import('react').ReactNode, routeLocale: string, barePathname: string }} props
 */
export function LocaleProvider({ children, routeLocale, barePathname }) {
  const locale = normalizeLocale(routeLocale);
  const bare = barePathname && barePathname !== '' ? barePathname : '/';

  const dict = dictionaries[locale] || dictionaries.zh;
  const t = useMemo(() => createT(dict, dictionaries.zh), [dict]);

  const withLocalePath = useCallback(
    (path) => {
      const raw = path && path.startsWith('/') ? path : `/${path || ''}`;
      const { pathname: bareDest } = splitLocalePrefix(raw);
      return bareToLocalized(bareDest, locale);
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      barePathname: bare,
      withLocalePath,
      t,
      dictionaries,
    }),
    [locale, bare, withLocalePath, t],
  );

  useEffect(() => {
    const langMap = { zh: 'zh-CN', en: 'en', es: 'es', pt: 'pt', ar: 'ar', ru: 'ru' };
    document.documentElement.lang = langMap[locale] || locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

/** 将裸路径或已带前缀的路径转为当前语言下的 path 再 navigate */
export function useLocalizedNavigate() {
  const navigate = useNavigate();
  const { withLocalePath } = useLocale();
  return useCallback(
    (to, options) => {
      if (typeof to === 'number') return navigate(to);
      if (typeof to === 'string' && to.startsWith('/') && !/^https?:\/\//i.test(to)) {
        return navigate(withLocalePath(to), options);
      }
      return navigate(to, options);
    },
    [navigate, withLocalePath],
  );
}

/** 语言切换（保留当前「裸路径」） */
export function useLocaleSwitcherNavigate() {
  const navigate = useNavigate();
  return useCallback((fullPathname, search, targetLocale) => {
    const loc = normalizeAppLocale(targetLocale);
    const { pathname: bare } = splitLocalePrefix(fullPathname);
    const qs = search || '';
    navigate(bareToLocalized(bare, loc) + qs);
  }, [navigate]);
}
