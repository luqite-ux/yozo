# 前台 Website

详见仓库根目录 [../README.md](../README.md)。

## 常用命令

- `npm run dev` — 需配置 `.env` 或 `.env.local`：`VITE_SANITY_*`；询盘还需 **`SANITY_PROJECT_ID`**、**`SANITY_API_WRITE_TOKEN`**（**禁止** `VITE_` 前缀）
- `npm run build` / `npm run lint`
- **只读连通性自检**（在项目根执行）：`npm run verify:read`（内部调用 `website/scripts/verify-sanity-read.mjs`）

## 部署

以本目录为 Vercel Root，`vercel.json` 已配置 SPA + `/api/inquiries`。
