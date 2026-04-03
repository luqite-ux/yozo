import { defineField, defineType } from 'sanity';

/** 前台路由 /about「品牌探索」结构化内容（原硬编码迁入 CMS） */
export default defineType({
  name: 'aboutPage',
  title: '品牌探索页',
  type: 'document',
  groups: [
    { name: 'hero', title: '第一屏·标题区' },
    { name: 'lab', title: '实验室横幅（大图）' },
    { name: 'manifesto', title: '第二屏·宣言' },
    { name: 'portfolio', title: '第三屏·品牌矩阵' },
    { name: 'certs', title: '第四屏·认证背书' },
  ],
  fields: [
    defineField({
      name: 'heroEyebrow',
      title: '首屏眉标（如 About YOZO）',
      type: 'string',
      group: 'hero',
    }),
    defineField({
      name: 'heroTitle',
      title: '首屏主标题（支持换行）',
      type: 'text',
      rows: 3,
      group: 'hero',
    }),
    defineField({
      name: 'heroSubtitle',
      title: '首屏副标题',
      type: 'text',
      rows: 4,
      group: 'hero',
    }),
    defineField({
      name: 'labImage',
      title: '实验室横幅图（上传到 Sanity CDN）',
      type: 'image',
      options: { hotspot: true },
      group: 'lab',
    }),
    defineField({
      name: 'labImageUrl',
      title: '或外链图片 URL（填写则优先于上传图）',
      type: 'url',
      group: 'lab',
      description: '国内访问 Unsplash 不稳定时可改用本地上传或国内可访问图床',
    }),
    defineField({
      name: 'labOverlayTitle',
      title: '横幅叠字主标题',
      type: 'text',
      rows: 3,
      group: 'lab',
    }),
    defineField({
      name: 'labOverlaySubtitle',
      title: '横幅叠字副标题',
      type: 'string',
      group: 'lab',
    }),
    defineField({
      name: 'manifestoQuote',
      title: '第二屏引用句',
      type: 'text',
      rows: 3,
      group: 'manifesto',
    }),
    defineField({
      name: 'manifestoBody',
      title: '第二屏正文',
      type: 'text',
      rows: 6,
      group: 'manifesto',
    }),
    defineField({
      name: 'portfolioEyebrow',
      title: '第三屏小标题（英文眉标）',
      type: 'string',
      group: 'portfolio',
    }),
    defineField({
      name: 'portfolioTitle',
      title: '第三屏主标题',
      type: 'string',
      group: 'portfolio',
    }),
    defineField({
      name: 'portfolioIntro',
      title: '第三屏引言',
      type: 'text',
      rows: 3,
      group: 'portfolio',
    }),
    defineField({
      name: 'portfolioBrands',
      title: '品牌卡片',
      type: 'array',
      group: 'portfolio',
      of: [
        {
          type: 'object',
          name: 'aboutBrandCard',
          fields: [
            defineField({ name: 'name', title: '品牌名', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'subtitle', title: '副标题', type: 'string' }),
            defineField({ name: 'description', title: '描述', type: 'text', rows: 4 }),
            defineField({
              name: 'image',
              title: '卡片图',
              type: 'image',
              options: { hotspot: true },
            }),
            defineField({
              name: 'imageUrl',
              title: '或外链图 URL',
              type: 'url',
            }),
          ],
          preview: {
            select: { title: 'name', media: 'image' },
          },
        },
      ],
    }),
    defineField({
      name: 'portfolioCtaLabel',
      title: '第三屏底部按钮文案',
      type: 'string',
      group: 'portfolio',
    }),
    defineField({
      name: 'portfolioCtaHref',
      title: '第三屏底部按钮链接',
      type: 'string',
      group: 'portfolio',
    }),
    defineField({
      name: 'certSectionTitle',
      title: '第四屏主标题',
      type: 'string',
      group: 'certs',
    }),
    defineField({
      name: 'certSectionSubtitle',
      title: '第四屏英文副标题',
      type: 'string',
      group: 'certs',
    }),
    defineField({
      name: 'certifications',
      title: '认证项',
      type: 'array',
      group: 'certs',
      of: [
        {
          type: 'object',
          name: 'aboutCert',
          fields: [
            defineField({ name: 'title', title: '标题', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'subtitle', title: '说明文案', type: 'string' }),
            defineField({
              name: 'icon',
              title: '图标',
              type: 'string',
              options: {
                list: [
                  { title: 'Shield（盾牌）', value: 'shield' },
                  { title: 'Award（奖章）', value: 'award' },
                  { title: 'Globe（地球）', value: 'globe' },
                  { title: 'Activity（波形）', value: 'activity' },
                ],
                layout: 'radio',
              },
              initialValue: 'shield',
            }),
          ],
          preview: {
            select: { t: 'title', s: 'subtitle' },
            prepare({ t, s }) {
              return { title: t, subtitle: s };
            },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: '品牌探索页' }),
  },
});
