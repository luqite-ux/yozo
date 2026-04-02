import { createClient } from '@sanity/client';

/** @type {import('@sanity/client').SanityClient | null} */
let _client = null;

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

  if (!_client) {
    const token = import.meta.env.VITE_SANITY_READ_TOKEN?.trim() || undefined;
    _client = createClient({
      projectId,
      dataset: import.meta.env.VITE_SANITY_DATASET?.trim() || 'production',
      apiVersion: import.meta.env.VITE_SANITY_API_VERSION?.trim() || '2024-01-01',
      useCdn: import.meta.env.VITE_SANITY_USE_CDN !== 'false',
      token,
    });
  }

  return _client;
}

/** 单测或切换环境时可调用 */
export function resetSanityClientForTests() {
  _client = null;
}
