import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { isSanityConfigured, readSiteContentBundle } from '../lib/sanity/index.js';

function JsonBlock({ title, data }) {
  return (
    <section className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <h3 className="text-sm font-medium px-4 py-2 bg-gray-50 border-b border-gray-200 text-gray-800">
        {title}
      </h3>
      <pre className="text-xs p-4 overflow-auto max-h-64 text-gray-700 font-mono whitespace-pre-wrap break-all">
        {data === undefined ? '—' : JSON.stringify(data, null, 2)}
      </pre>
    </section>
  );
}

export default function SanityReadExample() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [bundle, setBundle] = useState(null);

  const run = useCallback(async () => {
    setErr(null);
    setBundle(null);
    setLoading(true);
    try {
      const data = await readSiteContentBundle();
      setBundle(data);
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  if (!isSanityConfigured()) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-4">
            未检测到 <code className="font-mono">VITE_SANITY_PROJECT_ID</code>。请将{' '}
            <code className="font-mono">.env.example</code> 复制为 <code className="font-mono">.env</code>{' '}
            并填写 Sanity 项目信息，然后重启 <code className="font-mono">npm run dev</code>。
          </p>
          <Link to="/" className="text-sm text-gray-600 underline">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center gap-4 justify-between">
          <div>
            <h1 className="text-xl font-light text-gray-900 tracking-tight">Sanity 读取示例</h1>
            <p className="text-sm text-gray-500 mt-1">
              开发环境路由：<span className="font-mono">/dev/sanity</span> — 用于验证 client 与 GROQ
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={run}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg bg-gray-900 text-white disabled:opacity-50"
            >
              {loading ? '请求中…' : '拉取完整内容包（含案例、通用页）'}
            </button>
            <Link
              to="/"
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-700"
            >
              首页
            </Link>
          </div>
        </header>

        {err ? (
          <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg p-4 whitespace-pre-wrap">
            {err}
          </div>
        ) : null}

        {bundle ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              条数 — siteSettings: {bundle.siteSettings ? '1' : '0'}，productCategory:{' '}
              {bundle.productCategories?.length ?? 0}，product: {bundle.products?.length ?? 0}，faq:{' '}
              {bundle.faqs?.length ?? 0}，post: {bundle.posts?.length ?? 0}，caseStudy:{' '}
              {bundle.caseStudies?.length ?? 0}，simplePage: {bundle.simplePages?.length ?? 0}
            </p>
            <JsonBlock title="siteSettings" data={bundle.siteSettings} />
            <JsonBlock title="homePage" data={bundle.homePage} />
            <JsonBlock title="productCategory[]" data={bundle.productCategories} />
            <JsonBlock title="product[]" data={bundle.products} />
            <JsonBlock title="faq[]" data={bundle.faqs} />
            <JsonBlock title="post[]" data={bundle.posts} />
            <JsonBlock title="caseStudy[]" data={bundle.caseStudies} />
            <JsonBlock title="simplePage[]" data={bundle.simplePages} />
          </div>
        ) : (
          !loading && (
            <p className="text-sm text-gray-500">点击按钮从 Sanity 拉取数据（需已发布到当前 dataset）。</p>
          )
        )}
      </div>
    </div>
  );
}
