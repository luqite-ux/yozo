/**
 * Sanity Webhook Handler — 产品 / 产品分类 自动翻译（ZH → EN / ES）
 *
 * Sanity Webhook GROQ Filter（文档类型名为 productCategory，不是 category）：
 *   _type == "product" || _type == "productCategory" || _type == "post" || _type == "faq"
 *
 * 使用 DeepSeek Chat API 进行翻译（需配置 DEEPSEEK_API_KEY）。
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
const SANITY_TOKEN      =
  process.env.SANITY_WRITE_TOKEN ||
  process.env.SANITY_API_WRITE_TOKEN;
const DEEPSEEK_API_KEY  = process.env.DEEPSEEK_API_KEY?.trim() || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com';
const DEEPSEEK_MODEL    = process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat';

if (!SANITY_PROJECT_ID || !SANITY_TOKEN) {
  console.error('ERROR: SANITY_PROJECT_ID and SANITY_WRITE_TOKEN(or SANITY_API_WRITE_TOKEN) are required');
  process.exit(1);
}
if (!DEEPSEEK_API_KEY) {
  console.error('ERROR: DEEPSEEK_API_KEY is required');
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
const ARRAY_FIELDS = ['efficacy', 'tags'];
const PRODUCT_LOCALES = ['en', 'es', 'pt', 'ar', 'ru'];

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
    serializeIngredientsForHash(doc.ingredients),
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

// ── DeepSeek 翻译 ─────────────────────────────────────────────────────────────
const MAX_RETRIES = 5;
const RETRY_BASE_MS = 800;
const MAX_TRANSLATE_CHARS = 1800; // 超长文本分段翻译

function getRetryDelayMs(attempt, retryAfterHeader) {
  const retryAfterSeconds = Number.parseInt(retryAfterHeader || '', 10);
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }
  const exp = RETRY_BASE_MS * (2 ** (attempt - 1));
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
        content: 'You are a professional translator. Translate faithfully and naturally. Return only the translated text.',
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

  // 分段处理超长文本（按句分割，每块 ≤ MAX_TRANSLATE_CHARS）
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

  const translated = await Promise.all(chunks.map(c => translateChunk(c, from, to)));
  return translated.join(' ');
}

async function translateArray(arr, from, to) {
  if (!arr || arr.length === 0) return [];
  return Promise.all(arr.map(item => translateText(String(item), from, to)));
}

async function translateForLocales(text, from, locales) {
  const translated = await Promise.all(locales.map((to) => translateText(text, from, to)));
  return Object.fromEntries(locales.map((loc, i) => [loc, translated[i]]));
}

async function translateArrayForLocales(arr, from, locales) {
  const translated = await Promise.all(locales.map((to) => translateArray(arr, from, to)));
  return Object.fromEntries(locales.map((loc, i) => [loc, translated[i]]));
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
    console.log(`  ${field} → ${PRODUCT_LOCALES.join('/')}`);
    const byLocale = await translateForLocales(val, 'zh-CN', PRODUCT_LOCALES);
    for (const loc of PRODUCT_LOCALES) {
      patch[`${field}_${loc}`] = byLocale[loc];
    }
  }

  // 数组字段
  for (const field of ARRAY_FIELDS) {
    const arr = doc[field];
    if (!arr || arr.length === 0) continue;
    console.log(`  ${field}[] → ${PRODUCT_LOCALES.join('/')}`);
    const byLocale = await translateArrayForLocales(arr, 'zh-CN', PRODUCT_LOCALES);
    for (const loc of PRODUCT_LOCALES) {
      patch[`${field}_${loc}`] = byLocale[loc];
    }
  }

  // 参数/规格：逐行翻译 label/value，写回 label_en/value_en/label_es/value_es
  const bodyPlain = portableBlocksToPlain(doc.body);
  if (bodyPlain) {
    console.log(`  body (plain) → ${PRODUCT_LOCALES.join('/')}`);
    const byLocale = await translateForLocales(bodyPlain, 'zh-CN', PRODUCT_LOCALES);
    for (const loc of PRODUCT_LOCALES) {
      patch[`bodyPlain_${loc}`] = byLocale[loc];
    }
  }

  if (Array.isArray(doc.specifications) && doc.specifications.length > 0) {
    console.log(`  specifications[] → ${PRODUCT_LOCALES.join('/')}`);
    const rows = [];
    for (const row of doc.specifications) {
      const label = row?.label ? String(row.label) : '';
      const value = row?.value ? String(row.value) : '';
      const [labelByLocale, valueByLocale] = await Promise.all([
        translateForLocales(label, 'zh-CN', PRODUCT_LOCALES),
        translateForLocales(value, 'zh-CN', PRODUCT_LOCALES),
      ]);
      rows.push({
        ...row,
        ...Object.fromEntries(PRODUCT_LOCALES.map((loc) => [`label_${loc}`, labelByLocale[loc]])),
        ...Object.fromEntries(PRODUCT_LOCALES.map((loc) => [`value_${loc}`, valueByLocale[loc]])),
      });
    }
    patch.specifications = rows;
  }

  // 成分：逐条翻译（内嵌对象字段）
  if (Array.isArray(doc.ingredients) && doc.ingredients.length > 0) {
    console.log(`  ingredients[] → en/es/pt/ar/ru`);
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
  console.log(`[${_id}] Done`);
  return { success: true, _id, fieldsTranslated: Object.keys(patch).filter(k => k !== 'translationSourceHash') };
}

async function processCaseStudy(doc) {
  const { _id, _type } = doc;
  if (_type !== 'caseStudy') return { skipped: true, reason: 'not a caseStudy' };

  const title = String(doc.title || '').trim();
  const excerpt = String(doc.excerpt || '').trim();
  const bodyPlain = portableBlocksToPlain(doc.body);
  if (!title && !excerpt && !bodyPlain) return { skipped: true, reason: 'empty content' };

  const currentHash = crypto
    .createHash('md5')
    .update([title, excerpt, bodyPlain].join('|'))
    .digest('hex');

  if (doc.translationSourceHash && doc.translationSourceHash === currentHash) {
    console.log(`[${_id}] Skipped (caseStudy) — already translated`);
    return { skipped: true, reason: 'already translated' };
  }

  console.log(`[${_id}] Translating caseStudy…`);
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
  console.log(`[${_id}] Done (caseStudy)`);
  return { success: true, _id, type: 'caseStudy' };
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

  if (question) {
    const byLocale = await translateForLocales(question, 'zh-CN', PRODUCT_LOCALES);
    for (const loc of PRODUCT_LOCALES) {
      patch[`question_${loc}`] = byLocale[loc];
    }
  }
  if (answer) {
    const byLocale = await translateForLocales(answer, 'zh-CN', PRODUCT_LOCALES);
    for (const loc of PRODUCT_LOCALES) {
      patch[`answer_${loc}`] = byLocale[loc];
    }
  }

  await client.patch(_id).set(patch).commit();
  console.log(`[${_id}] Done (faq)`);
  return { success: true, _id, type: 'faq' };
}

async function processPost(doc) {
  const { _id, _type } = doc;
  if (_type !== 'post') return { skipped: true, reason: 'not a post' };

  const title   = String(doc.title   || '').trim();
  const summary = String(doc.summary || '').trim();
  const faqKey  = serializeRelatedFaqsForHash(doc.relatedFaqs);
  const hasFaqs = Array.isArray(doc.relatedFaqs) && doc.relatedFaqs.length > 0;
  const bodyPlain =
    portableBlocksToPlain(doc.body) || String(doc.plainBody || '').trim();
  const hasBody = Boolean(bodyPlain);

  if (!title && !summary && !hasFaqs && !hasBody) {
    return { skipped: true, reason: 'empty content' };
  }

  const currentHash = crypto.createHash('md5')
    .update([title, summary, faqKey, bodyPlain].join('|'))
    .digest('hex');

  const hasMissingPostLocales = () => {
    const requiredTextFields = ['title', 'summary', 'bodyPlain'];
    for (const field of requiredTextFields) {
      const baseValue = String(doc[field] || '').trim();
      if (!baseValue) continue;
      for (const loc of PRODUCT_LOCALES) {
        const translated = String(doc[`${field}_${loc}`] || '').trim();
        if (!translated) return true;
      }
    }
    if (Array.isArray(doc.relatedFaqs) && doc.relatedFaqs.length > 0) {
      for (const item of doc.relatedFaqs) {
        const q = String(item?.question || '').trim();
        const a = String(item?.answer || '').trim();
        for (const loc of PRODUCT_LOCALES) {
          if (q && !String(item?.[`question_${loc}`] || '').trim()) return true;
          if (a && !String(item?.[`answer_${loc}`] || '').trim()) return true;
        }
      }
    }
    return false;
  };

  if (doc.translationSourceHash && doc.translationSourceHash === currentHash && !hasMissingPostLocales()) {
    console.log(`[${_id}] Skipped (post) — already translated`);
    return { skipped: true, reason: 'already translated' };
  }

  console.log(`[${_id}] Translating post…`);
  const patch = { translationSourceHash: currentHash };

  if (title) {
    const byLocale = await translateForLocales(title, 'zh-CN', PRODUCT_LOCALES);
    for (const loc of PRODUCT_LOCALES) patch[`title_${loc}`] = byLocale[loc];
  }
  if (summary) {
    const byLocale = await translateForLocales(summary, 'zh-CN', PRODUCT_LOCALES);
    for (const loc of PRODUCT_LOCALES) patch[`summary_${loc}`] = byLocale[loc];
  }

  if (hasBody) {
    console.log(`  post body (plain) → ${PRODUCT_LOCALES.join('/')}`);
    const byLocale = await translateForLocales(bodyPlain, 'zh-CN', PRODUCT_LOCALES);
    for (const loc of PRODUCT_LOCALES) patch[`bodyPlain_${loc}`] = byLocale[loc];
  }

  if (hasFaqs) {
    console.log(`  relatedFaqs[] → ${PRODUCT_LOCALES.join('/')}`);
    const rows = [];
    for (const item of doc.relatedFaqs) {
      const q = String(item.question || '').trim();
      const a = String(item.answer || '').trim();
      const row = { ...item };
      if (q) {
        const byLocale = await translateForLocales(q, 'zh-CN', PRODUCT_LOCALES);
        for (const loc of PRODUCT_LOCALES) row[`question_${loc}`] = byLocale[loc];
      }
      if (a) {
        const byLocale = await translateForLocales(a, 'zh-CN', PRODUCT_LOCALES);
        for (const loc of PRODUCT_LOCALES) row[`answer_${loc}`] = byLocale[loc];
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
  if (doc._type === 'caseStudy') return processCaseStudy(doc);
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
