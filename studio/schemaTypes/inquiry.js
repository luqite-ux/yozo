import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'inquiry',
  title: '询盘',
  type: 'document',
  description: '询盘记录请以「运营可读性」维护；勿随意删除，建议将状态改为「已关闭」。',
  fields: [
    defineField({
      name: 'status',
      title: '状态',
      type: 'string',
      options: {
        list: [
          { title: '待处理 (new)', value: 'new' },
          { title: '已联系 (contacted)', value: 'contacted' },
          { title: '已关闭 (closed)', value: 'closed' },
          { title: '已处理（旧数据 done）', value: 'done' },
        ],
        layout: 'radio',
      },
      initialValue: 'new',
    }),
    defineField({
      name: 'submittedAt',
      title: '提交时间',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({ name: 'name', title: '姓名', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'company', title: '公司名', type: 'string' }),
    defineField({ name: 'email', title: '邮箱', type: 'string' }),
    defineField({ name: 'phone', title: '电话', type: 'string' }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp',
      type: 'string',
    }),
    defineField({ name: 'country', title: '国家/地区', type: 'string' }),
    defineField({
      name: 'message',
      title: '询盘内容',
      type: 'text',
      rows: 6,
    }),
    defineField({
      name: 'source',
      title: '来源标记',
      type: 'string',
      description: '如：web、float、product-detail',
    }),
    defineField({
      name: 'sourcePath',
      title: '来源页面路径',
      type: 'string',
      description: '如 /products/foo',
    }),
    defineField({
      name: 'sourceProduct',
      title: '来源产品',
      type: 'reference',
      to: [{ type: 'product' }],
    }),
    defineField({
      name: 'isRead',
      title: '已读',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'internalNotes',
      title: '内部备注',
      type: 'text',
      rows: 4,
    }),
  ],
  preview: {
    select: { name: 'name', phone: 'phone', email: 'email', status: 'status', at: 'submittedAt' },
    prepare({ name, phone, email, status, at }) {
      const contact = phone || email || '';
      return {
        title: `${name || '（无名）'} ${contact ? `· ${contact}` : ''}`,
        subtitle: `${status || ''}${at ? ` · ${new Date(at).toLocaleString()}` : ''}`,
      };
    },
  },
  orderings: [
    {
      title: '提交时间（新→旧）',
      name: 'submittedAtDesc',
      by: [{ field: 'submittedAt', direction: 'desc' }],
    },
  ],
});
