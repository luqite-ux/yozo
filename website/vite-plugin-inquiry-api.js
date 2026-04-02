import { createInquiryDocument } from './api/lib/createInquiry.mjs';

function readNodeBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/**
 * 开发环境：POST /api/inquiries（读取根目录 .env 中的 SANITY_*）
 */
export function inquiryApiDevPlugin() {
  return {
    name: 'inquiry-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] || '';
        if (url !== '/api/inquiries') {
          return next();
        }
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = {};
        try {
          const raw = await readNodeBody(req);
          body = raw ? JSON.parse(raw) : {};
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }

        try {
          const out = await createInquiryDocument(body);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(out));
        } catch (e) {
          const code = e.statusCode || 500;
          res.statusCode = code;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e.message || 'Server error' }));
        }
      });
    },
  };
}
