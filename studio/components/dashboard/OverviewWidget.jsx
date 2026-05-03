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
  "inquiriesNew":   count(*[_type == "inquiry"        && !(_id in path("drafts.**")) && status == "new"]),
  "simplePages":    count(*[_type == "simplePage"     && !(_id in path("drafts.**"))])
}`;

const cards = [
  { key: 'products', label: '产品总数', icon: '📦', color: '#2563eb', structureId: 'itemProductCenter' },
  { key: 'posts', label: '资讯文章', icon: '📝', color: '#7c3aed', structureId: 'itemNewsPosts' },
  { key: 'cases', label: '案例展示', icon: '💼', color: '#f59e0b', structureId: 'itemCaseStudies' },
  { key: 'inquiriesTotal', label: 'CRM 询盘', icon: '📬', color: '#0f766e', structureId: 'itemInquiries' },
  { key: 'categories', label: '产品系列', icon: '🏷️', color: '#4f46e5', structureId: 'itemProductSeries' },
  { key: 'faqs', label: '合作指引', icon: '❓', color: '#0891b2', structureId: 'itemFaqs' },
  { key: 'simplePages', label: '通用页面', icon: '📄', color: '#475569', structureId: 'itemSimplePages' },
  { key: 'inquiriesNew', label: '待处理询盘', icon: '🔔', color: '#dc2626', highlight: true, structureId: 'itemInquiries' },
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
      <div style={{ padding: '16px 20px 20px', background: '#f8fafc' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#999', fontSize: 14 }}>
            加载中…
          </div>
        ) : (
          <>
            <div style={{
              borderRadius: 18,
              background: 'linear-gradient(140deg, #0f172a, #1d4ed8)',
              color: '#fff',
              padding: '20px 22px',
              marginBottom: 14,
            }}>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700 }}>
                Live Snapshot
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.35, marginBottom: 10 }}>
                后台数据状态正常，核心业务模块可直接进入编辑。
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['产品维护', '内容更新', '询盘跟进', 'SEO 运营'].map((pill) => (
                  <span key={pill} style={{
                    fontSize: 11,
                    fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.28)',
                    borderRadius: 999,
                    padding: '4px 9px',
                    background: 'rgba(255,255,255,0.08)',
                  }}>
                    {pill}
                  </span>
                ))}
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: 12,
            }}>
              {cards.map((c) => (
                <div
                  key={c.key}
                  onClick={() => navigateTo(c.structureId)}
                  style={{
                    background: c.highlight && stats?.[c.key] > 0
                      ? 'linear-gradient(135deg, #fef2f2, #fee2e2)'
                      : '#ffffff',
                    borderRadius: 16,
                    padding: '14px 14px 12px',
                    border: c.highlight && stats?.[c.key] > 0
                      ? '1px solid #fecaca'
                      : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s, transform 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(15,23,42,0.08)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 20 }}>{c.icon}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.08em' }}>CLICK</div>
                  </div>
                  <div style={{
                    fontSize: 30,
                    fontWeight: 800,
                    color: c.highlight && stats?.[c.key] > 0 ? c.color : '#0f172a',
                    lineHeight: 1.08,
                    margin: '10px 0 4px',
                  }}>
                    {stats?.[c.key] ?? '—'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', letterSpacing: '0.02em', fontWeight: 600 }}>
                    {c.label}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={load}
            style={{
              display: 'block',
              margin: '14px auto 0',
              background: '#fff',
              border: '1px solid #cbd5e1',
              borderRadius: 999,
              padding: '7px 18px',
              fontSize: 12,
              fontWeight: 700,
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            ↻ 刷新数据
          </button>
        </div>
      </div>
    </DashboardWidgetContainer>
  );
}
