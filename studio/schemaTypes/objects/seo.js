import { defineField, defineType } from 'sanity';

/** 文档级默认 SEO（可嵌于各 document） */
export default defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({ name: 'seoTitle', title: 'SEO 标题', type: 'string' }),
    defineField({ name: 'seoDescription', title: 'SEO 描述', type: 'text', rows: 3 }),
    defineField({
      name: 'ogImage',
      title: '分享图 (Open Graph)',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
});
