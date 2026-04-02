import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes/index.js';
import { deskStructure } from './deskStructure.js';
import { StudioBrandLogo } from './components/StudioBrandLogo.jsx';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID?.trim() || '';
const dataset = process.env.SANITY_STUDIO_DATASET?.trim() || 'production';
const title =
  process.env.SANITY_STUDIO_BRAND_TITLE || 'Hongchao · 外贸企业官网后台模板';

if (!projectId) {
  throw new Error(
    '未设置 SANITY_STUDIO_PROJECT_ID。本地：在 studio 目录复制 .env.example 为 .env 并填写；' +
      'Vercel：打开「Studio」对应项目 → Settings → Environment Variables，添加 SANITY_STUDIO_PROJECT_ID（及可选 SANITY_STUDIO_DATASET），' +
      '勾选 Production 后重新 Deploy。',
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
    structureTool({ structure: deskStructure }),
    visionTool({ defaultApiVersion: '2024-01-01' }),
  ],
  schema: {
    types: schemaTypes,
  },
});
