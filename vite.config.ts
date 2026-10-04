import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(process.cwd(), 'client'),
  publicDir: path.resolve(process.cwd(), 'public'),
  build: {
    outDir: path.resolve(process.cwd(), 'dist/client'),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['.manus.computer'],
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
