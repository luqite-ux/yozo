/**
 * 与 actions/translateWebhookDocumentAction.jsx、webhook/server.js 对齐的翻译 Webhook 调用。
 */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function translationWebhookUrl() {
  const fromEnv =
    (typeof process !== 'undefined' && process.env?.SANITY_STUDIO_TRANSLATION_WEBHOOK_URL) || '';
  if (fromEnv.trim()) return fromEnv.trim();
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    return 'http://127.0.0.1:3001/webhook/translate';
  }
  return '';
}

export function translateBypassHeaders() {
  const bypassKey =
    (typeof process !== 'undefined' && process.env?.SANITY_STUDIO_TRANSLATE_BYPASS_KEY) || '';
  const headers = { 'Content-Type': 'application/json' };
  if (String(bypassKey).trim()) {
    headers['X-Studio-Translate-Bypass'] = String(bypassKey).trim();
  }
  return headers;
}

/** drafts.xxx → xxx；已是发布 id 则原样返回 */
export function publishedDocumentId(id) {
  if (!id || typeof id !== 'string') return null;
  return id.startsWith('drafts.') ? id.slice('drafts.'.length) : id;
}

/**
 * 等待 Sanity 发布后的已发布文档可见且 _rev 相对发布前发生变化（首次发布 previousRev 为 undefined）。
 */
export async function waitForPublishedRevision(client, publishedId, previousRev, options = {}) {
  const { timeoutMs = 45000, intervalMs = 500 } = options;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const doc = await client.getDocument(publishedId);
    if (doc && doc._rev != null && doc._rev !== previousRev) {
      return doc;
    }
    await sleep(intervalMs);
  }
  return null;
}

export async function postDocumentToTranslationWebhook(fullDoc) {
  const url = translationWebhookUrl();
  if (!url) {
    throw new Error('SANITY_STUDIO_TRANSLATION_WEBHOOK_URL 未配置且非 localhost');
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: translateBypassHeaders(),
    body: JSON.stringify(fullDoc),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`翻译 Webhook ${res.status}: ${text.slice(0, 500)}`);
  }
  return text;
}

/**
 * 发布成功后：拉取最新已发布文档并 POST 到翻译服务（不弹窗；失败仅 console）。
 */
export async function triggerTranslateAfterPublish({
  getClient,
  publishedId,
  previousPublishedRev,
}) {
  if (typeof getClient !== 'function' || !publishedId) return;
  const client = getClient({ apiVersion: '2024-01-01' });
  const doc = await waitForPublishedRevision(client, publishedId, previousPublishedRev);
  if (!doc) {
    console.warn('[auto-translate] 等待已发布版本超时，未提交翻译');
    return;
  }
  await postDocumentToTranslationWebhook(doc);
  console.log('[auto-translate] 已提交翻译任务', doc._type, doc._id);
}
