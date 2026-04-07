import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import PathParser from './PathParser.jsx';
import SanityReadExample from './dev/SanityReadExample.jsx';

const app = (
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {import.meta.env.DEV ? (
          <Route path="/dev/sanity" element={<SanityReadExample />} />
        ) : null}
        <Route path="*" element={<PathParser />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

const el = document.getElementById('root');
/** 仅当存在 SSR 注入的真实 DOM 节点时才 hydrate（忽略空白/注释，避免误 hydrate 导致白屏） */
const hasSsrMarkup = el?.childNodes
  ? Array.from(el.childNodes).some((n) => n.nodeType === Node.ELEMENT_NODE)
  : false;
if (hasSsrMarkup) {
  hydrateRoot(el, app);
} else {
  createRoot(el).render(app);
}
