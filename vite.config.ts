
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 9000, // 我們可以指定一個端口
    // --- 關鍵修正：加入 Headers 來覆寫開發環境的權限原則 ---
    headers: {
      // 允許地理位置 (Geolocation) API
      'Permissions-Policy': 'geolocation=(self)',
    },
  },
  // Vite 的 CSS 處理設定
  css: {
    // 指定 PostCSS 設定檔的路徑
    postcss: './postcss.config.js',
  },
  // 專案建置 (Build) 相關設定
  build: {
    // 指定建置後的輸出目錄
    outDir: 'dist',
    // 在建置時也產生 sourcemap，方便除錯
    sourcemap: true,
  },
});
