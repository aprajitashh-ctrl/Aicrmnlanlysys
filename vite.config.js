import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/analyze': { target: 'http://localhost:5000', changeOrigin: true },
      '/graph': { target: 'http://localhost:5000', changeOrigin: true },
      '/insights': { target: 'http://localhost:5000', changeOrigin: true },
      '/suspicious': { target: 'http://localhost:5000', changeOrigin: true },
      '/search': { target: 'http://localhost:5000', changeOrigin: true }
    }
  }
});
