import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'caseStudy',
  title: '案例',
  type: 'document',
  groups: [
    { name: 'main', title: '内容' },
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
    defineField({ name: 'excerpt', title: '摘要', type: 'text', rows: 3, group: 'main' }),
    defineField({
      name: 'coverImage',
      title: '封面图',
      type: 'image',
      options: { hotspot: true },
      group: 'main',
    }),
    defineField({
      name: 'cover',
      title: '封面（旧字段，优先使用封面图）',
      type: 'image',
      options: { hotspot: true },
      group: 'main',
    }),
    defineField({
      name: 'gallery',
      title: '图库',
      type: 'array',
      group: 'main',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'body',
      title: '正文',
      type: 'blockContent',
      group: 'main',
    }),
    defineField({
      name: 'industry',
      title: '行业',
      type: 'string',
      group: 'main',
    }),
    defineField({
      name: 'tags',
      title: '标签',
      type: 'array',
      group: 'main',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'sortOrder',
      title: '排序',
      type: 'number',
      initialValue: 0,
      group: 'meta',
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
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
  ],
  preview: {
    select: { title: 'title', m1: 'coverImage', m2: 'cover' },
    prepare({ title, m1, m2 }) {
      return { title, media: m1 || m2 };
    },
  },
});
