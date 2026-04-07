/**
 * 提交询盘 → /api/inquiries（开发：Vite 中间件；生产：Vercel Serverless 等）
 * @param {Record<string, unknown>} payload
 */
function humanizeInquiryError(status, rawMessage) {
  const msg = String(rawMessage || '').trim();
  if (status === 400) {
    return msg || 'INQUIRY_ERR_VALIDATION';
  }
  if (status === 405) return 'INQUIRY_ERR_METHOD';
  if (status >= 500) {
    if (/SANITY_API_WRITE_TOKEN|SANITY_PROJECT_ID|misconfigured/i.test(msg)) {
      return 'INQUIRY_ERR_NOT_CONFIGURED';
    }
    return msg || 'INQUIRY_ERR_SERVER';
  }
  return msg || 'INQUIRY_ERR_UNKNOWN';
}

export async function submitInquiry(payload) {
  const res = await fetch('/api/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text?.slice(0, 200) || res.statusText };
  }
  if (!res.ok) {
    const err = new Error(humanizeInquiryError(res.status, data.error));
    err.status = res.status;
    err.raw = data.error;
    throw err;
  }
  return data;
}
