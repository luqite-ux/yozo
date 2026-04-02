/**
 * Vercel Serverless：POST /api/inquiries
 * @param {import('@vercel/node').VercelRequest} req
 * @param {import('@vercel/node').VercelResponse} res
 */
import { createInquiryDocument } from './lib/createInquiry.mjs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const out = await createInquiryDocument(body);
    return res.status(200).json(out);
  } catch (e) {
    const code = e.statusCode || 500;
    return res.status(code).json({ error: e.message || 'Server error' });
  }
}
