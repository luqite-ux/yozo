/**
 * 全球联络 simplePage#contact：仅写入「中文主字段」作为唯一可编辑源。
 * EN/ES/PT/AR/RU 由翻译 Webhook（见 webhook/server.js processSimplePage）在发布后自动写入只读字段，不在此种子中写死译文。
 */

export const CONTACT_MAP_IMAGE_URL =
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=2000';

const HUB_POSITIONS = [
  { _key: 'hub-na', top: '35%', left: '20%' },
  { _key: 'hub-eu', top: '40%', left: '48%' },
  { _key: 'hub-me', top: '55%', left: '60%' },
  { _key: 'hub-hq', top: '48%', left: '75%', isHeadquarters: true, isHQ: true },
  { _key: 'hub-ap', top: '42%', left: '85%' },
  { _key: 'hub-oc', top: '70%', left: '82%' },
];

const HUB_ROWS = [
  { label: '北美枢纽', sub: 'New York' },
  { label: '欧洲枢纽', sub: 'Paris' },
  { label: '中东枢纽', sub: 'Dubai' },
  { label: '全球制造总部', sub: 'Shantou, CN' },
  { label: '亚太运营', sub: 'Tokyo' },
  { label: '大洋洲枢纽', sub: 'Sydney' },
];

function buildHubs() {
  return HUB_POSITIONS.map((p, i) => {
    const row = HUB_ROWS[i];
    return {
      _type: 'object',
      _key: p._key,
      top: p.top,
      left: p.left,
      label: row.label,
      sub: row.sub,
      isHeadquarters: Boolean(p.isHeadquarters),
      ...(p.isHQ ? { isHQ: true } : {}),
    };
  });
}

const STATS_ROWS = [
  { value: '50', unit: '+', label: '出口国家/地区' },
  { value: '100', unit: '%', label: 'FDA/CPNP 达标' },
  { value: '15', unit: 'd', label: '最快全球交付' },
  { value: '7x24', unit: '', label: '全时区联络响应' },
];

function buildStats() {
  return STATS_ROWS.map((s, i) => ({
    _type: 'object',
    _key: `st-${i}`,
    value: s.value,
    unit: s.unit,
    label: s.label,
  }));
}

function buildContactLayout() {
  return {
    eyebrow: '全球网络',
    mapTitle: '业务版图辐射全球',
    mapLead:
      '以中国智造为核心，我们的代工产品已成功远销北美、欧洲、中东及亚太等 50 多个国家与地区，具备完善的全球化清关与合规交付能力。',
    mapBackgroundImageUrl: CONTACT_MAP_IMAGE_URL,
    legendHq: '总部',
    legendHub: '区域枢纽',
    hubs: buildHubs(),
    stats: buildStats(),
    hqTitle: '全球制造与研发总部',
    hqSubtitle: '中国 · 汕头',
    hqBody: '中国广东省汕头市龙湖区鸥汀街道防汛路31号东侧 (10万级 GMPC 智造中心)',
    hotlineTitle: '业务与出海咨询专线',
    hotlineSubtitle: '7×24 小时响应',
    hotlineLine1: '直线: +86 0754-89920101',
    hotlineLine2: 'WhatsApp: +86 13632470463',
    bizTitle: '企业邮箱与商务合作',
    bizSubtitle: '商务询盘',
    bizBody: '索取专属代工报价、产品图册或预约实地验厂，请发送邮件至：',
    bizEmail: 'yozobeauty@outlook.com',
  };
}

/**
 * @returns {Record<string, unknown>} simplePage 文档（仅中文主字段 + 地图外链；多语由 Webhook 写入）
 */
export function getContactPageSeedDoc() {
  return {
    _id: 'contact',
    _type: 'simplePage',
    title: '全球联络',
    slug: { _type: 'slug', current: 'contact' },
    excerpt: '开启跨越国界的美妆制造合作之旅。',
    banner: {
      _type: 'heroBanner',
      title: '全球联络',
    },
    body: [],
    contactLayout: buildContactLayout(),
    isPublished: true,
    seo: {
      _type: 'seo',
      seoTitle: '全球联络 | YOZO',
      seoDescription: '全球联络枢纽、跨境协作与商务对接信息。',
    },
  };
}

/**
 * 将已上传的地图/OG 图 asset 写入文档（prefill 脚本用）。
 * @param {Record<string, unknown>} doc getContactPageSeedDoc() 的副本
 * @param {string} imageAssetRef image asset _id
 */
export function attachContactPageUploadedImages(doc, imageAssetRef) {
  const next = { ...doc, contactLayout: { ...doc.contactLayout } };
  delete next.contactLayout.mapBackgroundImageUrl;
  next.contactLayout.mapBackgroundImage = {
    _type: 'image',
    asset: { _type: 'reference', _ref: imageAssetRef },
  };
  next.seo = {
    ...doc.seo,
    ogImage: {
      _type: 'image',
      asset: { _type: 'reference', _ref: imageAssetRef },
    },
  };
  return next;
}
