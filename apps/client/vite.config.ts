import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  build: {
    target: 'es2023',
    sourcemap: true,
    // Never inline assets as data: URIs: each loads with its own group, by bytes (14 §11).
    assetsInlineLimit: 0,
  },
});
