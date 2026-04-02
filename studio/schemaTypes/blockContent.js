import { defineType, defineArrayMember } from 'sanity';

export const blockContentType = defineType({
  name: 'blockContent',
  title: '正文',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: '正文', value: 'normal' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: '引用', value: 'blockquote' },
      ],
      lists: [{ title: '项目符号', value: 'bullet' }],
      marks: {
        decorators: [
          { title: '加粗', value: 'strong' },
          { title: '斜体', value: 'em' },
        ],
      },
    }),
    defineArrayMember({ type: 'image', options: { hotspot: true } }),
  ],
});
