import { createClient } from '@sanity/client';

/**
 * 服务端写入询盘（需 SANITY_API_WRITE_TOKEN，切勿暴露到浏览器）
 */
export async function createInquiryDocument(body) {
  const projectId = process.env.SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_DATASET || 'production';
  const token = process.env.SANITY_API_WRITE_TOKEN;
  const apiVersion = process.env.SANITY_API_VERSION || '2024-01-01';

  if (!projectId || !token) {
    const err = new Error('Server misconfigured: missing SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN');
    err.statusCode = 500;
    throw err;
  }

  const name = String(body?.name || '').trim();
  const phone = String(body?.phone || '').trim();
  const email = String(body?.email || '').trim();
  if (!name || (!phone && !email)) {
    const err = new Error('请填写姓名，并至少填写电话或邮箱'); // 其一
    err.statusCode = 400;
    throw err;
  }

  const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

  const sourceProductId = body?.sourceProductId ? String(body.sourceProductId).trim() : '';
  const patch = {
    _type: 'inquiry',
    name,
    phone: phone || undefined,
    email: email || undefined,
    company: body?.company?.trim() || undefined,
    whatsapp: body?.whatsapp?.trim() || undefined,
    country: body?.country?.trim() || undefined,
    message: body?.message?.trim() || undefined,
    source: (body?.source && String(body.source).slice(0, 64)) || 'web',
    sourcePath: body?.sourcePath ? String(body.sourcePath).slice(0, 256) : undefined,
    status: 'new',
    isRead: false,
    submittedAt: new Date().toISOString(),
  };
  if (sourceProductId) {
    patch.sourceProduct = { _type: 'reference', _ref: sourceProductId };
  }

  const created = await client.create(patch);

  return { ok: true, id: created._id };
}
