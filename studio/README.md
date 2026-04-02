# Huanqiu · 外贸企业官网后台（Sanity Studio）

标准 schema + 自定义 Structure，便于复用到新客户站点。

## 启动

```bash
cp .env.example .env
# 填写 SANITY_STUDIO_PROJECT_ID、SANITY_STUDIO_DATASET
npm install
npm run dev
```

## Schema 校验

```bash
npm run validate
```

或在仓库根目录：`npm run validate:studio`。

## 导入前台默认文案（必选一次，否则后台多为空）

将 `website/src/App.jsx` 在「无 CMS 数据」时的兜底文案写入 **站点设置**、**首页**（`_id`: `siteSettings`、`homePage`）。**不会自动填充**，需任选其一：

1. **API 写入**：在 **`website/.env.local`** 配置 **`SANITY_API_WRITE_TOKEN`**（与询盘相同），然后在 `studio` 目录执行 `npm run seed:defaults`，再回到 Studio **刷新**即可。
2. **NDJSON 导入**：`sanity login` 后执行 `sanity dataset import ./seed/initial-content.ndjson production --replace`（数据集名按实际修改）。详见 `seed/README.txt`。

## 部署

```bash
npm run deploy
```

与前台共用同一 Sanity Project / Dataset。首屏单例建议在 Desk「站点与首页」中创建 **全局设置** 与 **首页**。
