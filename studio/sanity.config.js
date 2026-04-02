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
    '未注入 SANITY_STUDIO_PROJECT_ID。Studio 构建只会把「SANITY_STUDIO_」前缀的变量打进页面；' +
      '请勿只配 SANITY_PROJECT_ID / VITE_SANITY_PROJECT_ID（前台用的名对 Studio 无效）。' +
      '本地：studio/.env 里写 SANITY_STUDIO_PROJECT_ID=你的项目 id；' +
      'Vercel：Studio 独立项目 → Settings → Environment Variables → 新增 Name 必须完全一致：SANITY_STUDIO_PROJECT_ID，' +
      'Environments 勾选 Production，保存后对该项目 Redeploy（可勾选 Clear build cache）。',
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
