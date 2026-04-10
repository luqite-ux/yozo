import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'post',
  title: '文章 / 资讯',
  type: 'document',
  groups: [
    { name: 'main', title: '正文' },
    { name: 'meta', title: '展示' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: '标题',
      type: 'string',
      group: 'main',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'main',
      options: { source: 'title', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'category',
      title: '栏目（展示用文案）',
      type: 'string',
      group: 'main',
      description: '如：公司新闻、行业洞察。用于前台筛选 Tab。',
    }),
    defineField({
      name: 'tags',
      title: '标签',
      type: 'array',
      group: 'main',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'publishedAt', title: '发布日期', type: 'datetime', group: 'main' }),
    defineField({ name: 'readTime', title: '阅读时长', type: 'string', initialValue: '5 min', group: 'main' }),
    defineField({ name: 'views', title: '浏览量展示', type: 'string', initialValue: '—', group: 'main' }),
    defineField({
      name: 'mainImage',
      title: '封面图',
      type: 'image',
      options: { hotspot: true },
      group: 'main',
    }),
    defineField({ name: 'summary', title: '摘要', type: 'text', rows: 3, group: 'main' }),
    defineField({
      name: 'body',
      title: '正文',
      type: 'blockContent',
      group: 'main',
    }),
    defineField({
      name: 'relatedFaqs',
      title: '文末相关问答',
      type: 'array',
      group: 'main',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'question', title: '问', type: 'string' },
            { name: 'answer', title: '答', type: 'text', rows: 3 },
            {
              name: 'question_en',
              title: 'Question (EN)',
              type: 'string',
              readOnly: true,
              description: '由翻译 Webhook 自动填充',
            },
            {
              name: 'question_es',
              title: 'Question (ES)',
              type: 'string',
              readOnly: true,
            },
            {
              name: 'answer_en',
              title: 'Answer (EN)',
              type: 'text',
              rows: 3,
              readOnly: true,
            },
            {
              name: 'answer_es',
              title: 'Answer (ES)',
              type: 'text',
              rows: 3,
              readOnly: true,
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'isFeatured',
      title: '精选',
      type: 'boolean',
      initialValue: false,
      group: 'meta',
    }),
    defineField({
      name: 'isPublished',
      title: '前台展示',
      type: 'boolean',
      initialValue: true,
      group: 'meta',
    }),
    defineField({ name: 'locale', title: '语言（预留）', type: 'string', group: 'meta' }),

    // ── 自动翻译字段 ──────────────────────────────────────────────────────────
    defineField({ name: 'title_en', title: 'Title (EN)', type: 'string', readOnly: true,
      description: '由翻译 Webhook 自动填充' }),
    defineField({ name: 'title_es', title: 'Title (ES)', type: 'string', readOnly: true }),
    defineField({ name: 'summary_en', title: 'Summary (EN)', type: 'text', rows: 3, readOnly: true }),
    defineField({ name: 'summary_es', title: 'Summary (ES)', type: 'text', rows: 3, readOnly: true }),
    defineField({
      name: 'bodyPlain_en',
      title: '正文（纯文本 EN，自动）',
      type: 'text',
      rows: 8,
      readOnly: true,
      description: '由翻译 Webhook 从「正文」Portable Text 抽取并翻译，前台英文站用于展示',
    }),
    defineField({
      name: 'bodyPlain_es',
      title: '正文（纯文本 ES，自动）',
      type: 'text',
      rows: 8,
      readOnly: true,
    }),
    defineField({ name: 'translationSourceHash', title: '翻译源哈希', type: 'string',
      readOnly: true, hidden: true }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    select: { title: 'title', cat: 'category', media: 'mainImage' },
    prepare({ title, cat, media }) {
      return { title, subtitle: cat || '', media };
    },
  },
});
