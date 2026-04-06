/**
 * Sanity Webhook Handler — 产品 / 产品分类 自动翻译（ZH → EN / ES）
 *
 * Sanity Webhook GROQ Filter（文档类型名为 productCategory，不是 category）：
 *   _type == "product" || _type == "productCategory"
 *
 * 使用 MyMemory 免费翻译 API，无需付费账号。
 * 通过内容哈希防止翻译循环触发：
 *   - 收到 webhook → 计算源字段 hash
 *   - 若 hash == doc.translationSourceHash → 跳过（已翻译过此版本）
 *   - 否则翻译并回写，同时保存 translationSourceHash
 *
 * 部署：任意支持 Node 18+ 的平台（Railway、Render、Fly.io 等），
 *       或本地 `node server.js` + ngrok 用于测试。
 */

import http from 'http';
import crypto from 'crypto';
import { createClient } from '@sanity/client';

// ── 环境变量 ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const WEBHOOK_SECRET  = process.env.SANITY_WEBHOOK_SECRET;   // Sanity 后台配置时生成
const SANITY_PROJECT_ID = process.env.SANITY_PROJECT_ID;
const SANITY_DATASET    = process.env.SANITY_DATASET || 'production';
const SANITY_TOKEN      = process.env.SANITY_WRITE_TOKEN;
const MYMEMORY_EMAIL    = process.env.MYMEMORY_EMAIL || '';  // 可选，填后每日限额更高

if (!SANITY_PROJECT_ID || !SANITY_TOKEN) {
  console.error('ERROR: SANITY_PROJECT_ID and SANITY_WRITE_TOKEN are required');
  process.exit(1);
}

// ── Sanity 客户端 ────────────────────────────────────────────────────────────
const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset:   SANITY_DATASET,
  token:     SANITY_TOKEN,
  apiVersion: '2024-01-01',
  useCdn:    false,
});

// ── 签名验证 ─────────────────────────────────────────────────────────────────
/**
 * Sanity webhook 签名格式：t=<unix_ts>,v1=<hex_hmac>
 * HMAC = SHA-256( "<timestamp>.<rawBody>", secret )
 */
function verifySignature(rawBody, signatureHeader) {
  if (!WEBHOOK_SECRET) {
    console.warn('WARN: SANITY_WEBHOOK_SECRET not set, skipping signature verification');
    return true;
  }
  if (!signatureHeader) return false;

  const parts = {};
  for (const segment of signatureHeader.split(',')) {
    const [k, v] = segment.split('=');
    if (k && v) parts[k.trim()] = v.trim();
  }
  const { t, v1 } = parts;
  if (!t || !v1) return false;

  // Optional: reject requests older than 5 minutes
  if (Math.abs(Date.now() / 1000 - parseInt(t, 10)) > 300) return false;

  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(`${t}.${rawBody}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(v1, 'hex'),
    );
  } catch {
    return false;
  }
}

// ── 内容哈希（防循环）────────────────────────────────────────────────────────
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

// ── MyMemory 翻译 ─────────────────────────────────────────────────────────────
const MYMEMORY_MAX_CHARS = 500; // 超长文本分段翻译

async function translateChunk(text, from, to) {
  const emailParam = MYMEMORY_EMAIL
    ? `&de=${encodeURIComponent(MYMEMORY_EMAIL)}`
    : '';
  const url =
    `https://api.mymemory.translated.net/get` +
    `?q=${encodeURIComponent(text)}&langpair=${from}|${to}${emailParam}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = await res.json();
  if (data.responseStatus !== 200) {
    throw new Error(`MyMemory error: ${data.responseDetails}`);
  }
  return data.responseData.translatedText;
}

async function translateText(text, from, to) {
  if (!text || !text.trim()) return '';

  // 分段处理超长文本（按句分割，每块 ≤ MYMEMORY_MAX_CHARS）
  if (text.length <= MYMEMORY_MAX_CHARS) {
    return translateChunk(text, from, to);
  }

  const sentences = text.split(/(?<=[。！？.!?])\s*/);
  const chunks = [];
  let buf = '';
  for (const s of sentences) {
    if (buf.length + s.length > MYMEMORY_MAX_CHARS) {
      if (buf) chunks.push(buf);
      buf = s;
    } else {
      buf += (buf ? ' ' : '') + s;
    }
  }
  if (buf) chunks.push(buf);

  const translated = await Promise.all(chunks.map(c => translateChunk(c, from, to)));
  return translated.join(' ');
}

async function translateArray(arr, from, to) {
  if (!arr || arr.length === 0) return [];
  return Promise.all(arr.map(item => translateText(String(item), from, to)));
}

// ── 主翻译逻辑 ────────────────────────────────────────────────────────────────
async function processProduct(doc) {
  const { _id, _type } = doc;
  if (_type !== 'product') return { skipped: true, reason: 'not a product' };

  // 防循环：比较内容哈希
  const currentHash = computeContentHash(doc);
  if (doc.translationSourceHash && doc.translationSourceHash === currentHash) {
    console.log(`[${_id}] Skipped — content unchanged since last translation`);
    return { skipped: true, reason: 'already translated' };
  }

  console.log(`[${_id}] Translating…`);

  const patch = { translationSourceHash: currentHash };

  // 文本字段
  for (const field of TEXT_FIELDS) {
    const val = doc[field];
    if (!val) continue;
    console.log(`  ${field} → en/es`);
    const [en, es] = await Promise.all([
      translateText(val, 'zh-CN', 'en'),
      translateText(val, 'zh-CN', 'es'),
    ]);
    patch[`${field}_en`] = en;
    patch[`${field}_es`] = es;
  }

  // 数组字段
  for (const field of ARRAY_FIELDS) {
    const arr = doc[field];
    if (!arr || arr.length === 0) continue;
    console.log(`  ${field}[] → en/es`);
    const [en, es] = await Promise.all([
      translateArray(arr, 'zh-CN', 'en'),
      translateArray(arr, 'zh-CN', 'es'),
    ]);
    patch[`${field}_en`] = en;
    patch[`${field}_es`] = es;
  }

  await client.patch(_id).set(patch).commit();
  console.log(`[${_id}] Done`);
  return { success: true, _id, fieldsTranslated: Object.keys(patch).filter(k => k !== 'translationSourceHash') };
}

async function processProductCategory(doc) {
  const { _id, _type } = doc;
  if (_type !== 'productCategory') return { skipped: true, reason: 'not a productCategory' };

  const title = String(doc.title || '').trim();
  if (!title) {
    console.log(`[${_id}] Skipped (productCategory) — empty title`);
    return { skipped: true, reason: 'empty title' };
  }

  const currentHash = computeProductCategoryTitleHash(doc);
  if (doc.translationSourceHash && doc.translationSourceHash === currentHash) {
    console.log(`[${_id}] Skipped (productCategory) — already translated`);
    return { skipped: true, reason: 'already translated' };
  }

  console.log(`[${_id}] Translating productCategory title…`);
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
  console.log(`[${_id}] Done (productCategory)`);
  return { success: true, _id, type: 'productCategory' };
}

async function routeTranslation(doc) {
  if (doc._type === 'product') return processProduct(doc);
  if (doc._type === 'productCategory') return processProductCategory(doc);
  return { skipped: true, reason: `unsupported _type: ${doc._type}` };
}

// ── HTTP 服务器 ───────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200).end('OK');
    return;
  }

  if (req.method !== 'POST' || req.url !== '/webhook/translate') {
    res.writeHead(404).end('Not found');
    return;
  }

  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', async () => {
    const rawBody = Buffer.concat(chunks).toString('utf8');
    const sigHeader = req.headers['sanity-webhook-signature'] || '';

    if (!verifySignature(rawBody, sigHeader)) {
      console.warn('Signature verification failed');
      res.writeHead(401).end('Unauthorized');
      return;
    }

    let doc;
    try {
      doc = JSON.parse(rawBody);
    } catch {
      res.writeHead(400).end('Invalid JSON');
      return;
    }

    // 立即返回 200，翻译在后台执行（Sanity webhook 超时约 10s）
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ received: true, _id: doc._id }));

    routeTranslation(doc).catch(err => {
      console.error(`Translation error for ${doc._id}:`, err.message);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Translation webhook server listening on port ${PORT}`);
  console.log(`Endpoint: POST /webhook/translate`);
  if (!WEBHOOK_SECRET) console.warn('WARN: No SANITY_WEBHOOK_SECRET set — running without signature verification');
});
