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

## 导入前台默认文案（可选）

将 `website/src/App.jsx` 在「无 CMS 数据」时使用的兜底文案写入 **站点设置** 与 **首页** 单例（`_id`: `siteSettings`、`homePage`）。需在 `studio/.env` 或 `website/.env.local` 中配置 **`SANITY_API_WRITE_TOKEN`**（与询盘写入同一 Token）。

```bash
npm run seed:defaults
```

写入后请在 Studio 内 **Publish** 对应文档，前台即可从 Sanity 读取。

## 部署

```bash
npm run deploy
```

与前台共用同一 Sanity Project / Dataset。首屏单例建议在 Desk「站点与首页」中创建 **全局设置** 与 **首页**。
