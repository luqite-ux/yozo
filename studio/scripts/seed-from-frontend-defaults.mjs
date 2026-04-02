/**
 * 将 website/src/App.jsx 中与「无 CMS 数据」时一致的展示默认值，写入 Sanity：
 * - siteSettings（单例 _id siteSettings）
 * - homePage（单例 _id homePage）
 *
 * 需具备写权限 Token（与 website 询盘 API 相同）：
 *   SANITY_API_WRITE_TOKEN 或 SANITY_AUTH_TOKEN
 *
 * 用法（在 studio 目录）：
 *   npm run seed:defaults
 */
import { createClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  for (const dir of [studioRoot, websiteRoot]) {
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
const token = env.SANITY_API_WRITE_TOKEN?.trim() || env.SANITY_AUTH_TOKEN?.trim() || '';

if (!projectId) {
  console.error('缺少 projectId：请在 studio/.env 或 website/.env.local 中设置 SANITY_STUDIO_PROJECT_ID 或 VITE_SANITY_PROJECT_ID');
  process.exit(1);
}
if (!token) {
  console.error(
    '缺少写 Token：请设置 SANITY_API_WRITE_TOKEN（与 website 询盘相同，见 website/.env.example），或在终端临时导出后再运行。',
  );
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', token, useCdn: false });

/** 与 App.jsx DEFAULT_MAIN_NAV 一致：path → href */
const mainNavigation = [
  { _type: 'navItem', _key: 'nav-home', label: '首页', href: '/', openInNewTab: false },
  { _type: 'navItem', _key: 'nav-about', label: '品牌探索', href: '/about', openInNewTab: false },
  { _type: 'navItem', _key: 'nav-services', label: '代工方案', href: '/services', openInNewTab: false },
  { _type: 'navItem', _key: 'nav-products', label: '产品中心', href: '/products', openInNewTab: false },
  { _type: 'navItem', _key: 'nav-news', label: '资讯中心', href: '/news', openInNewTab: false },
  { _type: 'navItem', _key: 'nav-faq', label: '合作指引', href: '/faq', openInNewTab: false },
  { _type: 'navItem', _key: 'nav-contact', label: '全球联络', href: '/contact', openInNewTab: false },
];

const siteSettingsDoc = {
  _id: 'siteSettings',
  _type: 'siteSettings',
  title: 'YOZO',
  tagline: '以前沿生物科技，赋能顶尖美妆品牌',
  description:
    '汕头市贞丽芙生物科技有限公司。符合国际 GMPC 及 ISO 22716 标准的高端化妆品代工厂，以生物科技赋能全球顶级美妆生态。',
  localeDefault: 'zh-CN',
  contactPhone: '+86 0754-89920101',
  contactWhatsapp: '+86 13632470463',
  contactEmail: 'yozobeauty@outlook.com',
  address: '中国广东省汕头市龙湖区\n鸥汀街道防汛路31号东侧',
  headerCta: { label: '免费询盘', href: '/contact' },
  mainNavigation,
  footerTagline:
    '汕头市贞丽芙生物科技有限公司。符合国际 GMPC 及 ISO 22716 标准的高端化妆品代工厂，以生物科技赋能全球顶级美妆生态。',
  footerCopyright: `© ${new Date().getFullYear()} 汕头市贞丽芙生物科技有限公司 (YOZO). All rights reserved.`,
  defaultSeo: {
    _type: 'seo',
    seoTitle: 'YOZO · 高端化妆品 OEM/ODM',
    seoDescription:
      '国际标准 OEM/ODM 全链路代工，GMPC & ISO 22716 认证工厂，配方研发至全球交付。',
  },
};

const homePageDoc = {
  _id: 'homePage',
  _type: 'homePage',
  hero: {
    _type: 'heroBanner',
    title: '以前沿生物科技，\n赋能顶尖美妆品牌。',
    subtitle:
      '提供国际标准的 OEM / ODM 全链路代工方案。\n从配方研发到全球出海，为您构筑绝对护城河。',
    trustBadge: 'ISO 22716 & GMPC Certified',
    primaryCtaLabel: '探索代工引擎',
    primaryCtaUrl: '/services',
    secondaryCtaLabel: '索取打样方案',
    secondaryCtaUrl: '/contact',
  },
  faqSectionTitle: '合作答疑指南',
  ctaSection: {
    title: '准备启动下一个爆款？',
    subtitle: '我们的工程师在 24 小时内响应您的初步提案。',
    buttonLabel: '预约技术路演',
    buttonUrl: '/contact',
  },
  seo: {
    _type: 'seo',
    seoTitle: '首页 · YOZO 高端代工',
    seoDescription: '以前沿生物科技赋能顶尖美妆品牌，OEM/ODM 全链路解决方案。',
  },
};

async function main() {
  console.log(`[seed] project=${projectId} dataset=${dataset}`);
  const tx = client.transaction();
  tx.createOrReplace(siteSettingsDoc);
  tx.createOrReplace(homePageDoc);
  await tx.commit();
  console.log('[seed] 已写入 siteSettings、homePage。请在 Studio 中 Publish，前台即可读到。');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
