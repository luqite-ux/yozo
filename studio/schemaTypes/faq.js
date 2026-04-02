import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  fields: [
    defineField({ name: 'question', title: '问题', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'answer', title: '回答', type: 'text', rows: 6, validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug（可选，用于独立页）',
      type: 'slug',
      options: { source: 'question', maxLength: 96 },
    }),
    defineField({ name: 'category', title: '分类', type: 'string', description: '可选，用于分组展示' }),
    defineField({
      name: 'sortOrder',
      title: '排序',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'isFeatured',
      title: '精选',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'showOnHome',
      title: '在首页 FAQ 区块默认展示',
      type: 'boolean',
      initialValue: false,
      description: '可与首页 hand-pick 条目并用；前台可只取 showOnHome 或首页引用',
    }),
    defineField({
      name: 'isPublished',
      title: '前台展示',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'locale',
      title: '语言（预留）',
      type: 'string',
    }),
  ],
  preview: { select: { title: 'question' } },
});
