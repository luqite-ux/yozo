import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { inquiryApiDevPlugin } from './vite-plugin-inquiry-api.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const key of Object.keys(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = env[key];
    }
  }

  return {
    plugins: [react(), tailwindcss(), inquiryApiDevPlugin()],
    server: {
      // 询盘 POST /api/inquiries 由 inquiryApiDevPlugin 处理；生产环境见 Vercel api/inquiries.js
    },
  };
});
