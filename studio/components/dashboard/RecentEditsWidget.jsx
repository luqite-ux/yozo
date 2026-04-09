import { useEffect, useState } from 'react';
import { useClient } from 'sanity';
import { DashboardWidgetContainer } from '@sanity/dashboard';

const QUERY = `*[_type in ["product","post","caseStudy","faq","simplePage"] && !(_id in path("drafts.**"))]
  | order(_updatedAt desc)[0..7]{
    _id,
    _type,
    _updatedAt,
    "title": coalesce(name, title, question)
  }`;

const TYPE_META = {
  product:    { label: '产品',   icon: '📦', color: '#6366f1' },
  post:       { label: '文章',   icon: '📝', color: '#0ea5e9' },
  caseStudy:  { label: '案例',   icon: '💼', color: '#f59e0b' },
  faq:        { label: 'FAQ',    icon: '❓', color: '#14b8a6' },
  simplePage: { label: '页面',   icon: '📄', color: '#64748b' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

export function RecentEditsWidget() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.fetch(QUERY).then((data) => {
      setItems(data || []);
      setLoading(false);
    });
  }, [client]);

  const TYPE_TO_STRUCTURE = {
    product: 'itemProducts',
    post: 'itemPosts',
    caseStudy: 'itemCaseStudies',
    faq: 'itemFaqs',
    simplePage: 'itemSimplePages',
  };

  const openDoc = (id, type) => {
    const structureId = TYPE_TO_STRUCTURE[type] || 'itemProducts';
    window.location.href = `/structure/${structureId};${id}`;
  };

  return (
    <DashboardWidgetContainer header="最近更新">
      <div style={{ padding: '4px 0 8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#999', fontSize: 14 }}>
            加载中…
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#bbb', fontSize: 14 }}>
            暂无数据
          </div>
        ) : (
          <div>
            {items.map((item, idx) => {
              const meta = TYPE_META[item._type] || { label: item._type, icon: '📁', color: '#999' };
              return (
                <div
                  key={item._id}
                  onClick={() => openDoc(item._id, item._type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 20px',
                    borderBottom: idx < items.length - 1 ? '1px solid #f3f4f6' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{meta.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#111',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.title || '(无标题)'}
                    </div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>
                      <span style={{
                        display: 'inline-block',
                        background: `${meta.color}15`,
                        color: meta.color,
                        fontSize: 10,
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: 4,
                        marginRight: 6,
                      }}>
                        {meta.label}
                      </span>
                      {timeAgo(item._updatedAt)}
                    </div>
                  </div>
                  <span style={{ fontSize: 14, color: '#ccc', flexShrink: 0 }}>›</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardWidgetContainer>
  );
}
