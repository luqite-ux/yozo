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
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@sanity/client';
import { getContactPageSeedDoc } from '../seed/contactPageSeed.js';
import {
  createDeepseekTranslator,
  loadMergedEnv,
  PRODUCT_LOCALES,
} from './lib/deepseekTranslate.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const studioRoot = join(__dirname, '..');
const repoRoot = join(studioRoot, '..');

const env = loadMergedEnv(studioRoot, repoRoot);

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

const translator = createDeepseekTranslator({
  apiKey: DEEPSEEK_API_KEY,
  baseUrl: DEEPSEEK_BASE_URL,
  model: DEEPSEEK_MODEL,
});

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
    const byLocale = await translator.translateForLocales(title, 'zh-CN', PRODUCT_LOCALES);
    for (const loc of PRODUCT_LOCALES) patch[`title_${loc}`] = byLocale[loc];
  }
  if (excerpt) {
    const byLocale = await translator.translateForLocales(excerpt, 'zh-CN', PRODUCT_LOCALES);
    for (const loc of PRODUCT_LOCALES) patch[`excerpt_${loc}`] = byLocale[loc];
  }
  if (bodyPlain) {
    const byLocale = await translator.translateForLocales(bodyPlain, 'zh-CN', PRODUCT_LOCALES);
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
      const byLocale = await translator.translateForLocales(val, 'zh-CN', PRODUCT_LOCALES);
      for (const loc of PRODUCT_LOCALES) dst[`${f}_${loc}`] = byLocale[loc];
    }
    if (Array.isArray(src.hubs)) {
      dst.hubs = [];
      for (const row of src.hubs) {
        const n = { ...row };
        const label = String(row?.label || '').trim();
        const sub = String(row?.sub || '').trim();
        if (label) {
          const byLocale = await translator.translateForLocales(label, 'zh-CN', PRODUCT_LOCALES);
          for (const loc of PRODUCT_LOCALES) n[`label_${loc}`] = byLocale[loc];
        }
        if (sub) {
          const byLocale = await translator.translateForLocales(sub, 'zh-CN', PRODUCT_LOCALES);
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
          const byLocale = await translator.translateForLocales(label, 'zh-CN', PRODUCT_LOCALES);
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
