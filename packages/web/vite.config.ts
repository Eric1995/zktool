import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      deleteOriginFile: true,
    }),
  ],
  define: {
    PRIMARY_COLOR: JSON.stringify('#4b35f6'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '~': path.resolve(__dirname, 'node_modules'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  build: {
    outDir: '../server/dist/static',
    minify: true,
    sourcemap: false,
    target: 'esnext',
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  server: {
    port: 8090,
    proxy: {
      '/zookeeper': 'http://127.0.0.1:8092',
    },
  },
});
