/**
 * Sanity 只读内容连通性自检（CLI，需配置 VITE_SANITY_PROJECT_ID）
 * 用法：在 website 目录下 node scripts/verify-sanity-read.mjs
 * 或仓库根目录：npm run verify:read
 */
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@sanity/client';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, '..');

function parseEnvFile(rel) {
  const p = join(webRoot, rel);
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const env = { ...parseEnvFile('.env'), ...parseEnvFile('.env.local') };
const projectId = env.VITE_SANITY_PROJECT_ID?.trim();
const dataset = env.VITE_SANITY_DATASET?.trim() || 'production';
const apiVersion = env.VITE_SANITY_API_VERSION?.trim() || '2024-01-01';
const token = env.VITE_SANITY_READ_TOKEN?.trim() || undefined;

if (!projectId) {
  console.log('[verify-sanity-read] 跳过：未在 website/.env 或 .env.local 中配置 VITE_SANITY_PROJECT_ID');
  process.exit(0);
}

const client = createClient({ projectId, dataset, apiVersion, useCdn: true, token });

const checks = [
  ['siteSettings', '*[_type == "siteSettings"][0]{ _id, _type, title }'],
  ['homePage', '*[_type == "homePage"][0]{ _id, _type }'],
  ['productCategory', '*[_type == "productCategory"] | order(_updatedAt desc) [0]{ _id, _type, title, "slug": slug.current }'],
  ['product', '*[_type == "product"] | order(_updatedAt desc) [0]{ _id, _type, name, "slug": slug.current }'],
  ['post', '*[_type == "post"] | order(_updatedAt desc) [0]{ _id, _type, title, "slug": slug.current }'],
  ['faq', '*[_type == "faq"] | order(_updatedAt desc) [0]{ _id, _type, question }'],
  [
    'simplePage',
    '*[_type == "simplePage"] | order(_updatedAt desc) [0]{ _id, _type, title, "slug": slug.current, "bannerBgUrl": banner.backgroundImage.asset->url }',
  ],
];

let failed = 0;
for (const [label, q] of checks) {
  try {
    const row = await client.fetch(q);
    if (row === null || row === undefined) {
      console.log(`[verify-sanity-read] ⚠ ${label}: 无已发布文档（可之后在 Studio 创建并发布）`);
    } else {
      console.log(`[verify-sanity-read] ✓ ${label}: ok`, JSON.stringify(row));
    }
  } catch (e) {
    failed += 1;
    console.error(`[verify-sanity-read] ✗ ${label}:`, e.message || e);
  }
}

if (failed) {
  console.error(`[verify-sanity-read] 完成：${failed} 个查询失败（检查 dataset / 是否已发布 / GROQ）`);
  process.exit(1);
}

console.log('[verify-sanity-read] 全部查询执行成功（若无文档则为「无已发布文档」提示）');
