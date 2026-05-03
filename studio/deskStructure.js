import {
  HomeIcon,
  CogIcon,
  TagsIcon,
  ArchiveIcon,
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
        .id('groupSiteSettings')
        .title('站点设置')
        .icon(CogIcon)
        .child(
          S.list()
            .id('deskSiteSettings')
            .title('站点设置')
            .items([
              S.listItem()
                .id('itemSiteSettings')
                .title('基础信息（网站名称 / 联系方式 / 页眉页脚 / 导航）')
                .icon(CogIcon)
                .schemaType('siteSettings')
                .child(
                  S.document().schemaType('siteSettings').documentId('siteSettings').title('站点设置'),
                ),
              S.listItem()
                .id('itemInquiries')
                .title('客户询盘 / CRM')
                .icon(CommentIcon)
                .child(
                  S.documentTypeList('inquiry')
                    .title('客户询盘 / CRM')
                    .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }]),
                ),
            ]),
        ),

      S.listItem()
        .id('groupFrontendFlow')
        .title('前端页面内容')
        .icon(HomeIcon)
        .child(
          S.list()
            .id('deskFrontendFlow')
            .title('前端页面内容')
            .items([
              S.listItem()
                .id('itemHomePage')
                .title('首页')
                .icon(HomeIcon)
                .schemaType('homePage')
                .child(S.document().schemaType('homePage').documentId('homePage').title('首页')),
              S.listItem()
                .id('itemAboutPage')
                .title('品牌探索')
                .icon(EarthGlobeIcon)
                .schemaType('aboutPage')
                .child(S.document().schemaType('aboutPage').documentId('aboutPage').title('品牌探索')),
              S.listItem()
                .id('itemServicePage')
                .title('代工方案')
                .icon(DocumentTextIcon)
                .schemaType('servicePage')
                .child(S.document().schemaType('servicePage').documentId('servicePage').title('代工方案')),
              S.listItem()
                .id('itemProductSeries')
                .title('产品系列')
                .icon(TagsIcon)
                .child(
                  S.documentTypeList('productCategory')
                    .title('产品系列')
                    .defaultOrdering([{ field: 'sortOrder', direction: 'asc' }]),
                ),
              S.listItem()
                .id('itemProductCenter')
                .title('产品中心')
                .icon(ArchiveIcon)
                .child(
                  S.documentTypeList('product')
                    .title('产品中心')
                    .defaultOrdering([{ field: 'sortOrder', direction: 'asc' }]),
                ),
              S.listItem()
                .id('itemInfoCenter')
                .title('资讯中心')
                .icon(ComposeIcon)
                .child(
                  S.list()
                    .id('deskInfoCenter')
                    .title('资讯中心')
                    .items([
                      S.listItem()
                        .id('itemNewsPosts')
                        .title('新闻资讯')
                        .icon(ComposeIcon)
                        .child(
                          S.documentTypeList('post')
                            .title('新闻资讯')
                            .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }]),
                        ),
                      S.listItem()
                        .id('itemCaseStudies')
                        .title('案例内容')
                        .icon(CaseIcon)
                        .child(
                          S.documentTypeList('caseStudy')
                            .title('案例内容')
                            .defaultOrdering([{ field: 'sortOrder', direction: 'asc' }]),
                        ),
                    ]),
                ),
              S.listItem()
                .id('itemFaqs')
                .title('合作指引')
                .icon(HelpCircleIcon)
                .child(
                  S.documentTypeList('faq')
                    .title('合作指引')
                    .defaultOrdering([{ field: 'sortOrder', direction: 'asc' }]),
                ),
              S.listItem()
                .id('itemGlobalContact')
                .title('全球联络')
                .icon(EarthGlobeIcon)
                .schemaType('simplePage')
                .child(S.document().schemaType('simplePage').documentId('contact').title('全球联络')),
              S.listItem()
                .id('itemSimplePages')
                .title('其他通用页面')
                .icon(DocumentTextIcon)
                .child(S.documentTypeList('simplePage').title('其他通用页面')),
            ]),
        ),
    ]);
