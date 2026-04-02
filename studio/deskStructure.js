import {
  HomeIcon,
  CogIcon,
  TagsIcon,
  ArchiveIcon,
  DocumentsIcon,
  ComposeIcon,
  HelpCircleIcon,
  DocumentTextIcon,
  CommentIcon,
  CaseIcon,
} from '@sanity/icons';

/**
 * 模板 Desk：按业务场景排序（与 migration-plan 一致）
 * @param {import('sanity/structure').StructureBuilder} S
 */
export const deskStructure = (S) =>
  S.list()
    .title('网站内容')
    .items([
      S.listItem()
        .title('首页')
        .icon(HomeIcon)
        .schemaType('homePage')
        .child(S.document().schemaType('homePage').documentId('homePage').title('首页')),

      S.listItem()
        .title('站点设置')
        .icon(CogIcon)
        .schemaType('siteSettings')
        .child(
          S.document().schemaType('siteSettings').documentId('siteSettings').title('站点设置'),
        ),

      S.listItem()
        .title('产品分类')
        .icon(TagsIcon)
        .child(
          S.documentTypeList('productCategory')
            .title('产品分类')
            .defaultOrdering([{ field: 'sortOrder', direction: 'asc' }]),
        ),

      S.listItem()
        .title('产品')
        .icon(ArchiveIcon)
        .child(
          S.documentTypeList('product').title('产品').defaultOrdering([{ field: 'sortOrder', direction: 'asc' }]),
        ),

      S.listItem()
        .title('案例')
        .icon(CaseIcon)
        .child(
          S.documentTypeList('caseStudy')
            .title('案例')
            .defaultOrdering([{ field: 'sortOrder', direction: 'asc' }]),
        ),

      S.listItem()
        .title('新闻 / 文章')
        .icon(ComposeIcon)
        .child(
          S.documentTypeList('post').title('文章').defaultOrdering([{ field: 'publishedAt', direction: 'desc' }]),
        ),

      S.listItem()
        .title('FAQ')
        .icon(HelpCircleIcon)
        .child(
          S.documentTypeList('faq').title('FAQ').defaultOrdering([{ field: 'sortOrder', direction: 'asc' }]),
        ),

      S.listItem()
        .title('通用页面')
        .icon(DocumentTextIcon)
        .child(S.documentTypeList('simplePage').title('通用页面')),

      S.listItem()
        .title('询盘')
        .icon(CommentIcon)
        .child(
          S.documentTypeList('inquiry')
            .title('询盘')
            .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
        ),

      S.divider(),

      S.listItem()
        .title('其他')
        .icon(DocumentsIcon)
        .child(
          S.list()
            .title('其他')
            .items([
              S.listItem()
                .title('文档页')
                .child(S.documentTypeList('docPage').title('文档页')),
              S.listItem()
                .title('视频')
                .child(S.documentTypeList('video').title('视频')),
            ]),
        ),
    ]);
