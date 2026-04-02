# Hongchao · 外贸企业官网后台（Sanity Studio）

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

## 部署

```bash
npm run deploy
```

与前台共用同一 Sanity Project / Dataset。首屏单例建议在 Desk「站点与首页」中创建 **全局设置** 与 **首页**。
