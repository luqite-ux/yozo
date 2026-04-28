import { DashboardWidgetContainer } from '@sanity/dashboard';

const quickActions = [
  { label: '新建产品', href: '/structure/itemProducts;create', tone: '#1d4ed8' },
  { label: '发布文章', href: '/structure/itemPosts;create', tone: '#7c3aed' },
  { label: '新增案例', href: '/structure/itemCaseStudies;create', tone: '#f59e0b' },
  { label: '处理询盘', href: '/structure/itemInquiries', tone: '#dc2626' },
];

const todos = [
  '检查欧洲站重点页面翻译',
  '跟进高意向询盘并更新状态',
  '复核本周 SEO 目标关键词',
];

export function OperationsWidget() {
  const jump = (href) => {
    window.location.href = href;
  };

  return (
    <DashboardWidgetContainer header="运营中枢">
      <div style={{ padding: '16px 20px 20px', background: '#f8fafc' }}>
        <div style={{
          borderRadius: 16,
          padding: '14px 14px 10px',
          border: '1px solid #e2e8f0',
          background: '#fff',
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 10 }}>
            快捷操作
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {quickActions.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => jump(item.href)}
                style={{
                  textAlign: 'left',
                  border: '1px solid #e2e8f0',
                  background: '#fff',
                  borderRadius: 12,
                  padding: '10px 10px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#334155',
                }}
              >
                <span style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: item.tone,
                  marginRight: 8,
                }} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          borderRadius: 16,
          padding: '14px',
          border: '1px solid #e2e8f0',
          background: '#fff',
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 8 }}>
            今日待办
          </div>
          {todos.map((todo, idx) => (
            <div key={todo} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: '#475569',
              padding: '6px 0',
              borderBottom: idx < todos.length - 1 ? '1px dashed #e2e8f0' : 'none',
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#22c55e',
              }} />
              <span>{todo}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardWidgetContainer>
  );
}
