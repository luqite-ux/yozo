/**
 * 使用仓库内环境变量（优先 studio/.env.local 中的 DEEPSEEK_* 与 SANITY_STUDIO_*），
 * 拉取 simplePage#contact，按中文主字段调用 DeepSeek 写入各语言只读字段（逻辑与 webhook/server.js processSimplePage 对齐）。
 *
 * 用法（在 studio 目录）：
 *   npm run pretranslate:contact
 *   npm run pretranslate:contact -- --skip-if-unchanged   # 若 translationSourceHash 已匹配则跳过
 *
 * 需：SANITY_API_WRITE_TOKEN（或 SANITY_WRITE_TOKEN）、projectId；DEEPSEEK_API_KEY 等可读 studio/.env.local。
 */
import crypto from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import { getContactPageSeedDoc } from '../seed/contactPageSeed.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const studioRoot = join(__dirname, '..');
const repoRoot = join(studioRoot, '..');

function parseEnvFile(path) {
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

const env = {
  ...process.env,
  ...parseEnvFile(join(repoRoot, 'webhook', '.env')),
  ...parseEnvFile(join(repoRoot, 'website', '.env.local')),
  ...parseEnvFile(join(studioRoot, '.env.local')),
};

const projectId =
  env.SANITY_PROJECT_ID ||
  env.SANITY_STUDIO_PROJECT_ID ||
  env.VITE_SANITY_PROJECT_ID ||
  '';
const dataset = env.SANITY_DATASET || env.SANITY_STUDIO_DATASET || env.VITE_SANITY_DATASET || 'production';
const token = env.SANITY_WRITE_TOKEN || env.SANITY_API_WRITE_TOKEN || '';

const DEEPSEEK_API_KEY = String(env.DEEPSEEK_API_KEY || '').trim();
const DEEPSEEK_BASE_URL = String(env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').trim();
const DEEPSEEK_MODEL = String(env.DEEPSEEK_MODEL || 'deepseek-chat').trim();

const PRODUCT_LOCALES = ['en', 'es', 'pt', 'ar', 'ru'];
const MAX_RETRIES = 5;
const RETRY_BASE_MS = 800;
const MAX_TRANSLATE_CHARS = 1800;

function portableBlocksToPlain(blocks) {
  if (!blocks || !Array.isArray(blocks)) return '';
  const parts = [];
  for (const block of blocks) {
    if (!block || block._type !== 'block') continue;
    const text = (block.children || []).map((c) => (c && c.text) || '').join('');
    if (text.trim()) parts.push(text.trim());
  }
  return parts.join('\n\n');
}

function serializeSimplePageForHash(doc) {
  const title = String(doc?.title || '').trim();
  const excerpt = String(doc?.excerpt || '').trim();
  const bodyPlain = portableBlocksToPlain(doc?.body);
  const contactLayout = doc?.contactLayout ? JSON.stringify(doc.contactLayout) : '';
  return crypto.createHash('md5').update([title, excerpt, bodyPlain, contactLayout].join('|')).digest('hex');
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

async function translateChunk(text, from, to) {
  const endpoint = `${DEEPSEEK_BASE_URL.replace(/\/$/, '')}/chat/completions`;
  const payload = {
    model: DEEPSEEK_MODEL,
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
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
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

async function translateForLocales(text, from, locales) {
  const translated = await Promise.all(locales.map((to) => translateText(text, from, to)));
  return Object.fromEntries(locales.map((loc, i) => [loc, translated[i]]));
}

/**
 * @param {import('@sanity/client').SanityClient} client
 * @param {Record<string, unknown>} doc
 * @param {{ force?: boolean }} opts
 */
async function processContactSimplePage(client, doc, opts = {}) {
  const { force = true } = opts;
  const _id = doc._id;
  const _type = doc._type;
  if (_type !== 'simplePage') throw new Error('Not a simplePage');
  if (String(doc.slug?.current || '') !== 'contact') throw new Error('Not contact slug');

  const title = String(doc.title || '').trim();
  const excerpt = String(doc.excerpt || '').trim();
  const bodyPlain = portableBlocksToPlain(doc.body);
  const hasCore = Boolean(title || excerpt || bodyPlain);
  const hasContactLayout = Boolean(doc.contactLayout);
  if (!hasCore && !hasContactLayout) {
    return { skipped: true, reason: 'empty content' };
  }

  const currentHash = serializeSimplePageForHash(doc);
  if (!force && doc.translationSourceHash && doc.translationSourceHash === currentHash) {
    return { skipped: true, reason: 'already translated' };
  }

  console.log(`[${_id}] Translating simplePage (contact)…`);
  const patch = { translationSourceHash: currentHash };

  if (title) {
    const byLocale = await translateForLocales(title, 'zh-CN', PRODUCT_LOCALES);
    for (const loc of PRODUCT_LOCALES) patch[`title_${loc}`] = byLocale[loc];
  }
  if (excerpt) {
    const byLocale = await translateForLocales(excerpt, 'zh-CN', PRODUCT_LOCALES);
    for (const loc of PRODUCT_LOCALES) patch[`excerpt_${loc}`] = byLocale[loc];
  }
  if (bodyPlain) {
    const byLocale = await translateForLocales(bodyPlain, 'zh-CN', PRODUCT_LOCALES);
    for (const loc of PRODUCT_LOCALES) patch[`bodyPlain_${loc}`] = byLocale[loc];
  }

  if (hasContactLayout) {
    const src = doc.contactLayout || {};
    const dst = JSON.parse(JSON.stringify(src));
    const textFields = [
      'eyebrow',
      'title',
      'lead',
      'mapTitle',
      'mapLead',
      'legendHq',
      'legendHub',
      'hqTitle',
      'hqSubtitle',
      'hqBody',
      'hotlineTitle',
      'hotlineSubtitle',
      'hotlineLine1',
      'hotlineLine2',
      'bizTitle',
      'bizSubtitle',
      'bizBody',
      'bizEmail',
    ];
    for (const f of textFields) {
      const val = String(src[f] || '').trim();
      if (!val) continue;
      console.log(`  contactLayout.${f} → ${PRODUCT_LOCALES.join('/')}`);
      const byLocale = await translateForLocales(val, 'zh-CN', PRODUCT_LOCALES);
      for (const loc of PRODUCT_LOCALES) dst[`${f}_${loc}`] = byLocale[loc];
    }
    if (Array.isArray(src.hubs)) {
      dst.hubs = [];
      for (const row of src.hubs) {
        const n = { ...row };
        const label = String(row?.label || '').trim();
        const sub = String(row?.sub || '').trim();
        if (label) {
          const byLocale = await translateForLocales(label, 'zh-CN', PRODUCT_LOCALES);
          for (const loc of PRODUCT_LOCALES) n[`label_${loc}`] = byLocale[loc];
        }
        if (sub) {
          const byLocale = await translateForLocales(sub, 'zh-CN', PRODUCT_LOCALES);
          for (const loc of PRODUCT_LOCALES) n[`sub_${loc}`] = byLocale[loc];
        }
        dst.hubs.push(n);
      }
    }
    if (Array.isArray(src.stats)) {
      dst.stats = [];
      for (const row of src.stats) {
        const n = { ...row };
        const label = String(row?.label || '').trim();
        if (label) {
          const byLocale = await translateForLocales(label, 'zh-CN', PRODUCT_LOCALES);
          for (const loc of PRODUCT_LOCALES) n[`label_${loc}`] = byLocale[loc];
        }
        dst.stats.push(n);
      }
    }
    patch.contactLayout = dst;
  }

  await client.patch(_id).set(patch).commit();
  console.log(`[${_id}] Done (simplePage contact)`);
  return { success: true, _id };
}

async function main() {
  const skipIfUnchanged = process.argv.includes('--skip-if-unchanged');

  if (!projectId || !token) {
    console.error(
      '缺少 SANITY 写权限：请在 studio/.env.local 或 website/.env.local 配置 SANITY_API_WRITE_TOKEN（或 SANITY_WRITE_TOKEN）与 projectId。',
    );
    process.exit(1);
  }
  if (!DEEPSEEK_API_KEY) {
    console.error('缺少 DEEPSEEK_API_KEY：请在 studio/.env.local 中配置（与 DeepSeek 控制台一致）。');
    process.exit(1);
  }

  const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: '2024-01-01',
    useCdn: false,
  });

  let doc = await client.fetch(
    `*[_type == "simplePage" && slug.current == "contact" && !(_id in path("drafts.**"))][0]`,
  );

  if (!doc) {
    console.log('[pretranslate-contact] 未找到已发布 contact，写入种子中文稿…');
    await client.createOrReplace(getContactPageSeedDoc());
    doc = await client.fetch(
      `*[_type == "simplePage" && slug.current == "contact" && !(_id in path("drafts.**"))][0]`,
    );
  }

  if (!doc?._id) {
    throw new Error('仍无法加载 simplePage#contact');
  }

  console.log(`[pretranslate-contact] project=${projectId} dataset=${dataset} doc=${doc._id}`);
  const result = await processContactSimplePage(client, doc, { force: !skipIfUnchanged });
  if (result.skipped) {
    console.log(`[pretranslate-contact] Skipped: ${result.reason}`);
  } else {
    console.log('[pretranslate-contact] 多语言字段已写入，请在 Studio 刷新「全球联络」。');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
