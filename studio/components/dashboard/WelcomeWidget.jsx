import { DashboardWidgetContainer } from '@sanity/dashboard';

export function WelcomeWidget() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? '上午好' : hour < 18 ? '下午好' : '晚上好';

  return (
    <DashboardWidgetContainer>
      <div style={{
        padding: '32px 28px',
        background: 'linear-gradient(135deg, #111 0%, #1a1a2e 100%)',
        color: '#fff',
        borderRadius: 0,
      }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
          YOZO · 企业官网管理后台
        </div>
        <div style={{ fontSize: 26, fontWeight: 300, lineHeight: 1.4, marginBottom: 8 }}>
          {greeting}，欢迎回来 👋
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
          在这里管理产品、文章、FAQ 和询盘。左侧面板可直接编辑内容。
        </div>
        <div style={{
          display: 'flex',
          gap: 24,
          marginTop: 24,
          paddingTop: 20,
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          {[
            { label: 'ISO 22716', sub: '国际化妆品 GMP' },
            { label: 'GMPC', sub: '10万级净化车间' },
            { label: 'FDA', sub: '北美合规准入' },
          ].map((badge) => (
            <div key={badge.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>
                {badge.label}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                {badge.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardWidgetContainer>
  );
}
