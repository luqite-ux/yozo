import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes/index.js';
import { deskStructure } from './deskStructure.js';
import { StudioBrandLogo } from './components/StudioBrandLogo.jsx';

/** 与 Vercel / .env 导入一致：去掉 BOM、首尾空白与成对引号（避免批量导入把引号写进值里） */
function studioEnv(name, fallback = '') {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  return String(raw)
    .replace(/^\uFEFF/, '')
    .replace(/^[\s"'`]+|[\s"'`]+$/g, '')
    .trim();
}

const projectId = studioEnv('SANITY_STUDIO_PROJECT_ID');
const dataset = studioEnv('SANITY_STUDIO_DATASET', 'production');
const title =
  process.env.SANITY_STUDIO_BRAND_TITLE || 'Hongchao · 外贸企业官网后台模板';

if (!projectId) {
  throw new Error(
    '未注入 SANITY_STUDIO_PROJECT_ID。Studio 构建只会把「SANITY_STUDIO_」前缀的变量打进页面；' +
      '请勿只配 SANITY_PROJECT_ID / VITE_SANITY_PROJECT_ID（前台用的名对 Studio 无效）。' +
      '本地：studio/.env 里写 SANITY_STUDIO_PROJECT_ID=你的项目 id；' +
      'Vercel：变量必须加在「部署 studio 子域名」的那个项目上；保存后务必对该项目做一次 Production Redeploy（可 Clear build cache），' +
      '否则线上仍是「加变量之前」打出来的旧包。若从 .env 批量导入，请点开变量核对值未带多余引号。',
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
