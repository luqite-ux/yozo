/**
 * 将当前文档 POST 到翻译 Webhook（与 webhook/server.js routeTranslation 对齐）。
 * 支持：product、productCategory、post、faq、caseStudy、servicePage、simplePage。
 *
 * 本地默认 http://127.0.0.1:3000/webhook/translate；生产/Vercel 必须设置公网 HTTPS（浏览器无法访问你电脑上的 localhost）。
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

  /** 须优先草稿：已上架产品再编辑时，最新中文在 draft；用 published 会拉到旧稿导致译文字段与编辑不同步 */
  const docRef = draft || published;
  const url = translationWebhookUrl();
  if (!url) {
    const hostHint =
      typeof window !== 'undefined' && window.location?.hostname
        ? `当前地址：${window.location.hostname}。`
        : '';
    return {
      label: '同步翻译（未启用）',
      disabled: true,
      title:
        `${hostHint}` +
        '未检测到翻译服务 URL：请在 studio/.env 或 studio/.env.local 设置 SANITY_STUDIO_TRANSLATION_WEBHOOK_URL（Vercel 须在项目环境变量中配置并重新部署 Studio）。' +
        ' 本地请先运行 npm run dev --prefix webhook（默认端口 3000；若 webhook 用其它端口请设 SANITY_STUDIO_TRANSLATION_WEBHOOK_URL 或 SANITY_STUDIO_TRANSLATION_WEBHOOK_PORT），GET /health/ready 确认服务已起。' +
        ' 说明：此流程不依赖 sanity.io/manage 里的「API Webhook」；那是可选的云端触发同一 POST 的方式。DeepSeek 仅在 webhook 服务端调用。',
    };
  }

  return {
    label: '同步翻译多语言',
    tone: 'positive',
    onHandle: async () => {
      if (typeof getClient !== 'function') {
        window.alert('无法获取 Sanity 客户端（getClient）。请确认 sanity.config.js 已从 document.actions 的 context 注入 getClient。');
        return;
      }
      const client = getClient({ apiVersion: '2024-01-01' });
      const id = docRef?._id;
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
