import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'video',
  title: '视频',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: '标题', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'videoUrl',
      title: '视频链接',
      type: 'url',
      description: 'YouTube / Vimeo / 直连 MP4 等',
    }),
    defineField({ name: 'thumbnail', title: '封面图', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'description', title: '说明', type: 'text', rows: 3 }),
    defineField({ name: 'sortOrder', title: '排序', type: 'number', initialValue: 0 }),
  ],
  preview: { select: { title: 'title', media: 'thumbnail' } },
});
