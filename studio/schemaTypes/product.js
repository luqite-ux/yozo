import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'product',
  title: '产品',
  type: 'document',
  groups: [
    { name: 'main', title: '基础' },
    { name: 'content', title: '详情' },
    { name: 'meta', title: '展示设置' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'name',
      title: '名称',
      type: 'string',
      group: 'main',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'main',
      options: { source: 'name', maxLength: 96 },
    }),
    defineField({
      name: 'category',
      title: '分类',
      type: 'reference',
      to: [{ type: 'productCategory' }],
      group: 'main',
    }),
    defineField({
      name: 'mainImage',
      title: '封面 / 主图',
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
      name: 'excerpt',
      title: '摘要',
      type: 'text',
      rows: 3,
      group: 'content',
    }),
    defineField({
      name: 'description',
      title: '短描述（列表用）',
      type: 'text',
      rows: 4,
      group: 'content',
    }),
    defineField({
      name: 'body',
      title: '详情正文',
      type: 'blockContent',
      group: 'content',
    }),
    defineField({
      name: 'specifications',
      title: '参数 / 规格',
      type: 'array',
      group: 'content',
      of: [
        {
          type: 'object',
          name: 'specRow',
          fields: [
            defineField({ name: 'label', title: '名称', type: 'string' }),
            defineField({ name: 'value', title: '值', type: 'string' }),
          ],
          preview: {
            select: { l: 'label', v: 'value' },
            prepare({ l, v }) {
              return { title: `${l}: ${v}` };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'applicationScenarios',
      title: '应用场景',
      type: 'text',
      rows: 4,
      group: 'content',
    }),
    defineField({ name: 'tags', title: '标签', type: 'array', group: 'content', of: [{ type: 'string' }] }),
    defineField({ name: 'packaging', title: '包装建议', type: 'string', group: 'content' }),
    defineField({ name: 'supportOem', title: '支持 OEM', type: 'boolean', initialValue: true, group: 'content' }),
    defineField({ name: 'skinType', title: '适用肤质/人群', type: 'string', group: 'content' }),
    defineField({
      name: 'ingredients',
      title: '成分',
      type: 'array',
      of: [{ type: 'ingredient' }],
      group: 'content',
    }),
    defineField({
      name: 'efficacy',
      title: '功效要点（每行一条）',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'content',
    }),
    defineField({ name: 'oemDesc', title: 'OEM/定制说明', type: 'text', rows: 4, group: 'content' }),
    defineField({
      name: 'sortOrder',
      title: '排序',
      type: 'number',
      initialValue: 0,
      group: 'meta',
    }),
    defineField({
      name: 'isFeatured',
      title: '精选 / 推荐位',
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
    select: { title: 'name', media: 'mainImage', cat: 'category.title' },
    prepare({ title, media, cat }) {
      return { title, subtitle: cat || '', media };
    },
  },
});
