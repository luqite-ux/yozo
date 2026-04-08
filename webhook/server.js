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

/** Portable Text block[] → 纯文本（双换行分段），用于翻译产品详情正文 */
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

function computeContentHash(doc) {
  const parts = [
    ...TEXT_FIELDS.map(f => doc[f] || ''),
    ...ARRAY_FIELDS.map(f => (doc[f] || []).join('‖')),
    serializeSpecs(doc.specifications),
    portableBlocksToPlain(doc.body),
  ].join('|');
  return crypto.createHash('md5').update(parts).digest('hex');
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

  const TARGET_LANGS = ['en', 'es', 'pt', 'ar', 'ru'];

  // 文本字段
  for (const field of TEXT_FIELDS) {
    const val = doc[field];
    if (!val) continue;
    console.log(`  ${field} → ${TARGET_LANGS.join('/')}`);
    const results = await Promise.all(
      TARGET_LANGS.map((lang) => translateText(val, 'zh-CN', lang)),
    );
    TARGET_LANGS.forEach((lang, i) => { patch[`${field}_${lang}`] = results[i]; });
  }

  // 数组字段
  for (const field of ARRAY_FIELDS) {
    const arr = doc[field];
    if (!arr || arr.length === 0) continue;
    console.log(`  ${field}[] → ${TARGET_LANGS.join('/')}`);
    const results = await Promise.all(
      TARGET_LANGS.map((lang) => translateArray(arr, 'zh-CN', lang)),
    );
    TARGET_LANGS.forEach((lang, i) => { patch[`${field}_${lang}`] = results[i]; });
  }

  // 参数/规格：逐行翻译 label/value，写回 label_en/value_en/label_es/value_es
  const bodyPlain = portableBlocksToPlain(doc.body);
  if (bodyPlain) {
    console.log(`  body (plain) → ${TARGET_LANGS.join('/')}`);
    const results = await Promise.all(
      TARGET_LANGS.map((l) => translateText(bodyPlain, 'zh-CN', l)),
    );
    TARGET_LANGS.forEach((l, i) => { patch[`bodyPlain_${l}`] = results[i]; });
  }

  if (Array.isArray(doc.specifications) && doc.specifications.length > 0) {
    console.log(`  specifications[] → ${TARGET_LANGS.join('/')}`);
    const rows = [];
    for (const row of doc.specifications) {
      const label = row?.label ? String(row.label) : '';
      const value = row?.value ? String(row.value) : '';
      const newRow = { ...row };
      const labResults = await Promise.all(TARGET_LANGS.map((l) => translateText(label, 'zh-CN', l)));
      const valResults = await Promise.all(TARGET_LANGS.map((l) => translateText(value, 'zh-CN', l)));
      TARGET_LANGS.forEach((l, i) => { newRow[`label_${l}`] = labResults[i]; newRow[`value_${l}`] = valResults[i]; });
      rows.push(newRow);
    }
    patch.specifications = rows;
  }

  if (Array.isArray(doc.ingredients) && doc.ingredients.length > 0) {
    console.log(`  ingredients[] → ${TARGET_LANGS.join('/')}`);
    const ingRows = [];
    for (const ing of doc.ingredients) {
      const name = ing?.name ? String(ing.name) : '';
      const desc = ing?.description ? String(ing.description) : '';
      const newIng = { ...ing };
      const nameResults = await Promise.all(TARGET_LANGS.map((l) => translateText(name, 'zh-CN', l)));
      const descResults = await Promise.all(TARGET_LANGS.map((l) => translateText(desc, 'zh-CN', l)));
      TARGET_LANGS.forEach((l, i) => { newIng[`name_${l}`] = nameResults[i]; newIng[`description_${l}`] = descResults[i]; });
      ingRows.push(newIng);
    }
    patch.ingredients = ingRows;
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
  const langs = ['en', 'es', 'pt', 'ar', 'ru'];
  const results = await Promise.all(langs.map((l) => translateText(title, 'zh-CN', l)));
  const catPatch = { translationSourceHash: currentHash };
  langs.forEach((l, i) => { catPatch[`title${l.charAt(0).toUpperCase()}${l.slice(1)}`] = results[i]; });

  await client.patch(_id).set(catPatch).commit();
  console.log(`[${_id}] Done (productCategory)`);
  return { success: true, _id, type: 'productCategory' };
}

async function processFaq(doc) {
  const { _id, _type } = doc;
  if (_type !== 'faq') return { skipped: true, reason: 'not a faq' };

  const question = String(doc.question || '').trim();
  const answer   = String(doc.answer   || '').trim();
  if (!question && !answer) {
    console.log(`[${_id}] Skipped (faq) — empty question and answer`);
    return { skipped: true, reason: 'empty content' };
  }

  const currentHash = crypto
    .createHash('md5')
    .update([question, answer].join('|'))
    .digest('hex');

  if (doc.translationSourceHash && doc.translationSourceHash === currentHash) {
    console.log(`[${_id}] Skipped (faq) — already translated`);
    return { skipped: true, reason: 'already translated' };
  }

  console.log(`[${_id}] Translating faq…`);
  const patch = { translationSourceHash: currentHash };

  const faqLangs = ['en', 'es', 'pt', 'ar', 'ru'];
  if (question) {
    const results = await Promise.all(faqLangs.map((l) => translateText(question, 'zh-CN', l)));
    faqLangs.forEach((l, i) => { patch[`question_${l}`] = results[i]; });
  }
  if (answer) {
    const results = await Promise.all(faqLangs.map((l) => translateText(answer, 'zh-CN', l)));
    faqLangs.forEach((l, i) => { patch[`answer_${l}`] = results[i]; });
  }

  await client.patch(_id).set(patch).commit();
  console.log(`[${_id}] Done (faq)`);
  return { success: true, _id, type: 'faq' };
}

function detectSourceLang(text) {
  const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  return chinese > text.length * 0.1 ? 'zh-CN' : 'en';
}

async function processPost(doc) {
  const { _id, _type } = doc;
  if (_type !== 'post') return { skipped: true, reason: 'not a post' };

  const title   = String(doc.title   || '').trim();
  const summary = String(doc.summary || '').trim();
  const category = String(doc.category || '').trim();
  const faqKey  = serializeRelatedFaqsForHash(doc.relatedFaqs);
  const hasFaqs = Array.isArray(doc.relatedFaqs) && doc.relatedFaqs.length > 0;
  if (!title && !summary && !hasFaqs) return { skipped: true, reason: 'empty content' };

  const currentHash = crypto.createHash('md5')
    .update([title, summary, category, faqKey].join('|'))
    .digest('hex');

  if (doc.translationSourceHash && doc.translationSourceHash === currentHash) {
    console.log(`[${_id}] Skipped (post) — already translated`);
    return { skipped: true, reason: 'already translated' };
  }

  const srcLang = detectSourceLang(title + summary);
  console.log(`[${_id}] Translating post (source: ${srcLang})…`);
  const patch = { translationSourceHash: currentHash };

  const allLangs = ['zh', 'en', 'es', 'pt', 'ar', 'ru'];
  const targetLangs = allLangs.filter((l) => (srcLang === 'zh-CN' ? l !== 'zh' : l !== 'en'));
  const fromLang = srcLang === 'zh-CN' ? 'zh-CN' : 'en';

  for (const field of ['title', 'summary']) {
    const val = field === 'title' ? title : summary;
    if (!val) continue;
    const results = await Promise.all(
      targetLangs.map((l) => translateText(val, fromLang, l === 'zh' ? 'zh-CN' : l)),
    );
    targetLangs.forEach((l, i) => { patch[`${field}_${l}`] = results[i]; });
  }
  if (category) {
    const catFrom = detectSourceLang(category) === 'zh-CN' ? 'zh-CN' : 'en';
    const catTargets = allLangs.filter((l) => (catFrom === 'zh-CN' ? l !== 'zh' : l !== 'en'));
    const catResults = await Promise.all(
      catTargets.map((l) => translateText(category, catFrom, l === 'zh' ? 'zh-CN' : l)),
    );
    catTargets.forEach((l, i) => { patch[`category_${l}`] = catResults[i]; });
  }

  if (hasFaqs) {
    console.log(`  relatedFaqs[] → translations`);
    const faqTargets = ['en', 'es', 'pt', 'ar', 'ru'];
    const rows = [];
    for (const item of doc.relatedFaqs) {
      const q = String(item.question || '').trim();
      const a = String(item.answer || '').trim();
      const row = { ...item };
      if (q) {
        const qr = await Promise.all(faqTargets.map((l) => translateText(q, 'zh-CN', l)));
        faqTargets.forEach((l, i) => { row[`question_${l}`] = qr[i]; });
      }
      if (a) {
        const ar = await Promise.all(faqTargets.map((l) => translateText(a, 'zh-CN', l)));
        faqTargets.forEach((l, i) => { row[`answer_${l}`] = ar[i]; });
      }
      rows.push(row);
    }
    patch.relatedFaqs = rows;
  }

  await client.patch(_id).set(patch).commit();
  console.log(`[${_id}] Done (post)`);
  return { success: true, _id, type: 'post' };
}

async function routeTranslation(doc) {
  if (doc._type === 'product') return processProduct(doc);
  if (doc._type === 'productCategory') return processProductCategory(doc);
  if (doc._type === 'faq') return processFaq(doc);
  if (doc._type === 'post') return processPost(doc);
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
