import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes/index.js';
import { deskStructure } from './deskStructure.js';
import { StudioBrandLogo } from './components/StudioBrandLogo.jsx';
import { STUDIO_PROJECT_ID_FALLBACK } from './sanity.project.constants.js';
import { proDashboardTool } from './plugins/proDashboardTool.js';
import TranslateWebhookDocumentAction from './actions/translateWebhookDocumentAction.jsx';
import {
  publishedDocumentId,
  triggerTranslateAfterPublish,
} from './lib/translationWebhook.js';

/** 与 Vercel / .env 导入一致：去掉 BOM、首尾空白与成对引号（避免批量导入把引号写进值里） */
function studioEnv(name, fallback = '') {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  return String(raw)
    .replace(/^\uFEFF/, '')
    .replace(/^[\s"'`]+|[\s"'`]+$/g, '')
    .trim();
}

const projectId =
  studioEnv('SANITY_STUDIO_PROJECT_ID') || String(STUDIO_PROJECT_ID_FALLBACK || '').trim();
const dataset = studioEnv('SANITY_STUDIO_DATASET', 'production');
const title = process.env.SANITY_STUDIO_BRAND_TITLE || 'YOZO企业官网后台';

if (!projectId) {
  throw new Error(
    '未配置 projectId：请在环境变量 SANITY_STUDIO_PROJECT_ID、或在 studio/sanity.project.constants.js 的 STUDIO_PROJECT_ID_FALLBACK 中填写（与 manage.sanity.io 一致）。',
  );
}

export default defineConfig({
  name: 'export-enterprise-site-studio',
  title,
  projectId,
  dataset,
  document: {
    actions: (prev, context) => {
      const supported = new Set([
        'product',
        'productCategory',
        'post',
        'faq',
        'caseStudy',
        'servicePage',
        'simplePage',
      ]);
      if (!supported.has(context.schemaType)) return prev;

      /** 包装内置 Publish：发布后异步提交翻译（与「同步翻译多语言」同一 Webhook） */
      const withAutoTranslateOnPublish = prev.map((Action) => {
        if (Action.action !== 'publish') return Action;
        return function PublishWithAutoTranslate(props) {
          const inner = Action(props);
          if (inner == null || typeof inner.onHandle !== 'function') return inner;
          const origOnHandle = inner.onHandle;
          return {
            ...inner,
            onHandle: () => {
              const previousRev = props.published?._rev;
              const publishedId = publishedDocumentId(props.id);
              origOnHandle();
              void triggerTranslateAfterPublish({
                getClient: context.getClient,
                publishedId,
                previousPublishedRev: previousRev,
              }).catch((err) => {
                console.error('[auto-translate]', err);
              });
            },
          };
        };
      });
      /** DocumentAction 组件的 props 不含 getClient，须从 actions 回调的 context 注入 */
      function TranslateWebhookWithClient(props) {
        return TranslateWebhookDocumentAction({
          ...props,
          getClient: context.getClient,
        });
      }
      return [TranslateWebhookWithClient, ...withAutoTranslateOnPublish];
    },
  },
  studio: {
    components: {
      logo: StudioBrandLogo,
    },
  },
  plugins: [
    proDashboardTool(),
    structureTool({ structure: deskStructure }),
    visionTool({ defaultApiVersion: '2024-01-01' }),
  ],
  schema: {
    types: schemaTypes,
  },
});
