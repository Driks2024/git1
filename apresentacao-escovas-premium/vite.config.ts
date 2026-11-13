/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` gera a versão normal (dist/ com assets separados).
// `npm run build:single` gera um único HTML autocontido em dist-single/,
// útil para enviar a apresentação como arquivo.
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: './',
    plugins: [react(), ...(single ? [viteSingleFile()] : [])],
    build: {
      outDir: single ? 'dist-single' : 'dist',
      assetsInlineLimit: single ? 100_000_000 : 4096,
      chunkSizeWarningLimit: 1600,
    },
    test: {
      include: ["src/**/*.test.ts"],
      environment: 'node',
    },
  };
});
