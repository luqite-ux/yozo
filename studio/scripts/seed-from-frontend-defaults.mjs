/**
 * 将 website/src/App.jsx 中与「无 CMS 数据」时一致的展示默认值，写入 Sanity：
 * - siteSettings（单例 _id siteSettings）
 * - homePage（单例 _id homePage）
 *
 * 需具备写权限 Token（与 website 询盘 API 相同）：
 *   SANITY_API_WRITE_TOKEN（推荐，见 website/.env.example）
 *   或 SANITY_AUTH_TOKEN
 *
 * 用法（在 studio 目录）：
 *   npm run seed:defaults
 *
 * 若未配置 Token，可使用仓库内 NDJSON + Sanity CLI 导入（见 studio/seed/README.txt）。
 */
import { createClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSeedDocuments } from '../seed/content.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const studioRoot = join(__dirname, '..');
const websiteRoot = join(studioRoot, '..', 'website');

function parseEnvFile(dir, fname) {
  const p = join(dir, fname);
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[k] = v;
  }
  return out;
}

function loadAllEnv() {
  const merged = {};
  // website 优先（询盘 token 通常只配在 website/.env.local）
  for (const dir of [websiteRoot, studioRoot]) {
    Object.assign(merged, parseEnvFile(dir, '.env'));
    Object.assign(merged, parseEnvFile(dir, '.env.local'));
  }
  return merged;
}

const env = { ...process.env, ...loadAllEnv() };
const projectId =
  env.SANITY_STUDIO_PROJECT_ID?.trim() ||
  env.VITE_SANITY_PROJECT_ID?.trim() ||
  env.SANITY_PROJECT_ID?.trim() ||
  '';
const dataset =
  env.SANITY_STUDIO_DATASET?.trim() ||
  env.VITE_SANITY_DATASET?.trim() ||
  env.SANITY_DATASET?.trim() ||
  'production';
const token =
  env.SANITY_API_WRITE_TOKEN?.trim() ||
  env.SANITY_WRITE_TOKEN?.trim() ||
  env.SANITY_AUTH_TOKEN?.trim() ||
  env.SANITY_TOKEN?.trim() ||
  '';

if (!projectId) {
  console.error(
    '缺少 projectId：请在 studio/.env 或 website/.env.local 中设置 VITE_SANITY_PROJECT_ID / SANITY_STUDIO_PROJECT_ID',
  );
  process.exit(1);
}
if (!token) {
  const websiteEnvLocal = resolve(websiteRoot, '.env.local');
  const studioEnvLocal = resolve(studioRoot, '.env.local');
  console.error(
    [
      '缺少写 Token，无法通过 API 写入。',
      '',
      '方式 1（推荐）：在下列任一文件中增加一行（与询盘共用同一 Token，勿加 VITE_ 前缀）：',
      `  SANITY_API_WRITE_TOKEN=sk...`,
      `  - ${websiteEnvLocal}`,
      `  - ${studioEnvLocal}`,
      '  Token 在 https://www.sanity.io/manage → 你的项目 → API → Tokens 创建（需具备写文档权限，如 Editor role）。',
      '',
      '方式 2：不配置 Token，在 studio 目录执行 npx sanity login 后：',
      '  npx sanity dataset import ./seed/initial-content.ndjson production --replace',
      '  （dataset 名按实际修改；说明见 seed/README.txt）',
    ].join('\n'),
  );
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', token, useCdn: false });

const { siteSettingsDoc, homePageDoc, aboutPageDoc } = getSeedDocuments();

async function main() {
  console.log(`[seed] project=${projectId} dataset=${dataset}`);
  const tx = client.transaction();
  tx.createOrReplace(siteSettingsDoc);
  tx.createOrReplace(homePageDoc);
  tx.createOrReplace(aboutPageDoc);
  const res = await tx.commit();
  console.log('[seed] 已写入（或覆盖）siteSettings、homePage、aboutPage 的已发布文档。');
  console.log('[seed] 含：品牌探索四屏文案/图、页脚、导航、首页 Hero 等。请在 Studio 中刷新；无需再点 Publish。');
  if (res?.transactionId) console.log(`[seed] transactionId=${res.transactionId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
