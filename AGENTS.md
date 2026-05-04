# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

B2B export/trade enterprise website template (monorepo). Three sub-packages:

| Package | Path | Dev command | Port | Purpose |
|---------|------|------------|------|---------|
| Website | `website/` | `npm run dev` (or root `npm run dev:website`) | 5173 | Vite + React 19 frontend |
| Studio | `studio/` | `npm run dev` (or root `npm run dev:studio`) | 3333 | Sanity Studio v3 CMS |
| Webhook | `webhook/` | `npm run dev` | 3000 | Translation webhook (optional) |

All content persistence is via **Sanity.io cloud** — no local database required.

### Environment variables

All required secrets (`VITE_SANITY_PROJECT_ID`, `SANITY_PROJECT_ID`, `SANITY_API_WRITE_TOKEN`, `SANITY_STUDIO_PROJECT_ID`, etc.) are injected as environment variables by the Cloud Agent platform. Before starting dev servers, create `.env` files from these env vars:

```bash
# website/.env
cat > website/.env << EOF
VITE_SANITY_PROJECT_ID=$VITE_SANITY_PROJECT_ID
VITE_SANITY_DATASET=$VITE_SANITY_DATASET
VITE_SANITY_API_VERSION=$VITE_SANITY_API_VERSION
VITE_SANITY_USE_CDN=$VITE_SANITY_USE_CDN
SANITY_PROJECT_ID=$SANITY_PROJECT_ID
SANITY_DATASET=$SANITY_DATASET
SANITY_API_VERSION=$VITE_SANITY_API_VERSION
SANITY_API_WRITE_TOKEN=$SANITY_API_WRITE_TOKEN
EOF

# studio/.env
cat > studio/.env << EOF
SANITY_STUDIO_PROJECT_ID=$SANITY_STUDIO_PROJECT_ID
SANITY_STUDIO_DATASET=$SANITY_STUDIO_DATASET
SANITY_STUDIO_TRANSLATION_WEBHOOK_URL=$SANITY_STUDIO_TRANSLATION_WEBHOOK_URL
SANITY_STUDIO_TRANSLATE_BYPASS_KEY=$SANITY_STUDIO_TRANSLATE_BYPASS_KEY
EOF
```

### Key commands (from root)

See `package.json` scripts. Summary:

- **Lint**: `npm run lint:website`
- **Schema validation**: `npm run validate:studio`
- **Build website**: `npm run build:website`
- **Build studio**: `npm run build:studio`
- **Dev website**: `npm run dev:website` (port 5173)
- **Dev studio**: `npm run dev:studio` (port 3333)
- **Sanity read verification**: `npm run verify:read` (requires `VITE_SANITY_PROJECT_ID`)

### Gotchas

- Each sub-package (`website/`, `studio/`, `webhook/`) uses its own `package-lock.json` and needs a separate `npm install`. There is no root lockfile or workspace hoisting.
- Sanity Studio requires authentication (Google/GitHub/email) to access the CMS interface — the login screen at localhost:3333 is expected behavior, not an error.
- The website uses a Vite dev proxy (`/__sanity-apicdn`) to avoid CORS issues with Sanity CDN in local development.
- The inquiry form POST (`/api/inquiries`) is handled by `vite-plugin-inquiry-api.js` during local dev; it requires `SANITY_API_WRITE_TOKEN` (without `VITE_` prefix) to write to Sanity.
- `studio/sanity.project.constants.js` has a fallback project ID; the `.env` / environment variable `SANITY_STUDIO_PROJECT_ID` takes precedence.

### Vercel + 多语言 + 翻译 Webhook（部署清单）

**前台（Website 项目，Root Directory = `website/`）**

- **构建/运行时**：`VITE_SANITY_PROJECT_ID`、`VITE_SANITY_DATASET`、`VITE_SANITY_API_VERSION`；询盘写库需要 **`SANITY_API_WRITE_TOKEN`**（勿加 `VITE_`）。
- **Sanity 控制台**：打开 [sanity.io/manage](https://www.sanity.io/manage) → 对应项目 → **API** → **CORS origins**，加入官网的 **`https://…vercel.app`** 与正式域名，否则浏览器读 CDN 会 **403**。
- **多语言路由**：`/en/...`、`/pt/...` 等为 SPA 路由；`website/vercel.json` 已把非 `/api/` 请求 rewrite 到 `index.html`，一般无需改。

**后台（Studio 项目，Root Directory = `studio/`）**

- **`SANITY_STUDIO_PROJECT_ID` / `SANITY_STUDIO_DATASET`**：与前台同一 Sanity 项目、同一 dataset（通常为 `production`）。
- **`SANITY_STUDIO_TRANSLATION_WEBHOOK_URL`**（发布/「同步翻译」时 **必填**）：指向公网 **HTTPS** 的翻译服务，路径须为 **`…/webhook/translate`**（见 `webhook/server.js`）。仅填 `api.deepseek.com` 无效；DeepSeek 由 webhook 服务端调用。
- 若 webhook 配置了 **`SANITY_WEBHOOK_SECRET`**：Studio 与 webhook 须配置相同的 **`SANITY_STUDIO_TRANSLATE_BYPASS_KEY`**。
- 若 Studio 使用 **自定义域名**（非 `*.vercel.app` / 非 localhost）：在 webhook 环境变量 **`SANITY_STUDIO_TRANSLATE_CORS_ORIGINS`** 中加入 Studio 的 `https://你的-studio-域名`（见 `webhook/.env.example`）。

**翻译服务（单独 Node 进程，非 Vercel 上 Studio 的一部分）**

- 环境需与内容库一致：`SANITY_PROJECT_ID`、`SANITY_DATASET`、`SANITY_API_WRITE_TOKEN`（或 `SANITY_WRITE_TOKEN`）、**`DEEPSEEK_API_KEY`**。
- 本地：`npm run dev --prefix webhook`（默认 **3000**）。`studio` 在 localhost / 127.0.0.1 时若未配置 URL，会默认请求 `http://127.0.0.1:3000/webhook/translate`（见 `studio/lib/translationWebhook.js`）。**Vercel 上部署的 Studio 不能使用 localhost**，须在 Vercel 环境变量中设置公网 `https://…/webhook/translate`。

**「中文编辑 → 其他语言显示」在数据上如何成立**

- 可翻译类型在 **发布（Publish）** 后会自动 POST 当前已发布文档到 Webhook；亦可手动点 **「同步翻译多语言」**。
- 前台始终读 **Sanity 已发布文档**里的 `name_en` 等字段；`localizeProduct` / `pickCmsLocaleField` 按 URL 语言前缀切换展示。Webhook 未跑成功或未发布，则外语文本仍为空或回退逻辑生效。
