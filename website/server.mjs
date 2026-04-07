/**
 * Node SSR 开发 / 生产入口。
 *
 * 开发：node server.mjs  （默认端口 5174，先拉 Sanity 再 renderToString）
 * 生产：先 npm run build && npm run build:ssr，再 NODE_ENV=production node server.mjs
 *
 * 纯静态托管仍可只部署 dist/（npm run build），不经本文件。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT) || 5174;

async function createServer() {
  const app = express();
  /** @type {import('vite').ViteDevServer | undefined} */
  let vite;

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      root: __dirname,
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist'), { index: false }));
  }

  app.use('*', async (req, res) => {
    const url = req.originalUrl || '/';

    try {
      const indexPath = isProd
        ? path.resolve(__dirname, 'dist/index.html')
        : path.resolve(__dirname, 'index.html');
      let template = fs.readFileSync(indexPath, 'utf-8');
      let render;
      if (!isProd) {
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render;
      } else {
        render = (await import(path.resolve(__dirname, 'dist-ssr/entry-server.js'))).render;
      }

      const result = await render(url);
      const payloadScript = `<script>window.__CMS_INITIAL__=${result.payloadJson};<\/script>`;
      const html = template
        .replace('<!--cms-payload-->', payloadScript)
        .replace('<div id="root"></div>', `<div id="root">${result.html}</div>`);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      vite?.ssrFixStacktrace?.(e);
      console.error(e);
      res.status(500).set({ 'Content-Type': 'text/plain' }).end(String(e?.stack || e));
    }
  });

  app.listen(port, () => {
    console.log(
      `[SSR] ${isProd ? 'production' : 'dev'}  http://localhost:${port}  （中文 /…，EN /en/…，ES /es/…）`,
    );
  });
}

createServer();
