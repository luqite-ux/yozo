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
      description:
        '前台为全宽铺满 + object-cover，高度约一屏 (min-height: 100dvh)。建议上传横向大图：约 2400×1350 像素（16∶9）或更大（如 2560×1440）；主体构图放在中下部，顶部预留导航区。文件尽量压缩以加快首屏加载。',
      options: { hotspot: true },
    }),
    defineField({
      name: 'backgroundVideoUrl',
      title: '背景视频 URL（可选）',
      type: 'url',
    }),
  ],
});
