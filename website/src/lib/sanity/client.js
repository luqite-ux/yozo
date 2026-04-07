import { createClient } from '@sanity/client';

/** Vite 代理前缀，需与 vite.config.js 一致（绕过 localhost 未加入 Sanity CORS 时的 403） */
export const SANITY_BROWSER_CDN_PROXY_PREFIX = '/__sanity-apicdn';

/** @type {import('@sanity/client').SanityClient | null} */
let _client = null;

/** @type {string | undefined} */
let _clientConfigKey;

function isBrowserLocalhost() {
  if (typeof window === 'undefined' || !window.location?.hostname) return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
}

export function isSanityConfigured() {
  return Boolean(import.meta.env.VITE_SANITY_PROJECT_ID?.trim());
}

/**
 * 浏览器端 Sanity 客户端（仅用于内容读取）。
 * 需配置 VITE_SANITY_*，见根目录 .env.example。
 */
export function getSanityClient() {
  const projectId = import.meta.env.VITE_SANITY_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error(
      'Sanity 未配置：在 website/.env 中设置 VITE_SANITY_PROJECT_ID（可参考 .env.example）。',
    );
  }

  /** Node / SSR：直连 apicdn，不走浏览器本地代理 */
  if (typeof window === 'undefined') {
    const token = import.meta.env.VITE_SANITY_READ_TOKEN?.trim() || undefined;
    const apiVersion = import.meta.env.VITE_SANITY_API_VERSION?.trim() || '2024-01-01';
    return createClient({
      projectId,
      dataset: import.meta.env.VITE_SANITY_DATASET?.trim() || 'production',
      apiVersion,
      useCdn: import.meta.env.VITE_SANITY_USE_CDN !== 'false',
      token,
    });
  }

  const viaLocalProxy = isBrowserLocalhost();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const configKey = `${projectId}|${viaLocalProxy}|${origin}`;
  if (_client && _clientConfigKey !== configKey) {
    _client = null;
  }

  if (!_client) {
    const token = import.meta.env.VITE_SANITY_READ_TOKEN?.trim() || undefined;
    const apiVersion = import.meta.env.VITE_SANITY_API_VERSION?.trim() || '2024-01-01';
    /** @type {import('@sanity/client').ClientConfig} */
    const cfg = {
      projectId,
      dataset: import.meta.env.VITE_SANITY_DATASET?.trim() || 'production',
      apiVersion,
      useCdn: import.meta.env.VITE_SANITY_USE_CDN !== 'false',
      token,
    };
    if (viaLocalProxy) {
      cfg.useProjectHostname = false;
      cfg.apiHost = `${window.location.origin}${SANITY_BROWSER_CDN_PROXY_PREFIX}`;
    }
    _client = createClient(cfg);
    _clientConfigKey = configKey;
  }

  return _client;
}

/** 单测或切换环境时可调用 */
export function resetSanityClientForTests() {
  _client = null;
  _clientConfigKey = undefined;
}
