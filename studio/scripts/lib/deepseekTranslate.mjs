/**
 * DeepSeek 翻译工具（Studio 脚本共用）。与 webhook/server.js 逻辑对齐：zh-CN → en/es/pt/ar/ru。
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const PRODUCT_LOCALES = ['en', 'es', 'pt', 'ar', 'ru'];
export const MAX_RETRIES = 5;
const RETRY_BASE_MS = 800;
export const MAX_TRANSLATE_CHARS = 1800;

export function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return out;
}

/**
 * @param {string} studioRoot
 * @param {string} repoRoot
 */
export function loadMergedEnv(studioRoot, repoRoot) {
  return {
    ...process.env,
    ...parseEnvFile(join(repoRoot, 'webhook', '.env')),
    ...parseEnvFile(join(repoRoot, 'website', '.env.local')),
    ...parseEnvFile(join(studioRoot, '.env.local')),
  };
}

function getRetryDelayMs(attempt, retryAfterHeader) {
  const retryAfterSeconds = Number.parseInt(retryAfterHeader || '', 10);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }
  const exp = RETRY_BASE_MS * 2 ** (attempt - 1);
  const jitter = Math.floor(Math.random() * 250);
  return exp + jitter;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {{ apiKey: string, baseUrl?: string, model?: string }} opts
 */
export function createDeepseekTranslator(opts) {
  const apiKey = String(opts.apiKey || '').trim();
  const baseUrl = String(opts.baseUrl || 'https://api.deepseek.com').replace(/\/$/, '');
  const model = String(opts.model || 'deepseek-chat').trim();

  async function translateChunk(text, from, to) {
    const endpoint = `${baseUrl}/chat/completions`;
    const payload = {
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are a professional translator. Translate faithfully and naturally. Return only the translated text.',
        },
        {
          role: 'user',
          content: `Translate the following text from ${from} to ${to}. Keep formatting, punctuation, and line breaks.\n\n${text}`,
        },
      ],
    };

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(120_000),
      });

      if (res.ok) {
        const data = await res.json();
        const translated = data?.choices?.[0]?.message?.content?.trim();
        if (!translated) throw new Error('DeepSeek empty translation result');
        return translated;
      }

      if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
        await sleep(getRetryDelayMs(attempt, res.headers.get('retry-after')));
        continue;
      }

      const errText = await res.text();
      throw new Error(`DeepSeek HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }

    throw new Error('DeepSeek retry exhausted');
  }

  async function translateText(text, from, to) {
    if (!text || !text.trim()) return '';
    if (text.length <= MAX_TRANSLATE_CHARS) {
      return translateChunk(text, from, to);
    }
    const sentences = text.split(/(?<=[。！？.!?])\s*/);
    const chunks = [];
    let buf = '';
    for (const s of sentences) {
      if (buf.length + s.length > MAX_TRANSLATE_CHARS) {
        if (buf) chunks.push(buf);
        buf = s;
      } else {
        buf += (buf ? ' ' : '') + s;
      }
    }
    if (buf) chunks.push(buf);
    const translated = await Promise.all(chunks.map((c) => translateChunk(c, from, to)));
    return translated.join(' ');
  }

  return {
    /**
     * @param {string} text
     * @param {string} [from]
     * @param {string[]} [locales]
     */
    async translateForLocales(text, from = 'zh-CN', locales = PRODUCT_LOCALES) {
      const translated = await Promise.all(locales.map((to) => translateText(text, from, to)));
      return Object.fromEntries(locales.map((loc, i) => [loc, translated[i]]));
    },
  };
}
