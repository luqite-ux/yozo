import { defineField, defineType } from 'sanity';

const SEO_LOCALES = ['en', 'es', 'pt', 'ar', 'ru'];

function seoTranslatedTitleFields() {
  return SEO_LOCALES.map((loc) =>
    defineField({
      name: `seoTitle_${loc}`,
      title: `SEO 标题（${loc.toUpperCase()}，DeepSeek 自动）`,
      type: 'string',
      readOnly: true,
    }),
  );
}

function seoTranslatedDescriptionFields() {
  return SEO_LOCALES.map((loc) =>
    defineField({
      name: `seoDescription_${loc}`,
      title: `SEO 描述（${loc.toUpperCase()}，DeepSeek 自动）`,
      type: 'text',
      rows: 2,
      readOnly: true,
    }),
  );
}

/** 文档级默认 SEO（可嵌于各 document）；中文主文案可手编，多语由发布/翻译 Webhook 预填 */
export default defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({
      name: 'seoTitle',
      title: 'SEO 标题（中文）',
      type: 'string',
      description: '留空时前台可用产品名；发布后自动翻译并写入下方各语言字段。',
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO 描述（中文）',
      type: 'text',
      rows: 3,
      description: '建议 70–160 字；留空时可用摘要。发布后自动翻译。',
    }),
    defineField({
      name: 'ogImage',
      title: '分享图 (Open Graph)',
      type: 'image',
      options: { hotspot: true },
    }),
    ...seoTranslatedTitleFields(),
    ...seoTranslatedDescriptionFields(),
  ],
});
