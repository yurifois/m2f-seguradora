import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    // three.js vive num chunk próprio carregado sob demanda (logo 3D)
    chunkSizeWarningLimit: 700,
    // duas páginas: a inicial e a central de dúvidas (/duvidas/)
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        duvidas: resolve(import.meta.dirname, 'duvidas/index.html'),
      },
    },
  },
  server: { host: true, port: 5173 },
});
