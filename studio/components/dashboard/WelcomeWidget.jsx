import { DashboardWidgetContainer } from '@sanity/dashboard';

export function WelcomeWidget() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好';

  return (
    <DashboardWidgetContainer>
      <div style={{
        padding: '34px 30px',
        background: 'linear-gradient(140deg, #0f172a 0%, #1e293b 58%, #312e81 100%)',
        color: '#fff',
        borderRadius: 0,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>
          YOZO · 企业官网管理后台
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.35, marginBottom: 10, maxWidth: 680 }}>
          {greeting}，今天继续推进内容增长与询盘转化。
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, maxWidth: 780 }}>
          你可以在左侧分组中维护产品、文章、案例和线索；下方卡片会实时展示关键数据、待处理询盘和最近编辑记录。
        </div>
        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 22,
          flexWrap: 'wrap',
        }}>
          {[
            { label: '内容更新', sub: '按周稳定发布' },
            { label: 'CRM 线索', sub: '新询盘优先跟进' },
            { label: 'SEO 运营', sub: '持续优化收录' },
            { label: '多语言', sub: '翻译流程可追踪' },
          ].map((badge) => (
            <div key={badge.label} style={{
              padding: '8px 12px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.95)', letterSpacing: '0.03em' }}>
                {badge.label}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.62)', marginTop: 2 }}>
                {badge.sub}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          position: 'absolute',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.26) 0%, rgba(59,130,246,0) 72%)',
          top: -120,
          right: -60,
        }} />
      </div>
    </DashboardWidgetContainer>
  );
}
