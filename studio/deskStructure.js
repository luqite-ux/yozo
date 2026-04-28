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
  EarthGlobeIcon,
} from '@sanity/icons';

/**
 * 模板 Desk：按业务场景排序（与 migration-plan 一致）
 * @param {import('sanity/structure').StructureBuilder} S
 */
export const deskStructure = (S) =>
  S.list()
    // 中文 title 无法可靠生成 id，必须手写 id，否则报错：`id` is required for lists
    .id('deskRoot')
    .title('YOZO 管理后台')
    .items([
      S.listItem()
        .id('groupBusiness')
        .title('业务核心')
        .icon(HomeIcon)
        .child(
          S.list()
            .id('deskBusinessCore')
            .title('业务核心')
            .items([
              S.listItem()
                .id('itemInquiries')
                .title('客户询盘 / CRM')
                .icon(CommentIcon)
                .child(
                  S.documentTypeList('inquiry')
                    .title('客户询盘 / CRM')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
              S.listItem()
                .id('itemProducts')
                .title('产品库')
                .icon(ArchiveIcon)
                .child(
                  S.documentTypeList('product').title('产品库').defaultOrdering([{ field: 'sortOrder', direction: 'asc' }]),
                ),
              S.listItem()
                .id('itemProductCategories')
                .title('产品分类')
                .icon(TagsIcon)
                .child(
                  S.documentTypeList('productCategory')
                    .title('产品分类')
                    .defaultOrdering([{ field: 'sortOrder', direction: 'asc' }]),
                ),
              S.listItem()
                .id('itemCaseStudies')
                .title('案例展示')
                .icon(CaseIcon)
                .child(
                  S.documentTypeList('caseStudy')
                    .title('案例展示')
                    .defaultOrdering([{ field: 'sortOrder', direction: 'asc' }]),
                ),
            ]),
        ),

      S.listItem()
        .id('groupContent')
        .title('内容管理')
        .icon(ComposeIcon)
        .child(
          S.list()
            .id('deskContent')
            .title('内容管理')
            .items([
              S.listItem()
                .id('itemHomePage')
                .title('首页')
                .icon(HomeIcon)
                .schemaType('homePage')
                .child(S.document().schemaType('homePage').documentId('homePage').title('首页')),
              S.listItem()
                .id('itemAboutPage')
                .title('品牌探索页')
                .icon(EarthGlobeIcon)
                .schemaType('aboutPage')
                .child(
                  S.document().schemaType('aboutPage').documentId('aboutPage').title('品牌探索页'),
                ),
              S.listItem()
                .id('itemPosts')
                .title('新闻 / 文章')
                .icon(ComposeIcon)
                .child(
                  S.documentTypeList('post').title('新闻 / 文章').defaultOrdering([{ field: 'publishedAt', direction: 'desc' }]),
                ),
              S.listItem()
                .id('itemFaqs')
                .title('FAQ')
                .icon(HelpCircleIcon)
                .child(
                  S.documentTypeList('faq').title('FAQ').defaultOrdering([{ field: 'sortOrder', direction: 'asc' }]),
                ),
              S.listItem()
                .id('itemSimplePages')
                .title('通用页面')
                .icon(DocumentTextIcon)
                .child(S.documentTypeList('simplePage').title('通用页面')),
              S.listItem()
                .id('itemDocPages')
                .title('文档页')
                .icon(DocumentsIcon)
                .child(S.documentTypeList('docPage').title('文档页')),
              S.listItem()
                .id('itemVideos')
                .title('视频素材')
                .icon(DocumentsIcon)
                .child(S.documentTypeList('video').title('视频素材')),
            ]),
        ),

      S.listItem()
        .id('groupSystem')
        .title('系统设置')
        .icon(CogIcon)
        .child(
          S.list()
            .id('deskSystem')
            .title('系统设置')
            .items([
              S.listItem()
                .id('itemSiteSettings')
                .title('站点设置')
                .icon(CogIcon)
                .schemaType('siteSettings')
                .child(
                  S.document().schemaType('siteSettings').documentId('siteSettings').title('站点设置'),
                ),
            ]),
        ),
    ]);
