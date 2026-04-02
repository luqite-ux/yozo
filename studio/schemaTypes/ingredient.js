import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'ingredient',
  title: '成分条目',
  type: 'object',
  fields: [
    defineField({ name: 'name', title: '名称', type: 'string' }),
    defineField({ name: 'description', title: '说明', type: 'text', rows: 3 }),
  ],
});
