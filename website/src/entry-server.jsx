import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { Route, Routes, StaticRouter } from 'react-router-dom';
import PathParser from './PathParser.jsx';
import { readCmsPayloadFromSanity } from './lib/sanity/read.js';

/**
 * @param {string} url 请求路径含 query（如 /en/products）
 */
export async function render(url) {
  let cms = null;
  try {
    cms = await readCmsPayloadFromSanity();
  } catch (e) {
    console.warn('[SSR] Sanity 拉取失败，将仅做壳渲染:', e?.message || e);
  }

  const payloadJson = cms
    ? JSON.stringify(cms).replace(/</g, '\\u003c')
    : 'null';

  const appHtml = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <Routes>
          <Route path="*" element={<PathParser initialCms={cms} />} />
        </Routes>
      </StaticRouter>
    </StrictMode>,
  );

  return { html: appHtml, payloadJson };
}
