import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'simplePage',
  title: '通用页面',
  type: 'document',
  groups: [
    { name: 'main', title: '内容' },
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
      name: 'excerpt',
      title: '摘要',
      type: 'text',
      rows: 2,
      group: 'main',
    }),
    defineField({
      name: 'banner',
      title: '页头 Banner',
      type: 'heroBanner',
      group: 'main',
    }),
    defineField({
      name: 'body',
      title: '正文',
      type: 'blockContent',
      group: 'main',
    }),
    defineField({
      name: 'isPublished',
      title: '前台展示',
      type: 'boolean',
      initialValue: true,
      group: 'main',
    }),
    defineField({
      name: 'locale',
      title: '语言（预留）',
      type: 'string',
      group: 'main',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO 标题（兼容）',
      type: 'string',
      group: 'seo',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO 描述（兼容）',
      type: 'text',
      rows: 2,
      group: 'seo',
    }),
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current' },
    prepare: ({ title, slug }) => ({ title: title || '页面', subtitle: slug ? `/${slug}` : '' }),
  },
});
