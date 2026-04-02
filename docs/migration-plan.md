# 外贸官网 Sanity 模板 — 迁移与标准化计划

## 第一阶段：现状审查（已完成 / 持续更新）

### 目录结构

- `website/`：Vite + React 前台，Sanity 只读 + `/api/inquiries` 服务端写询盘。
- `studio/`：Sanity Studio v3，Vision + 自定义 Desk。

### 旧系统

已移除：`server/`、`website/data`、`website/src/admin`、`website/src/lib/api.js`、Vite 对本地 CMS 的代理。

### Schema 对照表

| 文档类型 | 状态 | 说明 |
|---------|------|------|
| `siteSettings` | 扩展中 | 补全 favicon、社媒、页脚、导航、默认 SEO 对象、语言预留、WhatsApp 等 |
| `homePage` | 扩展中 | 引入 `heroBanner`、精选产品/案例/FAQ、CTA 区块、`seo`、兼容旧扁平 hero 字段 |
| `productCategory` | 扩展中 | 简介、封面、`isVisible`、`seo`、`isPublished` 策略与列表过滤 |
| `product` | 扩展中 | 图库、摘要、正文、规格、应用场景、`isFeatured`/`isPublished`、`seo` |
| `caseStudy` | 扩展中 | 图库、行业/标签、`sortOrder`、`isFeatured`、`seo`；前台增加按 slug 展示 |
| `post` | 扩展中 | `isFeatured`、`isPublished`、`seo`、标签 |
| `faq` | 扩展中 | 分类、`isFeatured`、`showOnHome` |
| `simplePage` | 扩展中 | `banner`（heroBanner）、摘要、`seo`；前台 `/p/:slug` |
| `inquiry` | 扩展中 | 完整询盘字段、状态 `new/contacted/closed`、已读、内部备注 |
| `docPage` / `video` | 保留 | 可选扩展，Desk 归入「其他」 |

### 复用对象

| 对象 | 用途 |
|------|------|
| `seo` | `seoTitle` / `seoDescription` / `ogImage`（hotspot） |
| `heroBanner` | 首页与通用页 Banner |

### 前台数据层

- **查询**：列表统一增加 `(!defined(isPublished) \|\| isPublished == true)`（及分类 `isVisible`）；分类忽略 `isVisible == false`。
- **映射**：`mergeHomePageIntoSiteSettings` 优先使用 `homePage.hero`；新增 `mapSanityCaseStudy`、`mapSanitySimplePage`。
- **Context**：`caseStudies`、`simplePages` 供路由使用。

### 询盘

- `createInquiry.mjs` 与 `inquiry` schema 字段对齐；校验：**姓名 +（电话或邮箱）**。
- 仍仅服务端持有 `SANITY_API_WRITE_TOKEN`。

---

## 第二阶段：Studio 模板完善

- [x] 注册 `seo`、`heroBanner` 到 `schemaTypes`
- [x] 各文档类型字段与规格书对齐
- [x] Desk：首页 → 站点设置 → 产品分类 → 产品 → 案例 → 文章 → FAQ → 通用页面 → 询盘；「其他」放 doc/video

## 第三阶段：Website 数据层

- [x] `queries.js` 扩展与过滤
- [x] `read.js` / `mappers.js` / `CmsContext`
- [ ] 首页模块 UI 可选用 `homeFeaturedProducts` 等（数据已就绪时可接入）

## 第四阶段：Inquiry

- [x] API + `submitInquiry` 扩展字段
- [x] 产品页可传 `sourceProductId`、`sourcePath`

## 第五阶段：清理与文档

- [x] `README.md` 更新域名字段说明、schema 清单、删除清单引用
- [x] 本文件作为阶段留档

---

## 验证命令

```bash
cd studio && npx sanity schema validate
cd website && npm run build && npm run lint
```

## 与 Sanity 草稿/发布

- API CDN 仅返回**已发布**文档；`isPublished == false` 用于在**已发布**文档上从前台隐藏。
- 未发布草稿不会出现在前台 CDN 查询中。

---

## 后续可选

- 自定义 Document Action 限制删除 `inquiry`（当前以文案提示为主）。
- 首页 `sections` 模块化 UI 与更多 block 类型。
