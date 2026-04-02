import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { inquiryApiDevPlugin } from './vite-plugin-inquiry-api.js';

/** 与 src/lib/sanity/client.js 中保持一致 */
const SANITY_BROWSER_PROXY = '/__sanity-apicdn';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of Object.keys(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = env[key];
    }
  }

  const projectId = env.VITE_SANITY_PROJECT_ID?.trim();
  const apicdnTarget = projectId ? `https://${projectId}.apicdn.sanity.io` : null;
  const sanityProxy = apicdnTarget
    ? {
        [SANITY_BROWSER_PROXY]: {
          target: apicdnTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(new RegExp(`^${SANITY_BROWSER_PROXY}`), ''),
        },
      }
    : {};

  return {
    plugins: [react(), tailwindcss(), inquiryApiDevPlugin()],
    server: {
      proxy: { ...sanityProxy },
      // 询盘 POST /api/inquiries 由 inquiryApiDevPlugin 处理；生产环境见 Vercel api/inquiries.js
    },
    preview: {
      proxy: { ...sanityProxy },
    },
  };
});
