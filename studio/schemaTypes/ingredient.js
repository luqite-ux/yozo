import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'ingredient',
  title: '成分条目',
  type: 'object',
  fields: [
    defineField({ name: 'name', title: '名称', type: 'string' }),
    defineField({ name: 'description', title: '说明', type: 'text', rows: 3 }),
    defineField({ name: 'name_en', title: 'Name (EN)', type: 'string', readOnly: true,
      description: '由翻译 Webhook 自动填充' }),
    defineField({ name: 'name_es', title: 'Name (ES)', type: 'string', readOnly: true }),
    defineField({ name: 'description_en', title: 'Description (EN)', type: 'text', rows: 3, readOnly: true }),
    defineField({ name: 'description_es', title: 'Description (ES)', type: 'text', rows: 3, readOnly: true }),
  ],
});
