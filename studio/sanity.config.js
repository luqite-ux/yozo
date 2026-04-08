import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { dashboardTool } from '@sanity/dashboard';
import { schemaTypes } from './schemaTypes/index.js';
import { deskStructure } from './deskStructure.js';
import { StudioBrandLogo } from './components/StudioBrandLogo.jsx';
import { STUDIO_PROJECT_ID_FALLBACK } from './sanity.project.constants.js';
import {
  welcomeWidget,
  overviewWidget,
  recentInquiriesWidget,
  recentEditsWidget,
} from './components/dashboard/index.js';

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
  studio: {
    components: {
      logo: StudioBrandLogo,
    },
  },
  plugins: [
    dashboardTool({
      widgets: [
        welcomeWidget(),
        overviewWidget(),
        recentInquiriesWidget(),
        recentEditsWidget(),
      ],
    }),
    structureTool({ structure: deskStructure }),
    visionTool({ defaultApiVersion: '2024-01-01' }),
  ],
  schema: {
    types: schemaTypes,
  },
});
