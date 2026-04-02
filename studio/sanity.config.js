import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes/index.js';
import { deskStructure } from './deskStructure.js';
import { StudioBrandLogo } from './components/StudioBrandLogo.jsx';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || '';
const dataset = process.env.SANITY_STUDIO_DATASET || 'production';
const title =
  process.env.SANITY_STUDIO_BRAND_TITLE || 'Hongchao · 外贸企业官网后台模板';

export default defineConfig({
  name: 'export-enterprise-site-studio',
  title,
  projectId: projectId || 'missing-project-id',
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
