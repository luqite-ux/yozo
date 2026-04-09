import { useEffect, useState } from 'react';
import { useClient } from 'sanity';
import { DashboardWidgetContainer } from '@sanity/dashboard';

const QUERY = `*[_type == "inquiry" && !(_id in path("drafts.**"))]
  | order(submittedAt desc)[0..9]{
    _id, name, phone, email, company, message, status, submittedAt, source
  }`;

const STATUS_MAP = {
  new:       { label: '待处理', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  contacted: { label: '已联系', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  closed:    { label: '已关闭', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  done:      { label: '已处理', bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
};

function Badge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.done;
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 11,
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: 10,
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
}

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

export function RecentInquiriesWidget() {
  const client = useClient({ apiVersion: '2024-01-01' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.fetch(QUERY).then((data) => {
      setItems(data || []);
      setLoading(false);
    });
  }, [client]);

  const openDoc = (id) => {
    window.location.href = `/structure/itemInquiries;${id}`;
  };

  return (
    <DashboardWidgetContainer header="最近询盘 (10条)">
      <div style={{ padding: '4px 0 8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#999', fontSize: 14 }}>
            加载中…
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#bbb', fontSize: 14 }}>
            暂无询盘
          </div>
        ) : (
          <div>
            {items.map((item, idx) => (
              <div
                key={item._id}
                onClick={() => openDoc(item._id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 20px',
                  borderBottom: idx < items.length - 1 ? '1px solid #f3f4f6' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: item.status === 'new' ? '#fef2f2' : '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  flexShrink: 0,
                  marginTop: 2,
                }}>
                  {item.status === 'new' ? '🔴' : '👤'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                      {item.name || '(未留名)'}
                    </span>
                    <Badge status={item.status} />
                    <span style={{ fontSize: 11, color: '#aaa', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                      {timeAgo(item.submittedAt)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>
                    {[item.phone, item.email, item.company].filter(Boolean).join(' · ') || '—'}
                  </div>
                  {item.message && (
                    <div style={{
                      fontSize: 12,
                      color: '#666',
                      lineHeight: 1.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {item.message}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardWidgetContainer>
  );
}
