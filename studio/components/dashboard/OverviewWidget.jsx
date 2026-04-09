import { useEffect, useState, useCallback } from 'react';
import { useClient } from 'sanity';
import { DashboardWidgetContainer } from '@sanity/dashboard';

const STAT_QUERY = `{
  "products":       count(*[_type == "product"       && !(_id in path("drafts.**"))]),
  "categories":     count(*[_type == "productCategory" && !(_id in path("drafts.**"))]),
  "posts":          count(*[_type == "post"           && !(_id in path("drafts.**"))]),
  "faqs":           count(*[_type == "faq"            && !(_id in path("drafts.**"))]),
  "cases":          count(*[_type == "caseStudy"      && !(_id in path("drafts.**"))]),
  "inquiriesTotal": count(*[_type == "inquiry"        && !(_id in path("drafts.**"))]),
  "inquiriesNew":   count(*[_type == "inquiry"        && !(_id in path("drafts.**")) && status == "new"])
}`;

const cards = [
  { key: 'products',       label: '产品',     icon: '📦', color: '#6366f1', structureId: 'itemProducts' },
  { key: 'categories',     label: '分类',     icon: '🏷️', color: '#8b5cf6', structureId: 'itemProductCategories' },
  { key: 'posts',          label: '文章',     icon: '📝', color: '#0ea5e9', structureId: 'itemPosts' },
  { key: 'faqs',           label: 'FAQ',      icon: '❓', color: '#14b8a6', structureId: 'itemFaqs' },
  { key: 'cases',          label: '案例',     icon: '💼', color: '#f59e0b', structureId: 'itemCaseStudies' },
  { key: 'inquiriesTotal', label: '询盘总数',  icon: '📬', color: '#64748b', structureId: 'itemInquiries' },
  { key: 'inquiriesNew',   label: '待处理询盘', icon: '🔔', color: '#ef4444', highlight: true, structureId: 'itemInquiries' },
];

export function OverviewWidget() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    client.fetch(STAT_QUERY).then((data) => {
      setStats(data);
      setLoading(false);
    });
  }, [client]);

  useEffect(() => { load(); }, [load]);

  const navigateTo = (structureId) => {
    if (!structureId) return;
    window.location.href = `/structure/${structureId}`;
  };

  return (
    <DashboardWidgetContainer header="数据总览">
      <div style={{ padding: '16px 20px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#999', fontSize: 14 }}>
            加载中…
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 12,
          }}>
            {cards.map((c) => (
              <div
                key={c.key}
                onClick={() => navigateTo(c.structureId)}
                style={{
                  background: c.highlight && stats?.[c.key] > 0
                    ? 'linear-gradient(135deg, #fef2f2, #fee2e2)'
                    : '#fafafa',
                  borderRadius: 12,
                  padding: '16px 14px',
                  textAlign: 'center',
                  border: c.highlight && stats?.[c.key] > 0
                    ? '1px solid #fecaca'
                    : '1px solid #f0f0f0',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s, transform 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: c.highlight && stats?.[c.key] > 0 ? c.color : '#111',
                  lineHeight: 1.1,
                  marginBottom: 4,
                }}>
                  {stats?.[c.key] ?? '—'}
                </div>
                <div style={{ fontSize: 12, color: '#888', letterSpacing: '0.02em' }}>
                  {c.label}
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={load}
          style={{
            display: 'block',
            margin: '16px auto 0',
            background: 'none',
            border: '1px solid #e5e5e5',
            borderRadius: 6,
            padding: '6px 18px',
            fontSize: 12,
            color: '#666',
            cursor: 'pointer',
          }}
        >
          ↻ 刷新
        </button>
      </div>
    </DashboardWidgetContainer>
  );
}
