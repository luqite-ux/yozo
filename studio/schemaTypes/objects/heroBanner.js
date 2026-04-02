import { defineField, defineType } from 'sanity';

/** 首页 / 通用页的 Hero 区（可嵌于 homePage.hero、simplePage.banner 等） */
export default defineType({
  name: 'heroBanner',
  title: 'Banner / Hero',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: '主标题（可换行）',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'subtitle',
      title: '副标题',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'trustBadge',
      title: '角标文案',
      type: 'string',
      description: '例：ISO 22716 & GMPC Certified',
    }),
    defineField({ name: 'primaryCtaLabel', title: '主按钮文案', type: 'string' }),
    defineField({
      name: 'primaryCtaUrl',
      title: '主按钮链接',
      type: 'string',
      description: '站内路径如 /services 或完整 URL',
    }),
    defineField({ name: 'secondaryCtaLabel', title: '次按钮文案', type: 'string' }),
    defineField({ name: 'secondaryCtaUrl', title: '次按钮链接', type: 'string' }),
    defineField({
      name: 'backgroundImage',
      title: '背景图',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'backgroundVideoUrl',
      title: '背景视频 URL（可选）',
      type: 'url',
    }),
  ],
});
