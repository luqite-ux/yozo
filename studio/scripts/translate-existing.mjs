/**
 * 一次性脚本：将 Sanity 中已有的 productCategory / product 文档
 * 批量翻译 ZH→EN/ES，写回对应的 _en/_es（或 titleEn/titleEs）字段。
 *
 * 用法（在项目根目录或 studio 目录均可）：
 *   node studio/scripts/translate-existing.mjs
 *   node studio/scripts/translate-existing.mjs --force   # 忽略 hash，强制重译
 *
 * 依赖：@sanity/client（studio/node_modules 已有）
 * 翻译：MyMemory 免费 API，无需 key；每天限约 5 000 词。
 *       脚本在每次 API 调用之间加 600ms 延迟，防止超额。
 */

import { createClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const studioRoot = join(__dirname, '..');
const websiteRoot = join(studioRoot, '..', 'website');
const FORCE = process.argv.includes('--force');

// ── 解析 .env 文件 ────────────────────────────────────────────────────────────
function parseEnvFile(dir, fname) {
  const p = join(dir, fname);
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}

const env = { ...process.env };
for (const dir of [websiteRoot, studioRoot]) {
  Object.assign(env, parseEnvFile(dir, '.env'));
  Object.assign(env, parseEnvFile(dir, '.env.local'));
}

const projectId =
  env.SANITY_STUDIO_PROJECT_ID?.trim() ||
  env.VITE_SANITY_PROJECT_ID?.trim() ||
  env.SANITY_PROJECT_ID?.trim() ||
  '';
const dataset =
  env.SANITY_STUDIO_DATASET?.trim() ||
  env.VITE_SANITY_DATASET?.trim() ||
  env.SANITY_DATASET?.trim() ||
  'production';
const token =
  env.SANITY_API_WRITE_TOKEN?.trim() ||
  env.SANITY_WRITE_TOKEN?.trim() ||
  env.SANITY_AUTH_TOKEN?.trim() ||
  env.SANITY_TOKEN?.trim() ||
  '';
const MYMEMORY_EMAIL = env.MYMEMORY_EMAIL || '';

if (!projectId || !token) {
  console.error('缺少 projectId 或写 Token，请检查 website/.env.local 或 studio/.env.local');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2024-01-01',
  useCdn: false,
});

// ── 翻译工具 ──────────────────────────────────────────────────────────────────
const DELAY_MS = 600;           // 每次 API 调用之间的间隔
const MAX_CHARS = 500;          // MyMemory 单次请求上限

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateChunk(text, from, to) {
  const emailParam = MYMEMORY_EMAIL ? `&de=${encodeURIComponent(MYMEMORY_EMAIL)}` : '';
  const url =
    `https://api.mymemory.translated.net/get` +
    `?q=${encodeURIComponent(text)}&langpair=${from}|${to}${emailParam}`;

  await sleep(DELAY_MS);
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = await res.json();
  if (data.responseStatus !== 200)
    throw new Error(`MyMemory: ${data.responseDetails}`);
  return data.responseData.translatedText;
}

async function translateText(text, from, to) {
  if (!text || !text.trim()) return '';
  if (text.length <= MAX_CHARS) return translateChunk(text, from, to);

  // 超长文本按句分段
  const sentences = text.split(/(?<=[。！？.!?])\s*/);
  const chunks = [];
  let buf = '';
  for (const s of sentences) {
    if (buf.length + s.length > MAX_CHARS) {
      if (buf) chunks.push(buf);
      buf = s;
    } else {
      buf += (buf ? ' ' : '') + s;
    }
  }
  if (buf) chunks.push(buf);

  const parts = [];
  for (const c of chunks) {
    parts.push(await translateChunk(c, from, to));
  }
  return parts.join(' ');
}

async function translateArray(arr, from, to) {
  if (!arr || arr.length === 0) return [];
  const out = [];
  for (const item of arr) {
    out.push(await translateText(String(item), from, to));
  }
  return out;
}

// ── 哈希（与 webhook/server.js 保持一致）─────────────────────────────────────
const TEXT_FIELDS = [
  'name', 'excerpt', 'description', 'applicationScenarios',
  'packaging', 'skinType', 'oemDesc',
];
const ARRAY_FIELDS = ['efficacy', 'tags'];

function serializeSpecs(specs) {
  if (!Array.isArray(specs) || specs.length === 0) return '';
  return specs
    .map((r) => {
      const l = (r && typeof r === 'object' ? String(r.label || r.name || '').trim() : '').trim();
      const v = (r && typeof r === 'object' ? String(r.value || r.text || '').trim() : '').trim();
      return `${l}:${v}`;
    })
    .filter(Boolean)
    .join('‖');
}

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

function serializeRelatedFaqsForHash(list) {
  if (!Array.isArray(list) || list.length === 0) return '';
  return list
    .map((item) => {
      const q = String(item?.question ?? '').trim();
      const a = String(item?.answer ?? '').trim();
      return `${q}‖${a}`;
    })
    .join('¶');
}

function hashProduct(doc) {
  const parts = [
    ...TEXT_FIELDS.map((f) => doc[f] || ''),
    ...ARRAY_FIELDS.map((f) => (doc[f] || []).join('‖')),
    serializeSpecs(doc.specifications),
    portableBlocksToPlain(doc.body),
    Array.isArray(doc.ingredients)
      ? doc.ingredients
          .map((ing) => `${String(ing?.name ?? '').trim()}::${String(ing?.description ?? '').trim()}`)
          .join('¶')
      : '',
  ].join('|');
  return crypto.createHash('md5').update(parts).digest('hex');
}

function hashCategory(doc) {
  return crypto.createHash('md5').update(String(doc.title || '').trim()).digest('hex');
}

function hashFaq(doc) {
  return crypto.createHash('md5')
    .update([String(doc.question || '').trim(), String(doc.answer || '').trim()].join('|'))
    .digest('hex');
}

function hashPost(doc) {
  const bodyPlain =
    portableBlocksToPlain(doc.body) || String(doc.plainBody || '').trim();
  return crypto
    .createHash('md5')
    .update(
      [
        String(doc.title || '').trim(),
        String(doc.summary || '').trim(),
        serializeRelatedFaqsForHash(doc.relatedFaqs),
        bodyPlain,
      ].join('|'),
    )
    .digest('hex');
}

function hashCaseStudy(doc) {
  const bodyPlain = portableBlocksToPlain(doc.body);
  return crypto
    .createHash('md5')
    .update([String(doc.title || '').trim(), String(doc.excerpt || '').trim(), bodyPlain].join('|'))
    .digest('hex');
}

// ── 处理单条 productCategory ──────────────────────────────────────────────────
async function processCategory(doc) {
  const title = String(doc.title || '').trim();
  if (!title) return { skipped: true, reason: 'empty title' };

  const hash = hashCategory(doc);
  if (!FORCE && doc.translationSourceHash === hash)
    return { skipped: true, reason: 'already translated' };

  console.log(`  [category] ${doc._id}  "${title}"`);
  const titleEn = await translateText(title, 'zh-CN', 'en');
  const titleEs = await translateText(title, 'zh-CN', 'es');
  await client.patch(doc._id).set({ titleEn, titleEs, translationSourceHash: hash }).commit();
  console.log(`    → EN: ${titleEn}`);
  console.log(`    → ES: ${titleEs}`);
  return { success: true };
}

// ── 处理单条 product ──────────────────────────────────────────────────────────
async function processProduct(doc) {
  const hash = hashProduct(doc);
  if (!FORCE && doc.translationSourceHash === hash)
    return { skipped: true, reason: 'already translated' };

  console.log(`  [product]  ${doc._id}  "${doc.name || '(无名称)'}"`);
  const patch = { translationSourceHash: hash };

  for (const field of TEXT_FIELDS) {
    const val = doc[field];
    if (!val) continue;
    console.log(`    ${field} → en…`);
    patch[`${field}_en`] = await translateText(val, 'zh-CN', 'en');
    console.log(`    ${field} → es…`);
    patch[`${field}_es`] = await translateText(val, 'zh-CN', 'es');
  }

  for (const field of ARRAY_FIELDS) {
    const arr = doc[field];
    if (!arr || arr.length === 0) continue;
    console.log(`    ${field}[] → en…`);
    patch[`${field}_en`] = await translateArray(arr, 'zh-CN', 'en');
    console.log(`    ${field}[] → es…`);
    patch[`${field}_es`] = await translateArray(arr, 'zh-CN', 'es');
  }

  // specifications：逐行翻译 label/value
  if (Array.isArray(doc.specifications) && doc.specifications.length > 0) {
    console.log(`    specifications[] → en/es…`);
    const rows = [];
    for (const row of doc.specifications) {
      const label = row?.label ? String(row.label) : '';
      const value = row?.value ? String(row.value) : '';
      const label_en = await translateText(label, 'zh-CN', 'en');
      const label_es = await translateText(label, 'zh-CN', 'es');
      const value_en = await translateText(value, 'zh-CN', 'en');
      const value_es = await translateText(value, 'zh-CN', 'es');
      rows.push({ ...row, label_en, label_es, value_en, value_es });
    }
    patch.specifications = rows;
  }

  // ingredients：逐条翻译（内嵌对象）
  if (Array.isArray(doc.ingredients) && doc.ingredients.length > 0) {
    console.log(`    ingredients[] → en/es/pt/ar/ru…`);
    const rows = [];
    for (const ing of doc.ingredients) {
      const name = String(ing?.name ?? '').trim();
      const desc = String(ing?.description ?? '').trim();
      const row = { ...ing };
      if (name) {
        row.name_en = await translateText(name, 'zh-CN', 'en');
        row.name_es = await translateText(name, 'zh-CN', 'es');
        row.name_pt = await translateText(name, 'zh-CN', 'pt');
        row.name_ar = await translateText(name, 'zh-CN', 'ar');
        row.name_ru = await translateText(name, 'zh-CN', 'ru');
      }
      if (desc) {
        row.description_en = await translateText(desc, 'zh-CN', 'en');
        row.description_es = await translateText(desc, 'zh-CN', 'es');
        row.description_pt = await translateText(desc, 'zh-CN', 'pt');
        row.description_ar = await translateText(desc, 'zh-CN', 'ar');
        row.description_ru = await translateText(desc, 'zh-CN', 'ru');
      }
      rows.push(row);
    }
    patch.ingredients = rows;
  }

    const bodyPlain = portableBlocksToPlain(doc.body);
    if (bodyPlain) {
      console.log(`    body (plain) → en…`);
      patch.bodyPlain_en = await translateText(bodyPlain, 'zh-CN', 'en');
      console.log(`    body (plain) → es…`);
      patch.bodyPlain_es = await translateText(bodyPlain, 'zh-CN', 'es');
    }

    await client.patch(doc._id).set(patch).commit();
    console.log(`    ✓ done`);
    return { success: true };
  }

// ── 处理单条 faq ──────────────────────────────────────────────────────────────
async function processFaq(doc) {
  const question = String(doc.question || '').trim();
  const answer   = String(doc.answer   || '').trim();
  if (!question && !answer) return { skipped: true, reason: 'empty content' };

  const hash = hashFaq(doc);
  if (!FORCE && doc.translationSourceHash === hash)
    return { skipped: true, reason: 'already translated' };

  console.log(`  [faq]  ${doc._id}  "${question.slice(0, 40)}…"`);
  const patch = { translationSourceHash: hash };

  if (question) {
    console.log(`    question → en…`);
    patch.question_en = await translateText(question, 'zh-CN', 'en');
    console.log(`    question → es…`);
    patch.question_es = await translateText(question, 'zh-CN', 'es');
  }
  if (answer) {
    console.log(`    answer → en…`);
    patch.answer_en = await translateText(answer, 'zh-CN', 'en');
    console.log(`    answer → es…`);
    patch.answer_es = await translateText(answer, 'zh-CN', 'es');
  }

  await client.patch(doc._id).set(patch).commit();
  console.log(`    ✓ done`);
  return { success: true };
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nproject=${projectId}  dataset=${dataset}  force=${FORCE}\n`);

  const [categories, products, faqs, posts, caseStudies] = await Promise.all([
    client.fetch(`*[_type == "productCategory" && !(_id in path("drafts.**"))]{
      _id, title, titleEn, titleEs, translationSourceHash
    }`),
    client.fetch(`*[_type == "product" && !(_id in path("drafts.**"))]{
      _id, name, excerpt, description, applicationScenarios,
      packaging, skinType, oemDesc, efficacy, tags, specifications, translationSourceHash,
      body,
      ingredients
    }`),
    client.fetch(`*[_type == "faq" && !(_id in path("drafts.**"))]{
      _id, question, answer, translationSourceHash
    }`),
    client.fetch(`*[_type == "post" && !(_id in path("drafts.**"))]{
      _id, title, summary, translationSourceHash,
      body, plainBody,
      relatedFaqs[]{ _key, question, answer }
    }`),
    client.fetch(`*[_type == "caseStudy" && !(_id in path("drafts.**"))]{
      _id, title, excerpt, translationSourceHash, body
    }`),
  ]);

  console.log(`找到 ${categories.length} 个分类，${products.length} 个产品，${faqs.length} 条 FAQ，${posts.length} 篇文章，${caseStudies.length} 个案例\n`);

  let catDone = 0, catSkipped = 0;
  let prodDone = 0, prodSkipped = 0;
  let faqDone = 0, faqSkipped = 0;
  let postDone = 0, postSkipped = 0;
  let caseDone = 0, caseSkipped = 0;

  console.log('── 翻译分类 ──────────────────────────────────────────────────');
  for (const doc of categories) {
    try {
      const r = await processCategory(doc);
      if (r.skipped) { catSkipped++; console.log(`  [skip] ${doc._id} — ${r.reason}`); }
      else catDone++;
    } catch (e) {
      console.error(`  [ERROR] ${doc._id}: ${e.message}`);
    }
  }

  console.log('\n── 翻译产品 ──────────────────────────────────────────────────');
  for (const doc of products) {
    try {
      const r = await processProduct(doc);
      if (r.skipped) { prodSkipped++; console.log(`  [skip] ${doc._id} — ${r.reason}`); }
      else prodDone++;
    } catch (e) {
      console.error(`  [ERROR] ${doc._id}: ${e.message}`);
    }
  }

  console.log('\n── 翻译 FAQ ──────────────────────────────────────────────────');
  for (const doc of faqs) {
    try {
      const r = await processFaq(doc);
      if (r.skipped) { faqSkipped++; console.log(`  [skip] ${doc._id} — ${r.reason}`); }
      else faqDone++;
    } catch (e) {
      console.error(`  [ERROR] ${doc._id}: ${e.message}`);
    }
  }

  console.log('\n── 翻译文章 ──────────────────────────────────────────────────');
  for (const doc of posts) {
    const title = String(doc.title || '').trim();
    const summary = String(doc.summary || '').trim();
    const hasFaqs =
      Array.isArray(doc.relatedFaqs) &&
      doc.relatedFaqs.some(
        (i) => String(i?.question || '').trim() || String(i?.answer || '').trim(),
      );
    const bodyPlain =
      portableBlocksToPlain(doc.body) || String(doc.plainBody || '').trim();
    const hasBody = Boolean(bodyPlain);
    if (!title && !summary && !hasFaqs && !hasBody) {
      postSkipped++;
      console.log(`  [skip] ${doc._id} — empty`);
      continue;
    }

    const hash = hashPost(doc);
    if (!FORCE && doc.translationSourceHash === hash) {
      postSkipped++;
      console.log(`  [skip] ${doc._id} — already translated`);
      continue;
    }

    const faqText = (doc.relatedFaqs || [])
      .map((i) => (i?.question || '') + (i?.answer || ''))
      .join('');
    const hasChinese = /[\u4e00-\u9fff]/.test(title + summary + faqText + bodyPlain);
    if (!hasChinese) {
      postSkipped++;
      console.log(`  [skip] ${doc._id} — no Chinese content`);
      continue;
    }

    console.log(`  [post] ${doc._id}  "${title.slice(0, 40)}…"`);
    try {
      const patch = { translationSourceHash: hash };
      if (title) {
        console.log(`    title → en…`);
        patch.title_en = await translateText(title, 'zh-CN', 'en');
        console.log(`    title → es…`);
        patch.title_es = await translateText(title, 'zh-CN', 'es');
      }
      if (summary) {
        console.log(`    summary → en…`);
        patch.summary_en = await translateText(summary, 'zh-CN', 'en');
        console.log(`    summary → es…`);
        patch.summary_es = await translateText(summary, 'zh-CN', 'es');
      }
      if (hasBody) {
        console.log(`    body (plain) → en…`);
        patch.bodyPlain_en = await translateText(bodyPlain, 'zh-CN', 'en');
        console.log(`    body (plain) → es…`);
        patch.bodyPlain_es = await translateText(bodyPlain, 'zh-CN', 'es');
      }
      if (hasFaqs) {
        console.log(`    relatedFaqs[] → en/es…`);
        const rows = [];
        for (const item of doc.relatedFaqs) {
          const q = String(item.question || '').trim();
          const a = String(item.answer || '').trim();
          const row = { ...item };
          if (q) {
            row.question_en = await translateText(q, 'zh-CN', 'en');
            row.question_es = await translateText(q, 'zh-CN', 'es');
          }
          if (a) {
            row.answer_en = await translateText(a, 'zh-CN', 'en');
            row.answer_es = await translateText(a, 'zh-CN', 'es');
          }
          rows.push(row);
        }
        patch.relatedFaqs = rows;
      }
      await client.patch(doc._id).set(patch).commit();
      console.log(`    ✓ done`);
      postDone++;
    } catch (e) {
      console.error(`  [ERROR] ${doc._id}: ${e.message}`);
    }
  }

  console.log('\n── 翻译案例 ──────────────────────────────────────────────────');
  for (const doc of caseStudies) {
    const title = String(doc.title || '').trim();
    const excerpt = String(doc.excerpt || '').trim();
    const bodyPlain = portableBlocksToPlain(doc.body);
    if (!title && !excerpt && !bodyPlain) {
      caseSkipped++;
      console.log(`  [skip] ${doc._id} — empty`);
      continue;
    }
    const hash = hashCaseStudy(doc);
    if (!FORCE && doc.translationSourceHash === hash) {
      caseSkipped++;
      console.log(`  [skip] ${doc._id} — already translated`);
      continue;
    }
    const hasChinese = /[\u4e00-\u9fff]/.test(title + excerpt + bodyPlain);
    if (!hasChinese) {
      caseSkipped++;
      console.log(`  [skip] ${doc._id} — no Chinese content`);
      continue;
    }
    console.log(`  [case] ${doc._id}  "${title.slice(0, 40)}…"`);
    try {
      const patch = { translationSourceHash: hash };
      if (title) {
        patch.title_en = await translateText(title, 'zh-CN', 'en');
        patch.title_es = await translateText(title, 'zh-CN', 'es');
      }
      if (excerpt) {
        patch.excerpt_en = await translateText(excerpt, 'zh-CN', 'en');
        patch.excerpt_es = await translateText(excerpt, 'zh-CN', 'es');
      }
      if (bodyPlain) {
        patch.bodyPlain_en = await translateText(bodyPlain, 'zh-CN', 'en');
        patch.bodyPlain_es = await translateText(bodyPlain, 'zh-CN', 'es');
      }
      await client.patch(doc._id).set(patch).commit();
      console.log(`    ✓ done`);
      caseDone++;
    } catch (e) {
      console.error(`  [ERROR] ${doc._id}: ${e.message}`);
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`分类：翻译 ${catDone} 条，跳过 ${catSkipped} 条`);
  console.log(`产品：翻译 ${prodDone} 条，跳过 ${prodSkipped} 条`);
  console.log(`FAQ：翻译 ${faqDone} 条，跳过 ${faqSkipped} 条`);
  console.log(`文章：翻译 ${postDone} 条，跳过 ${postSkipped} 条`);
  console.log(`案例：翻译 ${caseDone} 条，跳过 ${caseSkipped} 条`);
  console.log(`合计：翻译 ${catDone + prodDone + faqDone + postDone + caseDone} 条`);
}

main().catch((e) => { console.error(e); process.exit(1); });
