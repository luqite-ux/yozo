/**
 * 提交询盘 → /api/inquiries（开发：Vite 中间件；生产：Vercel Serverless 等）
 * @param {Record<string, unknown>} payload
 */
function humanizeInquiryError(status, rawMessage) {
  const msg = String(rawMessage || '').trim();
  if (status === 400) {
    return msg || '请检查表单必填项';
  }
  if (status === 405) return '请求方法不正确';
  if (status >= 500) {
    if (/SANITY_API_WRITE_TOKEN|SANITY_PROJECT_ID|misconfigured/i.test(msg)) {
      return '询盘服务未配置或暂时不可用（部署环境需配置 SANITY_API_WRITE_TOKEN 与 SANITY_PROJECT_ID）。请稍后再试或联系管理员。';
    }
    return msg || '服务器错误，请稍后再试';
  }
  return msg || '提交失败，请稍后再试';
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
