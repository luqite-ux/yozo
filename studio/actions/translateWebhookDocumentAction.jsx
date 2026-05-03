/**
 * 将当前文档 POST 到翻译 Webhook（与 webhook/server.js routeTranslation 对齐）。
 * 支持：product、productCategory、post、faq、caseStudy、servicePage、simplePage。
 *
 * 本地默认 http://127.0.0.1:3001/webhook/translate；生产在 studio/.env 设置 SANITY_STUDIO_TRANSLATION_WEBHOOK_URL。
 * 若 webhook 启用了 SANITY_WEBHOOK_SECRET：在 webhook 与 studio 的 .env 中配置相同的 SANITY_STUDIO_TRANSLATE_BYPASS_KEY，
 * 本操作会带请求头 X-Studio-Translate-Bypass；或本地留空 SANITY_WEBHOOK_SECRET。
 */
import {
  postDocumentToTranslationWebhook,
  translationWebhookUrl,
} from '../lib/translationWebhook.js';

const SUPPORTED_SCHEMA_TYPES = new Set([
  'product',
  'productCategory',
  'post',
  'faq',
  'caseStudy',
  'servicePage',
  'simplePage',
]);

/**
 * @param {import('sanity').DocumentActionProps & { getClient?: (opts: { apiVersion: string }) => import('@sanity/client').SanityClient} props
 * `getClient` 由 sanity.config.js 的 document.actions(prev, context) 从 `context.getClient` 注入（官方 DocumentActionProps 不含此项）。
 */
export default function TranslateWebhookDocumentAction(props) {
  const { draft, published, type, onComplete, getClient } = props;

  if (!SUPPORTED_SCHEMA_TYPES.has(type)) return null;

  const doc = published || draft;
  const url = translationWebhookUrl();
  if (!url) {
    return {
      label: '同步翻译（未配置 Webhook）',
      disabled: true,
      title:
        '请在 studio/.env 设置 SANITY_STUDIO_TRANSLATION_WEBHOOK_URL，或在本地启动 webhook（npm run dev --prefix webhook，默认 3001）',
    };
  }

  return {
    label: '同步翻译多语言',
    tone: 'positive',
    title:
      '手动触发：把当前文档 POST 到你部署的翻译 Webhook，由服务端调用 DeepSeek 写入各语言只读字段。' +
      ' 发布时也会自动触发一次；此按钮用于「只改了草稿未发布」「发布后想立刻重译」「Webhook 当时失败」等场景。' +
      ' 需本机或线上已启动 webhook（DEEPSEEK_API_KEY + Sanity 写 Token）。',
    onHandle: async () => {
      if (typeof getClient !== 'function') {
        window.alert('无法获取 Sanity 客户端（getClient）。请确认 sanity.config.js 已从 document.actions 的 context 注入 getClient。');
        return;
      }
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
      try {
        await postDocumentToTranslationWebhook(full);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        window.alert(`翻译请求失败：${msg.slice(0, 500)}`);
        return;
      }
      window.alert('翻译任务已提交。数秒后请刷新或重新打开文档，查看「翻译（自动）」分组与各语言字段。');
      onComplete();
    },
  };
}
