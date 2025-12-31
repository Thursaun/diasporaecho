import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      threshold: 1024, // Only compress files > 1KB
    })
  ],
  base: '/diasporaecho/',
  build: {
    target: 'es2020', // Modern browsers for smaller bundles
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    cssCodeSplit: true, // CSS per chunk for better caching
    sourcemap: false, // Smaller production builds
    chunkSizeWarningLimit: 500, // Warn if chunks > 500KB
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor bundles for better caching
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-bootstrap': ['react-bootstrap'],
        },
        // Organize assets by type
        assetFileNames: (assetInfo) => {
          if (/\.(css)$/.test(assetInfo.name)) {
            return 'assets/css/[name]-[hash][extname]';
          }
          if (/\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.name)) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          if (/\.(png|jpg|jpeg|gif|svg|webp|ico)$/.test(assetInfo.name)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ]
    }
  },
  server: {
    port: 5173
  }
})