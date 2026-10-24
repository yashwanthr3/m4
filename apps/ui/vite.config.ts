import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Built to one HTML file; in dev, /api, /ws and /fonts go to the orchestrator.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:4317',
      '/fonts': 'http://127.0.0.1:4317',
      '/ws': { target: 'ws://127.0.0.1:4317', ws: true }
    }
  },
  build: { outDir: 'dist', emptyOutDir: true }
});
