import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    // three.js vive num chunk próprio carregado sob demanda (logo 3D)
    chunkSizeWarningLimit: 700,
  },
  server: { host: true, port: 5173 },
});
