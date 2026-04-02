/**
 * Studio 的 projectId 本身可公开（与前台 VITE_SANITY_PROJECT_ID 一致即可）。
 * Sanity 构建会把 SANITY_STUDIO_* 注入 process.env；若 CI/Vercel 未注入成功，
 * 可在此填写与 manage.sanity.io 相同的 ID，避免线上仍打空包。
 * 多仓库模板可保持空字符串，仅依赖环境变量。
 */
export const STUDIO_PROJECT_ID_FALLBACK = 'ysqrwi9b';
