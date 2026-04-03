import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { CmsProvider } from './cms/CmsContext.jsx';
import { LocaleProvider } from './i18n/LocaleContext.jsx';
import App from './App.jsx';
import SanityReadExample from './dev/SanityReadExample.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LocaleProvider>
      <CmsProvider>
        <BrowserRouter>
          <Routes>
            {import.meta.env.DEV ? (
              <Route path="/dev/sanity" element={<SanityReadExample />} />
            ) : null}
            <Route path="/*" element={<App />} />
          </Routes>
        </BrowserRouter>
      </CmsProvider>
    </LocaleProvider>
  </StrictMode>,
);
