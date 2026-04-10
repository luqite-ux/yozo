/**
 * Vercel Serverless Function — 产品 / 分类 / 资讯 / FAQ 自动翻译（ZH → EN / ES）
 * 路由：POST /api/webhook/translate
 *
 * Sanity → Webhooks → GROQ Filter 示例（按需增减）：
 *   _type == "product" || _type == "productCategory" || _type == "post" || _type == "faq"
 *
 * 环境变量（在 Vercel 项目设置 → Environment Variables 里添加）：
 *   SANITY_PROJECT_ID       来自 website/.env.local 的 VITE_SANITY_PROJECT_ID
 *   SANITY_DATASET          production
 *   SANITY_API_WRITE_TOKEN  来自 website/.env.local 的 SANITY_API_WRITE_TOKEN
 *   SANITY_WEBHOOK_SECRET   Sanity 后台生成的 Webhook 签名密钥（可选）
 *   MYMEMORY_EMAIL          可选，填后每日免费额度 5000→50000 字
 */

import crypto from 'crypto';
import { createClient } from '@sanity/client';

// 禁用 Vercel 自动解析 body，保留原始字节用于签名验证
export const config = { api: { bodyParser: false } };

// ── 工具函数 ──────────────────────────────────────────────────────────────────

function verifySignature(rawBody, signatureHeader, secret) {
  if (!secret) return true; // 未配置密钥则跳过验证
  if (!signatureHeader) return false;

  const parts = {};
  for (const seg of signatureHeader.split(',')) {
    const idx = seg.indexOf('=');
    if (idx > 0) parts[seg.slice(0, idx).trim()] = seg.slice(idx + 1).trim();
  }
  const { t, v1 } = parts;
  if (!t || !v1) return false;
  if (Math.abs(Date.now() / 1000 - parseInt(t, 10)) > 300) return false; // 超 5 分钟拒绝

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${t}.${rawBody}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(v1, 'hex'));
  } catch {
    return false;
  }
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const TEXT_FIELDS  = ['name', 'excerpt', 'description', 'applicationScenarios',
                      'packaging', 'skinType', 'oemDesc'];
const ARRAY_FIELDS = ['efficacy'];

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

function serializeIngredientsForHash(list) {
  if (!Array.isArray(list) || list.length === 0) return '';
  return list
    .map((ing) => {
      const n = String(ing?.name ?? '').trim();
      const d = String(ing?.description ?? ing?.desc ?? '').trim();
      return `${n}::${d}`;
    })
    .join('¶');
}

/** Portable Text block[] → 纯文本（双换行分段） */
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

function computeContentHash(doc) {
  const parts = [
    ...TEXT_FIELDS.map(f => doc[f] || ''),
    ...ARRAY_FIELDS.map(f => (doc[f] || []).join('‖')),
    serializeSpecs(doc.specifications),
    portableBlocksToPlain(doc.body),
    serializeIngredientsForHash(doc.ingredients),
  ].join('|');
  return crypto.createHash('md5').update(parts).digest('hex');
}

function computeProductCategoryTitleHash(doc) {
  return crypto.createHash('md5').update(String(doc.title || '').trim()).digest('hex');
}

const MYMEMORY_MAX_CHARS = 500;

async function translateChunk(text, from, to) {
  const emailParam = process.env.MYMEMORY_EMAIL
    ? `&de=${encodeURIComponent(process.env.MYMEMORY_EMAIL)}`
    : '';
  const url =
    `https://api.mymemory.translated.net/get` +
    `?q=${encodeURIComponent(text)}&langpair=${from}|${to}${emailParam}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = await res.json();
  if (data.responseStatus !== 200) throw new Error(`MyMemory: ${data.responseDetails}`);
  return data.responseData.translatedText;
}

async function translateText(text, from, to) {
  if (!text || !text.trim()) return '';
  if (text.length <= MYMEMORY_MAX_CHARS) return translateChunk(text, from, to);

  const sentences = text.split(/(?<=[。！？.!?])\s*/);
  const chunks = [];
  let buf = '';
  for (const s of sentences) {
    if (buf.length + s.length > MYMEMORY_MAX_CHARS) { if (buf) chunks.push(buf); buf = s; }
    else buf += (buf ? ' ' : '') + s;
  }
  if (buf) chunks.push(buf);
  const translated = await Promise.all(chunks.map(c => translateChunk(c, from, to)));
  return translated.join(' ');
}

async function translateArray(arr, from, to) {
  if (!arr || arr.length === 0) return [];
  return Promise.all(arr.map(item => translateText(String(item), from, to)));
}

function createWriteClient() {
  return createClient({
    projectId: process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
    token: process.env.SANITY_API_WRITE_TOKEN,
    apiVersion: '2024-01-01',
    useCdn: false,
  });
}

// ── 主处理逻辑 ────────────────────────────────────────────────────────────────

async function processProduct(doc) {
  const { _id, _type } = doc;
  if (_type !== 'product') return;

  const currentHash = computeContentHash(doc);
  if (doc.translationSourceHash === currentHash) {
    console.log(`[translate] ${_id} skipped — already translated`);
    return;
  }

  const client = createWriteClient();

  console.log(`[translate] ${_id} translating…`);
  const patch = { translationSourceHash: currentHash };

  for (const field of TEXT_FIELDS) {
    const val = doc[field];
    if (!val) continue;
    const [en, es] = await Promise.all([
      translateText(val, 'zh-CN', 'en'),
      translateText(val, 'zh-CN', 'es'),
    ]);
    patch[`${field}_en`] = en;
    patch[`${field}_es`] = es;
  }

  for (const field of ARRAY_FIELDS) {
    const arr = doc[field];
    if (!arr || arr.length === 0) continue;
    const [en, es] = await Promise.all([
      translateArray(arr, 'zh-CN', 'en'),
      translateArray(arr, 'zh-CN', 'es'),
    ]);
    patch[`${field}_en`] = en;
    patch[`${field}_es`] = es;
  }

  const bodyPlain = portableBlocksToPlain(doc.body);
  if (bodyPlain) {
    const [bodyPlain_en, bodyPlain_es] = await Promise.all([
      translateText(bodyPlain, 'zh-CN', 'en'),
      translateText(bodyPlain, 'zh-CN', 'es'),
    ]);
    patch.bodyPlain_en = bodyPlain_en;
    patch.bodyPlain_es = bodyPlain_es;
  }

  if (Array.isArray(doc.specifications) && doc.specifications.length > 0) {
    const rows = [];
    for (const row of doc.specifications) {
      const label = row?.label ? String(row.label) : '';
      const value = row?.value ? String(row.value) : '';
      const [label_en, label_es, value_en, value_es] = await Promise.all([
        translateText(label, 'zh-CN', 'en'),
        translateText(label, 'zh-CN', 'es'),
        translateText(value, 'zh-CN', 'en'),
        translateText(value, 'zh-CN', 'es'),
      ]);
      rows.push({ ...row, label_en, label_es, value_en, value_es });
    }
    patch.specifications = rows;
  }

  if (Array.isArray(doc.ingredients) && doc.ingredients.length > 0) {
    const rows = [];
    for (const ing of doc.ingredients) {
      const name = String(ing?.name ?? '').trim();
      const desc = String(ing?.description ?? '').trim();
      const row = { ...ing };
      if (name) {
        const [en, es, pt, ar, ru] = await Promise.all([
          translateText(name, 'zh-CN', 'en'),
          translateText(name, 'zh-CN', 'es'),
          translateText(name, 'zh-CN', 'pt'),
          translateText(name, 'zh-CN', 'ar'),
          translateText(name, 'zh-CN', 'ru'),
        ]);
        row.name_en = en;
        row.name_es = es;
        row.name_pt = pt;
        row.name_ar = ar;
        row.name_ru = ru;
      }
      if (desc) {
        const [en, es, pt, ar, ru] = await Promise.all([
          translateText(desc, 'zh-CN', 'en'),
          translateText(desc, 'zh-CN', 'es'),
          translateText(desc, 'zh-CN', 'pt'),
          translateText(desc, 'zh-CN', 'ar'),
          translateText(desc, 'zh-CN', 'ru'),
        ]);
        row.description_en = en;
        row.description_es = es;
        row.description_pt = pt;
        row.description_ar = ar;
        row.description_ru = ru;
      }
      rows.push(row);
    }
    patch.ingredients = rows;
  }

  await client.patch(_id).set(patch).commit();
  console.log(`[translate] ${_id} done`);
}

async function processProductCategory(doc) {
  const { _id, _type } = doc;
  if (_type !== 'productCategory') return;

  const title = String(doc.title || '').trim();
  if (!title) {
    console.log(`[translate] productCategory ${_id} skipped — empty title`);
    return;
  }

  const currentHash = computeProductCategoryTitleHash(doc);
  if (doc.translationSourceHash === currentHash) {
    console.log(`[translate] productCategory ${_id} skipped — already translated`);
    return;
  }

  const client = createWriteClient();

  console.log(`[translate] productCategory ${_id} translating title…`);
  const [titleEn, titleEs] = await Promise.all([
    translateText(title, 'zh-CN', 'en'),
    translateText(title, 'zh-CN', 'es'),
  ]);

  await client
    .patch(_id)
    .set({
      titleEn,
      titleEs,
      translationSourceHash: currentHash,
    })
    .commit();
  console.log(`[translate] productCategory ${_id} done`);
}

async function processPost(doc) {
  const { _id, _type } = doc;
  if (_type !== 'post') return;

  const title = String(doc.title || '').trim();
  const summary = String(doc.summary || '').trim();
  const faqKey = serializeRelatedFaqsForHash(doc.relatedFaqs);
  const hasFaqs = Array.isArray(doc.relatedFaqs) && doc.relatedFaqs.length > 0;
  const bodyPlain =
    portableBlocksToPlain(doc.body) || String(doc.plainBody || '').trim();
  const hasBody = Boolean(bodyPlain);

  if (!title && !summary && !hasFaqs && !hasBody) {
    console.log(`[translate] post ${_id} skipped — empty content`);
    return;
  }

  const currentHash = crypto
    .createHash('md5')
    .update([title, summary, faqKey, bodyPlain].join('|'))
    .digest('hex');

  if (doc.translationSourceHash === currentHash) {
    console.log(`[translate] post ${_id} skipped — already translated`);
    return;
  }

  const client = createWriteClient();
  console.log(`[translate] post ${_id} translating…`);
  const patch = { translationSourceHash: currentHash };

  if (title) {
    const [title_en, title_es] = await Promise.all([
      translateText(title, 'zh-CN', 'en'),
      translateText(title, 'zh-CN', 'es'),
    ]);
    patch.title_en = title_en;
    patch.title_es = title_es;
  }
  if (summary) {
    const [summary_en, summary_es] = await Promise.all([
      translateText(summary, 'zh-CN', 'en'),
      translateText(summary, 'zh-CN', 'es'),
    ]);
    patch.summary_en = summary_en;
    patch.summary_es = summary_es;
  }
  if (hasBody) {
    const [bodyPlain_en, bodyPlain_es] = await Promise.all([
      translateText(bodyPlain, 'zh-CN', 'en'),
      translateText(bodyPlain, 'zh-CN', 'es'),
    ]);
    patch.bodyPlain_en = bodyPlain_en;
    patch.bodyPlain_es = bodyPlain_es;
  }
  if (hasFaqs) {
    const rows = [];
    for (const item of doc.relatedFaqs) {
      const q = String(item.question || '').trim();
      const a = String(item.answer || '').trim();
      const row = { ...item };
      if (q) {
        const [question_en, question_es] = await Promise.all([
          translateText(q, 'zh-CN', 'en'),
          translateText(q, 'zh-CN', 'es'),
        ]);
        row.question_en = question_en;
        row.question_es = question_es;
      }
      if (a) {
        const [answer_en, answer_es] = await Promise.all([
          translateText(a, 'zh-CN', 'en'),
          translateText(a, 'zh-CN', 'es'),
        ]);
        row.answer_en = answer_en;
        row.answer_es = answer_es;
      }
      rows.push(row);
    }
    patch.relatedFaqs = rows;
  }

  await client.patch(_id).set(patch).commit();
  console.log(`[translate] post ${_id} done`);
}

async function processFaq(doc) {
  const { _id, _type } = doc;
  if (_type !== 'faq') return;

  const question = String(doc.question || '').trim();
  const answer = String(doc.answer || '').trim();
  if (!question && !answer) {
    console.log(`[translate] faq ${_id} skipped — empty`);
    return;
  }

  const currentHash = crypto
    .createHash('md5')
    .update([question, answer].join('|'))
    .digest('hex');

  if (doc.translationSourceHash === currentHash) {
    console.log(`[translate] faq ${_id} skipped — already translated`);
    return;
  }

  const client = createWriteClient();
  const patch = { translationSourceHash: currentHash };
  if (question) {
    const [question_en, question_es] = await Promise.all([
      translateText(question, 'zh-CN', 'en'),
      translateText(question, 'zh-CN', 'es'),
    ]);
    patch.question_en = question_en;
    patch.question_es = question_es;
  }
  if (answer) {
    const [answer_en, answer_es] = await Promise.all([
      translateText(answer, 'zh-CN', 'en'),
      translateText(answer, 'zh-CN', 'es'),
    ]);
    patch.answer_en = answer_en;
    patch.answer_es = answer_es;
  }

  await client.patch(_id).set(patch).commit();
  console.log(`[translate] faq ${_id} done`);
}

async function processCaseStudy(doc) {
  const { _id, _type } = doc;
  if (_type !== 'caseStudy') return;

  const title = String(doc.title || '').trim();
  const excerpt = String(doc.excerpt || '').trim();
  const bodyPlain = portableBlocksToPlain(doc.body);
  if (!title && !excerpt && !bodyPlain) {
    console.log(`[translate] caseStudy ${_id} skipped — empty`);
    return;
  }

  const currentHash = crypto
    .createHash('md5')
    .update([title, excerpt, bodyPlain].join('|'))
    .digest('hex');

  if (doc.translationSourceHash === currentHash) {
    console.log(`[translate] caseStudy ${_id} skipped — already translated`);
    return;
  }

  const client = createWriteClient();
  const patch = { translationSourceHash: currentHash };

  if (title) {
    const [title_en, title_es] = await Promise.all([
      translateText(title, 'zh-CN', 'en'),
      translateText(title, 'zh-CN', 'es'),
    ]);
    patch.title_en = title_en;
    patch.title_es = title_es;
  }
  if (excerpt) {
    const [excerpt_en, excerpt_es] = await Promise.all([
      translateText(excerpt, 'zh-CN', 'en'),
      translateText(excerpt, 'zh-CN', 'es'),
    ]);
    patch.excerpt_en = excerpt_en;
    patch.excerpt_es = excerpt_es;
  }
  if (bodyPlain) {
    const [bodyPlain_en, bodyPlain_es] = await Promise.all([
      translateText(bodyPlain, 'zh-CN', 'en'),
      translateText(bodyPlain, 'zh-CN', 'es'),
    ]);
    patch.bodyPlain_en = bodyPlain_en;
    patch.bodyPlain_es = bodyPlain_es;
  }

  await client.patch(_id).set(patch).commit();
  console.log(`[translate] caseStudy ${_id} done`);
}

function routeTranslation(doc) {
  if (doc._type === 'product') return processProduct(doc);
  if (doc._type === 'productCategory') return processProductCategory(doc);
  if (doc._type === 'post') return processPost(doc);
  if (doc._type === 'faq') return processFaq(doc);
  if (doc._type === 'caseStudy') return processCaseStudy(doc);
  return Promise.resolve();
}

// ── Vercel Handler ────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const rawBody = await readRawBody(req);
  const sigHeader = req.headers['sanity-webhook-signature'] || '';

  if (!verifySignature(rawBody, sigHeader, process.env.SANITY_WEBHOOK_SECRET)) {
    return res.status(401).end('Unauthorized');
  }

  let doc;
  try {
    doc = JSON.parse(rawBody);
  } catch {
    return res.status(400).end('Invalid JSON');
  }

  // 立即返回 200（Sanity webhook 超时约 10s），翻译异步执行
  res.status(200).json({ received: true, _id: doc._id });

  routeTranslation(doc).catch(err => {
    console.error(`[translate] error for ${doc._id}:`, err.message);
  });
}
