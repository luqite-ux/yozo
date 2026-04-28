import { useEffect, useMemo, useState } from 'react';
import { useClient } from 'sanity';

const DASHBOARD_QUERY = `{
  "products": count(*[_type == "product" && !(_id in path("drafts.**"))]),
  "posts": count(*[_type == "post" && !(_id in path("drafts.**"))]),
  "cases": count(*[_type == "caseStudy" && !(_id in path("drafts.**"))]),
  "inquiries": count(*[_type == "inquiry" && !(_id in path("drafts.**"))]),
  "newInquiries": count(*[_type == "inquiry" && !(_id in path("drafts.**")) && status == "new"]),
  "inquiryList": *[_type == "inquiry" && !(_id in path("drafts.**"))] | order(submittedAt desc)[0..4]{
    _id, name, email, company, message, status, submittedAt
  }
}`;

const STATUS_META = {
  new: { label: '待处理', color: '#be123c', bg: '#ffe4e6' },
  contacted: { label: '已联系', color: '#1d4ed8', bg: '#dbeafe' },
  closed: { label: '已关闭', color: '#166534', bg: '#dcfce7' },
  done: { label: '已处理', color: '#334155', bg: '#e2e8f0' },
};

function ago(dateStr) {
  if (!dateStr) return '-';
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  return `${d}天前`;
}

const sidebarItems = [
  { key: 'overview', label: '概览中心', target: null },
  { key: 'crm', label: 'CRM 客户', target: 'itemInquiries' },
  { key: 'traffic', label: '流量分析', target: 'itemPosts' },
  { key: 'inquiries', label: '客户询盘', target: 'itemInquiries' },
  { key: 'products', label: '产品库', target: 'itemProducts' },
  { key: 'posts', label: '文章管理', target: 'itemPosts' },
  { key: 'cases', label: '案例管理', target: 'itemCaseStudies' },
  { key: 'media', label: '多媒体', target: 'itemVideos' },
  { key: 'translate', label: '智能翻译', target: 'itemDocPages' },
  { key: 'seo', label: 'SEO 矩阵', target: 'itemSiteSettings' },
];

export function ProDashboardTool() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [data, setData] = useState(null);
  const [activeNav, setActiveNav] = useState('overview');

  useEffect(() => {
    client.fetch(DASHBOARD_QUERY).then((res) => setData(res));
  }, [client]);

  const stats = useMemo(
    () => [
      { label: '产品总数', value: data?.products ?? '-', tone: '#2563eb', change: '+12%' },
      { label: '文章发布', value: data?.posts ?? '-', tone: '#7c3aed', change: '+6%' },
      { label: 'CRM 线索', value: data?.inquiries ?? '-', tone: '#0f766e', change: '+18%' },
      { label: '案例展示', value: data?.cases ?? '-', tone: '#d97706', change: '+3%' },
    ],
    [data],
  );

  const openStructure = (id) => {
    window.location.href = `/structure/${id}`;
  };

  const topCustomers = [
    { name: 'Global Trade Inc.', value: '¥12.5k', level: 'VIP' },
    { name: '艾妆连锁采购部', value: '¥45.0k', level: '核心' },
    { name: '欧洲渠道经理 Leon', value: '¥8.2k', level: '潜在' },
  ];

  const trafficBars = [34, 46, 40, 62, 55, 77, 64, 82, 70, 88, 73, 60];

  const pendingItems = [
    { title: '复核欧洲站重点页翻译', action: 'itemDocPages' },
    { title: 'CRM 核心客户回访', action: 'itemInquiries' },
    { title: '导出本周流量分析周报', action: 'itemPosts' },
  ];

  const nextFeatureCards = [
    { title: '翻译任务中心', desc: '批量翻译、审校和回滚', action: 'itemDocPages' },
    { title: 'SEO 任务矩阵', desc: '关键词优先级和落地页映射', action: 'itemPosts' },
    { title: 'CRM 客户分层', desc: '线索标签、评分和跟进节奏', action: 'itemInquiries' },
  ];

  return (
    <div style={{ background: '#f5f7fb', minHeight: '100vh', padding: 18, color: '#0f172a' }}>
      <div style={{ maxWidth: 1560, margin: '0 auto', display: 'grid', gridTemplateColumns: '238px minmax(900px,1fr)', gap: 16 }}>
        <aside style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 22, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 14px', borderBottom: '1px solid #eef2f7' }}>
            <div style={{ width: 30, height: 30, borderRadius: 10, background: '#2563eb', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800 }}>Y</div>
            <div style={{ fontWeight: 800 }}>YOZO Pro</div>
          </div>
          <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
            {sidebarItems.map((it) => (
              <button
                key={it.key}
                type="button"
                onClick={() => {
                  setActiveNav(it.key);
                  if (it.target) openStructure(it.target);
                }}
                style={{
                  border: 'none',
                  borderRadius: 12,
                  textAlign: 'left',
                  padding: '10px 12px',
                  background: activeNav === it.key ? 'linear-gradient(90deg,#2563eb,#4f46e5)' : 'transparent',
                  color: activeNav === it.key ? '#fff' : '#475569',
                  fontSize: 13,
                  fontWeight: activeNav === it.key ? 700 : 600,
                  cursor: 'pointer',
                }}
              >
                {it.label}
              </button>
            ))}
          </div>
        </aside>

        <section style={{ display: 'grid', gap: 14 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: 380, maxWidth: '60%', borderRadius: 12, background: '#f1f5f9', padding: '9px 12px', color: '#94a3b8', fontSize: 13 }}>
              搜索客户、询盘、内容关键词...
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>系统在线 · 今日新增待处理 {data?.newInquiries ?? 0}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
            <div style={{ background: 'linear-gradient(135deg,#0b122f,#1e3a8a 55%,#4338ca)', borderRadius: 28, padding: 28, color: '#fff', minHeight: 230, position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', opacity: 0.75, textTransform: 'uppercase' }}>
                LIVE TRAFFIC
              </div>
              <div style={{ marginTop: 10, fontSize: 40, fontWeight: 800, lineHeight: 1.2, maxWidth: 700 }}>
                晚上好，您的业务正在稳步增长。
              </div>
              <div style={{ marginTop: 18, height: 72, display: 'flex', alignItems: 'end', gap: 5 }}>
                {trafficBars.map((h, idx) => (
                  <div key={idx} style={{ flex: 1 }}>
                    <div style={{ height: h, borderRadius: 4, background: 'linear-gradient(180deg,#60a5fa,#22d3ee)', opacity: 0.9 }} />
                  </div>
                ))}
              </div>
              <div style={{ position: 'absolute', right: -60, top: -80, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.32), rgba(56,189,248,0))' }} />
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>CRM 重点客户</div>
              <div style={{ marginTop: 10, display: 'grid', gap: 12 }}>
                {topCustomers.map((n) => (
                  <div key={n.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <div>
                      <span style={{ color: '#0f172a', fontWeight: 700 }}>{n.name}</span>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{n.level}</div>
                    </div>
                    <span style={{ color: '#334155', fontWeight: 700 }}>{n.value}</span>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => openStructure('itemInquiries')} style={{ marginTop: 12, width: '100%', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', padding: '9px 0', cursor: 'pointer', fontWeight: 700 }}>
                进入 CRM 系统
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {stats.map((s) => (
              <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>{s.change}</div>
                </div>
                <div style={{ marginTop: 8, fontSize: 34, fontWeight: 800, color: s.tone }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 14 }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20 }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid #eef2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>实时客户询盘</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Inquiry Tracking System</div>
                </div>
                <button type="button" onClick={() => openStructure('itemInquiries')} style={{ border: 'none', background: '#2563eb', color: '#fff', borderRadius: 10, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  批量处理
                </button>
              </div>
              <div style={{ padding: '0 8px 8px' }}>
                {(data?.inquiryList || []).map((item) => {
                  const meta = STATUS_META[item.status] || STATUS_META.done;
                  return (
                    <div key={item._id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 120px 80px', gap: 8, padding: '12px 10px', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name || '未留名'}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.email || '-'}</div>
                      </div>
                      <div style={{ fontSize: 12, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.message || item.company || '咨询详情待补充'}
                      </div>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, color: meta.color, background: meta.bg }}>
                          {meta.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{ago(item.submittedAt)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>AI 智能分析</div>
                <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: '#ecfdf5', color: '#166534', fontSize: 12, lineHeight: 1.6 }}>
                  监测到关键词“Vegan Lip Gloss”搜索热度上升，建议本周增加 2 篇关联内容并补齐 5 语种摘要。
                </div>
                <div style={{ marginTop: 10, padding: 12, borderRadius: 14, background: '#eff6ff', color: '#1e40af', fontSize: 12, lineHeight: 1.6 }}>
                  翻译引擎状态正常，建议今晚同步产品词库并触发一轮批量校验。
                </div>
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button type="button" onClick={() => openStructure('itemPosts')} style={{ border: 'none', background: '#0f172a', color: '#fff', borderRadius: 10, padding: '10px 0', cursor: 'pointer' }}>SEO 审计</button>
                  <button type="button" onClick={() => openStructure('itemDocPages')} style={{ border: 'none', background: '#4f46e5', color: '#fff', borderRadius: 10, padding: '10px 0', cursor: 'pointer' }}>一键翻译</button>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>运营待办</div>
                {pendingItems.map((todo) => (
                  <button
                    key={todo.title}
                    type="button"
                    onClick={() => openStructure(todo.action)}
                    style={{ marginTop: 10, width: '100%', textAlign: 'left', borderRadius: 12, padding: '9px 10px', background: '#f8fafc', fontSize: 12, color: '#334155', fontWeight: 600, border: '1px solid #e2e8f0', cursor: 'pointer' }}
                  >
                    {todo.title}
                  </button>
                ))}
              </div>

              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>功能拓展区</div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
                  以下是按你参考稿补上的扩展模块入口，可继续往下细化业务流程。
                </div>
                {nextFeatureCards.map((card) => (
                  <button
                    key={card.title}
                    type="button"
                    onClick={() => openStructure(card.action)}
                    style={{ marginTop: 10, width: '100%', textAlign: 'left', borderRadius: 12, padding: 10, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{card.title}</div>
                    <div style={{ marginTop: 3, fontSize: 11, color: '#64748b' }}>{card.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
