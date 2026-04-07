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
if (el.hasChildNodes()) {
  hydrateRoot(el, app);
} else {
  createRoot(el).render(app);
}
