import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'docPage',
  title: '文档页',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: '标题', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'summary', title: '摘要', type: 'text', rows: 2 }),
    defineField({ name: 'body', title: '正文', type: 'blockContent' }),
    defineField({ name: 'seoTitle', title: 'SEO 标题', type: 'string' }),
    defineField({ name: 'seoDescription', title: 'SEO 描述', type: 'text', rows: 2 }),
  ],
  preview: { select: { title: 'title', slug: 'slug.current' }, prepare: ({ title, slug }) => ({ title, subtitle: `/${slug}` }) },
});
