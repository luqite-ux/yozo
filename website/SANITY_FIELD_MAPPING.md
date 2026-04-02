# Sanity → 前台展示字段映射（`mappers.js`）

以下为 Studio 常见字段与页面旧 JSON 形状的对应关系；未列出的字段会通过 GROQ `...` 原样挂在对象上，可在 `mappers.js` 中继续补充 `coalesce`。

## `product` → 列表/详情卡片

| 页面使用（旧 JSON） | Sanity 优先字段 | 备选 |
|--------------------|-----------------|------|
| `id`（路由数字 ID） | 由 `_id` 稳定哈希生成 | — |
| `slug` / `sanityId` | `slug.current`、`_id` | 用于 slug 路由 |
| `name` | `name` | `title` |
| `category`（字符串） | `category.title`（引用展开） | `categoryTitle`、`categoryLabel` |
| `img` | `mainImage` / `image` / `featuredImage` 的 `asset->url` | `imageUrl`（GROQ 已投影） |
| `desc` | `desc` | `description`、`excerpt`、`summary` |
| `tags[]` | `tags` | 若为引用数组则取子项 `title` / `label` / `name` |
| `packaging` | `packaging` | `packagingSuggestion`、`packagingType` |
| `supportOem` | `supportOem` | `supportOEM`、`oem` |
| `skinType` | `skinType` | `skinTypes`、`targetSkin`、`audience` |
| `ingredients[]` | `ingredients[]` | `keyIngredients[]`，子字段 `name`\|`title`，`desc`\|`description` |
| `efficacy[]` | `efficacy` | `efficacyClaims`、`benefits`（字符串或 `{text}`） |
| `oemDesc` | `oemDesc` | `customization`、`odmNote`、`customNotes` |

## `faq`

| 页面使用 | Sanity 优先 | 备选 |
|---------|------------|------|
| `q` | `question` | `q`、`title` |
| `a` | `answer` | `a`、`body`、`content`（字符串） |

## `post`（资讯 / 新闻）

| 页面使用 | Sanity 优先 | 备选 |
|---------|------------|------|
| `id` | `_id` 哈希 | — |
| `title` | `title` | `headline` |
| `category` | `category` 引用上的 `title` | `articleCategory`、`categoryLabel` |
| `date` | `publishedAt` / `date`（取 YYYY-MM-DD） | — |
| `readTime` | `readTime` | `readingTime`，默认 `5 min` |
| `views` | `views` | `viewCount`，默认 `—` |
| `img` | 主图 / 封面 `asset->url` | GROQ 投影 `coverUrl` |
| `summary` | `summary` | `excerpt`、`blurb` |
| `content[]` | Portable Text `body` → `{type:h2|p|quote,text}` | 无则 `plainBody` 或仅 `summary` 一段 |
| `faqs[]`（文末） | 内嵌 `faqs[]` 或 `relatedFaqs[]` | 子字段 `question`/`answer` 或 `q`/`a` |

## `productCategory` + `siteSettings`（筛选 Tab）

- Tab 文案优先：`siteSettings.productCategories` / `articleCategories`（字符串数组或 `{title}`）。
- 若无：分别用全部 `productCategory` 文档的 `title`/`name`，或由 `post` 推导出资讯分类（去重排序）。
- 首项统一为 **「全部」**（若 Settings 里已写「全部」会自动去重）。

## `siteSettings`（首页 Hero）

| 页面区域 | Sanity 字段 |
|---------|------------|
| 背景图 | `heroImage` / `homeHeroImage`（asset URL，GROQ 合成 `heroImageUrl`） |
| 主标题（支持 `\n` 换行） | `heroTitle`，无则尝试 `title`、`siteTitle` |
| 副标题 | `heroSubtitle`，无则 `tagline`、`description` |
| 认证角标 | `trustBadge`，无则 `certificationBadge` |

未配置上述字段时，首页仍使用原有硬编码文案与默认图。
