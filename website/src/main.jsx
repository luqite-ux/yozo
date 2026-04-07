import { Component, StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import PathParser from './PathParser.jsx';
import SanityReadExample from './dev/SanityReadExample.jsx';

/** 捕获首屏 render 错误，避免静默白屏（内置浏览器里尤其难查） */
class RootErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      const msg = String(this.state.error?.message || this.state.error);
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui,sans-serif', maxWidth: 640 }}>
          <h1 style={{ fontSize: 18, marginBottom: 12 }}>页面加载出错</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#b91c1c', fontSize: 13 }}>{msg}</pre>
          <p style={{ marginTop: 16, color: '#666', fontSize: 13 }}>
            请用系统 Chrome / Edge 打开 http://localhost:5173 并打开开发者工具 (F12) 查看 Console。
            Cursor 内置预览常无法正常运行 Vite 开发页。
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const app = (
  <StrictMode>
    <RootErrorBoundary>
      <BrowserRouter>
        <Routes>
          {import.meta.env.DEV ? (
            <Route path="/dev/sanity" element={<SanityReadExample />} />
          ) : null}
          <Route path="*" element={<PathParser />} />
        </Routes>
      </BrowserRouter>
    </RootErrorBoundary>
  </StrictMode>
);

const el = document.getElementById('root');
/** 1 = ELEMENT_NODE；不用 Node.ELEMENT_NODE 以免极少数运行环境未注入 Node */
const ELEMENT_NODE = 1;
const hasSsrMarkup = el?.childNodes
  ? Array.from(el.childNodes).some((n) => n.nodeType === ELEMENT_NODE)
  : false;
if (hasSsrMarkup) {
  hydrateRoot(el, app);
} else {
  createRoot(el).render(app);
}
