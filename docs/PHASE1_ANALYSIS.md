# 第一步：当前项目依赖与 Sanity 映射（jubin / junbin）

## 1. website 中仍依赖「本地 JSON / 旧 server」的位置

| 位置 | 依赖方式 | 删除 server 后 |
|------|----------|----------------|
| `src/cms/CmsContext.jsx` | `isSanityConfigured()` 为假时 `loadFromRestApi()` → `/api/products|articles|faqs|config` | **改为仅 Sanity**；无配置则明确报错提示 |
| `src/App.jsx` | `SharedContactCTA` 等 `fetch('/api/inquiries')` | **改为** `fetch('/api/inquiries', …)` 由 Vite 开发中间件或部署平台 **Serverless** 写入 Sanity |
| `src/admin/AdminApp.jsx` | 全文：登录、询盘、产品/文章/FAQ/分类 CRUD | **整站移除**（内容由 Studio 管理） |
| `src/lib/api.js` | 给 Admin 用的 Bearer `fetch(/api/...)` | **删除**（无 Admin） |
| `src/main.jsx` | 路由 `/admin/*` | **删除** |
| `vite.config.js` | `proxy['/api']` → `127.0.0.1:3001` | **删除旧代理**；保留或改为仅代理无后端时的占位（ inquiries 由 Vite 中间件在 dev 处理） |
| `package.json` | `dev:api`、`concurrently` 拉起旧 server | **删除** |
| `website/data/seed.json` | 仅旧 server `seed.mjs` 使用 | **删除** |

**已与 Sanity 对接（仅需对齐本仓库 schema 名称）**  
`src/lib/sanity/*`、`SANITY_FIELD_MAPPING.md`：产品 / 资讯 / FAQ / 站点设置。

**开发调试用**  
`src/dev/SanityReadExample.jsx`、`/dev/sanity`：可保留。

---

## 2. 页面/数据 → 建议 Sanity `_type`

| 前台用途 | 建议 Schema | 说明 |
|----------|-------------|------|
| 全局标题、SEO、联系方式、可选分类白名单 | `siteSettings` | 单例 |
| 首页 Hero、首页专属模块文案/图 | `homePage` | 单例，与 siteSettings 分工 |
| 产品列表/详情、筛选 Tab | `product` + `productCategory` | 已有 |
| 资讯列表/详情 | `post` | 已有 |
| FAQ 页 / 首页 FAQ 条 | `faq` | 已有 |
| 关于我们 / 服务条款等静态页 | `simplePage` 或 `docPage` | 新规；`slug` 路由可后续接 React Router |
| 询盘记录 | `inquiry` | 新规；仅服务端带 Token 创建 |
| 案例、视频（可选） | `caseStudy`、`video` | 可选扩展 |

---

## 3. 删除 server 后需替换的能力

| 原 API | 替代方案 |
|--------|----------|
| `GET/POST …/products` 等 | **GROQ** + `readCmsPayloadFromSanity` 扩展（含 `homePage`） |
| `GET /api/config` | **siteSettings** + **productCategory** + **post** 推导分类 Tab（已在 mappers） |
| `POST /api/inquiries` | **Vite `configureServer` 中间件（dev）** + **`api/inquiries.js`（Vercel 等生产）** → `sanityClient.create(inquiry)` |
| Admin JWT + CRUD | **Sanity Studio** |

---

本文件仅作迁移对照；实现以仓库内 `studio/schemaTypes` 与 `website/src/lib/sanity` 为准。
