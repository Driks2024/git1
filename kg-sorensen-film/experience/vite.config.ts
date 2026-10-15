import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'node:path';

const single = process.env.SINGLE === '1';

export default defineConfig({
  root: resolve(__dirname),
  base: './',
  publicDir: false,
  server: { port: 5173, host: '127.0.0.1', fs: { allow: [resolve(__dirname, '..')] } },
  preview: { port: 4173, host: '127.0.0.1' },
  build: {
    outDir: resolve(__dirname, single ? '../dist/single' : '../dist/experience'),
    emptyOutDir: true,
    target: 'es2022',
    assetsInlineLimit: single ? 100_000_000 : 4096,
    chunkSizeWarningLimit: 2000,
    rollupOptions: { input: resolve(__dirname, 'index.html') },
  },
  plugins: single ? [viteSingleFile({ removeViteModuleLoader: true })] : [],
});
