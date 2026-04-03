/**
 * 根据 seed/content.js 生成 initial-content.ndjson，提交到仓库供 `sanity dataset import` 使用。
 * 在 studio 且目录下执行：node ./scripts/build-seed-ndjson.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSeedDocuments } from '../seed/content.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'seed', 'initial-content.ndjson');
const { siteSettingsDoc, homePageDoc, aboutPageDoc } = getSeedDocuments();
const lines = [
  JSON.stringify(siteSettingsDoc),
  JSON.stringify(homePageDoc),
  JSON.stringify(aboutPageDoc),
];
writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');
console.log(`[build-seed-ndjson] wrote ${outPath}`);
