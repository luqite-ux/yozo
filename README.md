# Huanqiu · 外贸企业官网标准模板（Monorepo）

双项目结构：**前台 `website`（Vite + React）** + **`studio`（Sanity Studio）**。内容与询盘均走 **Sanity**；已移除本地 JSON CMS、Express `server` 与内嵌 `/admin`。

---

## 建议域名与部署角色

| 用途 | 建议地址 |
|------|----------|
| 对外官网 | `https://www.example.com`（或根域 `example.com`） |
| 内容后台 | `https://studio.example.com` 或 `https://admin.example.com`（Sanity 自托管 `sanity deploy` 或 Sanity 托管） |

前台与 Studio 使用 **同一** `projectId` + `dataset`。

---

## 目录结构（精简）

```text
jubin/
├── package.json              # 根脚本：dev:website / dev:studio / verify:read / validate:studio
├── website/
│   ├── api/
│   │   ├── inquiries.js          # Vercel：POST 询盘
│   │   └── lib/createInquiry.mjs # 服务端写 Sanity（需 WRITE token）
│   ├── src/
│   │   ├── cms/CmsContext.jsx
│   │   ├── lib/sanity/           # client、queries、mappers、read
│   │   └── App.jsx               # 路由含 /cases/:slug、/p/:slug
│   ├── vite.config.js
│   ├── vercel.json
│   ├── scripts/verify-sanity-read.mjs  # CLI：校验各类型 GROQ 可读
│   └── .env.example
├── studio/
│   ├── schemaTypes/              # 模板 schema + objects/seo、heroBanner
│   ├── deskStructure.js
│   ├── components/StudioBrandLogo.jsx
│   ├── sanity.config.js
│   └── .env.example
└── docs/
    ├── migration-plan.md         # 分阶段迁移与清单
    └── PHASE1_ANALYSIS.md
```

---

## Schema 清单（模板核心）

| `_type` | 说明 |
|---------|------|
| `siteSettings` | 站点设置：品牌、联系方式、导航/CTA、页脚、社媒、全站默认 SEO、`localeDefault` |
| `homePage` | 首页：`hero`（heroBanner）、精选产品/案例/FAQ、CTA 区块、`sections` 预留、`seo` |
| `productCategory` | 分类：slug、简介、封面、`sortOrder`、`isVisible`、`isPublished`、`seo` |
| `product` | 产品：图库、摘要、正文、规格、应用场景、`isFeatured`/`isPublished`、`seo` |
| `caseStudy` | 案例：slug、图库、行业/标签、`sortOrder`、`isFeatured`、`seo` |
| `post` | 文章：`publishedAt`、标签、`isFeatured`/`isPublished`、`seo` |
| `faq` | FAQ：分类、`sortOrder`、`isFeatured`、`showOnHome`、`isPublished` |
| `simplePage` | 通用页：`banner`（heroBanner）、摘要、正文、`seo` |
| `inquiry` | 询盘：完整联系字段、来源路径/产品引用、状态 `new` / `contacted` / `closed`、已读、内部备注 |
| `docPage` / `video` | 可选，Desk 归入「其他」 |

**复用对象**：`seo`（`seoTitle`、`seoDescription`、`ogImage`）、`heroBanner`。

**前台可见性**：GROQ 列表侧过滤 `!defined(isPublished) || isPublished == true`；分类另加 `isVisible`。已发布文档才会进 CDN；`isPublished == false` 用于「已发布但临时前台隐藏」。

---

## 环境变量

### `website/.env`（见 `.env.example`）

| 变量 | 说明 |
|------|------|
| `VITE_SANITY_PROJECT_ID` | 浏览器只读查询（**必填**） |
| `VITE_SANITY_DATASET` | 默认 `production` |
| `VITE_SANITY_API_VERSION` | 如 `2024-01-01` |
| `VITE_SANITY_USE_CDN` | 一般 `true` |
| `SANITY_PROJECT_ID` | 与前台一致；**服务端**写询盘 |
| `SANITY_DATASET` | 同上 |
| `SANITY_API_WRITE_TOKEN` | **仅服务端**；具备创建 `inquiry` 权限，**禁止** `VITE_` 前缀 |

未配置 `VITE_SANITY_PROJECT_ID` 时，前台会抛出明确错误提示。

### `studio/.env`（见 `studio/.env.example`）

| 变量 | 说明 |
|------|------|
| `SANITY_STUDIO_PROJECT_ID` | 与前台同一项目 |
| `SANITY_STUDIO_DATASET` | 同上 |
| `SANITY_STUDIO_BRAND_TITLE` | 可选，顶栏标题 |
| `SANITY_STUDIO_BRAND_SHORT` | 可选，无 Logo 时的短文案 |
| `SANITY_STUDIO_LOGO_URL` | 可选，顶栏 Logo 图片地址 |

---

## 本地启动

可用根目录脚本（需已分别在 `website` / `studio` 执行过 `npm install`）：

```powershell
cd e:\huanqiuweb\jubin
npm run dev:studio    # http://127.0.0.1:3333（默认）
npm run dev:website   # http://127.0.0.1:5173（默认）
```

或分目录：

```powershell
cd e:\huanqiuweb\jubin\studio
copy .env.example .env
# 填写 SANITY_STUDIO_PROJECT_ID
npm install
npm run dev

cd e:\huanqiuweb\jubin\website
copy .env.example .env
# 填写 VITE_* 与 SANITY_*（本地测询盘需 WRITE token）
npm install
npm run dev
```

- Studio：一般为 `http://127.0.0.1:3333` 或 `http://localhost:3333`
- 前台：`http://127.0.0.1:5173` 或 `http://localhost:5173`
- 询盘：`POST /api/inquiries`（开发由 `vite-plugin-inquiry-api` 转发至 `createInquiry`）

**单例文档**：在 Desk 中打开固定 id `siteSettings`、`homePage` 即可编辑全局与首页。

---

## 前台路由补充

| 路径 | 数据来源 |
|------|----------|
| `/cases/:slug` | `caseStudy.slug` |
| `/p/:slug` | `simplePage.slug` |

---

## 部署

### 前台（Vercel）

- Root Directory：`website`
- 环境变量：`VITE_*`、`SANITY_PROJECT_ID`、`SANITY_DATASET`、`SANITY_API_WRITE_TOKEN`

### Studio

```powershell
cd studio
npm run deploy
```

---

## 复用给新客户（简要）

1. 复制整个仓库（或仅 `website` + `studio`）。
2. 在 Sanity 新建项目或使用新 dataset；更新两边 `.env` 的 `projectId` / `dataset`。
3. 在 `studio/.env` 设置 `SANITY_STUDIO_BRAND_TITLE`（及可选 Logo URL）。
4. 在 Studio 创建单例 `siteSettings`、`homePage`，再录入分类与内容。
5. 按客户行业微调 `schemaTypes` 字段与 `website` 内 `mappers.js` / 页面 UI。
6. 部署前台与 Studio，配置域名（见上表）。

---

## 已移除的旧系统

- `server/`（Express + 本地 JSON）
- `website/src/admin/`、`website/src/lib/api.js`
- `website/data/` 种子与本地 CMS
- 指向本地 CMS 的 Vite proxy、`concurrently` 双进程 dev

---

## 验证命令（根目录）

```powershell
cd e:\huanqiuweb\jubin
npm run validate:studio   # Sanity schema validate
npm run verify:read       # 校验 siteSettings / homePage / 分类 / 产品 / 文章 / FAQ / simplePage GROQ（需 VITE_SANITY_PROJECT_ID）
npm run lint:website
npm run build:website
npm run build:studio
```

更细的阶段说明、字段对照见 **`docs/migration-plan.md`**。

---

## 自检清单（模板交付前）

| 项 | 做法 |
|----|------|
| **本地启动** | `npm run dev:studio`、`npm run dev:website`，两地址均可打开 |
| **内容读取** | `npm run verify:read`；前台需有已发布文档时 `CmsContext` 才不为空 |
| **询盘** | 配置 `SANITY_API_WRITE_TOKEN`（**无** `VITE_`）；前台提交后 Studio → 询盘可见；断 token 时提示「服务未配置…」（见 `submitInquiry.js`） |
| **结构** | `npm run validate:studio`；Desk 见 `studio/deskStructure.js` |
| **清理** | 根目录无旧 `server`/`data.json`；依赖见各子包 `package.json` |
