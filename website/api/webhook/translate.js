/**
 * Vercel Serverless Function — 产品 / 产品分类 自动翻译（ZH → EN / ES）
 * 路由：POST /api/webhook/translate
 *
 * Sanity → Webhooks → 本 URL 的 GROQ Filter 请设为（类型名是 productCategory，不是 category）：
 *   _type == "product" || _type == "productCategory"
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

function computeContentHash(doc) {
  const parts = [
    ...TEXT_FIELDS.map(f => doc[f] || ''),
    ...ARRAY_FIELDS.map(f => (doc[f] || []).join('‖')),
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

// ── 主处理逻辑 ────────────────────────────────────────────────────────────────

async function processProduct(doc) {
  const { _id, _type } = doc;
  if (_type !== 'product') return;

  const currentHash = computeContentHash(doc);
  if (doc.translationSourceHash === currentHash) {
    console.log(`[translate] ${_id} skipped — already translated`);
    return;
  }

  const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID,
    dataset:   process.env.SANITY_DATASET || 'production',
    token:     process.env.SANITY_API_WRITE_TOKEN,
    apiVersion: '2024-01-01',
    useCdn:    false,
  });

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

  const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
    token: process.env.SANITY_API_WRITE_TOKEN,
    apiVersion: '2024-01-01',
    useCdn: false,
  });

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

function routeTranslation(doc) {
  if (doc._type === 'product') return processProduct(doc);
  if (doc._type === 'productCategory') return processProductCategory(doc);
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
