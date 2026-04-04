import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import zh from './translations/zh.js';
import en from './translations/en.js';
import es from './translations/es.js';
import uiExtraZh from './translations/uiExtra.zh.js';
import uiExtraEn from './translations/uiExtra.en.js';
import uiExtraEs from './translations/uiExtra.es.js';

const STORAGE_KEY = 'yozo.locale';

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
};

function normalizeLocale(input) {
  const raw = String(input || '').trim().toLowerCase();
  if (raw.startsWith('en')) return 'en';
  if (raw.startsWith('es')) return 'es';
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

export function LocaleProvider({ children, defaultLocale }) {
  const [locale, setLocaleState] = useState(() => {
    const fromStorage = normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
    if (fromStorage) return fromStorage;
    return normalizeLocale(defaultLocale);
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore
    }
  }, [locale]);

  useEffect(() => {
    document.documentElement.lang =
      locale === 'zh' ? 'zh-CN' : locale === 'es' ? 'es' : 'en';
  }, [locale]);

  const setLocale = useCallback((next) => {
    setLocaleState(normalizeLocale(next));
  }, []);

  const dict = dictionaries[locale] || zh;
  const t = useMemo(() => createT(dict, zh), [dict]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      dictionaries,
    }),
    [locale, setLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

