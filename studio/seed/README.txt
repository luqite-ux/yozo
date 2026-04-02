前台默认文案写入 Sanity 的两种方式（内容相同：站点设置 + 首页）

【方式 A】API 写入（推荐，一次到位）
  1. 在 website/.env.local 填写 SANITY_API_WRITE_TOKEN=（与询盘 API 相同，须具备写文档权限）
  2. 在 studio 目录：npm run seed:defaults
  3. 回到 Studio 刷新「站点设置」「首页」——页脚/导航等应已有字。

【方式 B】不配置 Token：用 Sanity CLI 导入本目录 initial-content.ndjson
  1. cd studio
  2. npx sanity@latest login
  3. npx sanity@latest dataset import ./seed/initial-content.ndjson production --replace
     （若 dataset 不是 production，请改命令中的数据集名）
  4. 若 CLI 提示选项目，选与前台相同的 project。

注意：代码或 seed 变更后，可运行 node ./scripts/build-seed-ndjson.mjs 重新生成 initial-content.ndjson。
