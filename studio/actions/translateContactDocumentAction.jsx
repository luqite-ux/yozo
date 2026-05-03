/**
 * 全球联络（simplePage#contact）：将当前文档 POST 到翻译 Webhook，按中文主字段写入各语言只读字段。
 * 本地 Webhook 默认 http://127.0.0.1:3001/webhook/translate；生产请在 studio/.env 设置 SANITY_STUDIO_TRANSLATION_WEBHOOK_URL。
 */
function webhookUrl() {
  const fromEnv =
    (typeof process !== 'undefined' && process.env?.SANITY_STUDIO_TRANSLATION_WEBHOOK_URL) || '';
  if (fromEnv.trim()) return fromEnv.trim();
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    return 'http://127.0.0.1:3001/webhook/translate';
  }
  return '';
}

/** @param {import('sanity').DocumentActionProps} props */
export default function TranslateContactDocumentAction(props) {
  const { draft, published, type, onComplete, getClient } = props;

  if (type !== 'simplePage') return null;

  const doc = published || draft;
  const slug = doc?.slug?.current;
  if (slug !== 'contact') return null;

  const url = webhookUrl();
  if (!url) {
    return {
      label: '同步翻译（未配置 Webhook URL）',
      disabled: true,
      title: '请在 studio/.env 中设置 SANITY_STUDIO_TRANSLATION_WEBHOOK_URL，或在本地启动翻译服务（默认 3001 端口）',
    };
  }

  return {
    label: '同步翻译多语言',
    tone: 'positive',
    title: '根据当前中文主字段调用翻译服务，更新 EN/ES/PT/AR/RU 只读字段（需本地或线上 Webhook 与 DEEPSEEK_API_KEY）',
    onHandle: async () => {
      const client = getClient({ apiVersion: '2024-01-01' });
      const id = doc?._id;
      if (!id) {
        window.alert('无法读取文档 ID');
        return;
      }
      const full = await client.getDocument(id);
      if (!full) {
        window.alert('无法从 Sanity 拉取文档');
        return;
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(full),
      });
      const text = await res.text();
      if (!res.ok) {
        window.alert(`翻译请求失败（${res.status}）：${text.slice(0, 500)}`);
        return;
      }
      window.alert('翻译任务已提交。数秒后请点击 Studio 刷新或重新打开文档，即可看到各语言只读字段更新。');
      onComplete();
    },
  };
}
