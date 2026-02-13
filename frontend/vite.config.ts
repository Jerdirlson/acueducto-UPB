import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Check if running in Electron context
const isElectron = process.env.ELECTRON === 'true';

export default defineConfig({
  // Use relative base for Electron
  base: isElectron ? './' : '/',
  
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.browser': true,
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'pouchdb': 'pouchdb/dist/pouchdb.js'
    }
  },
  
  optimizeDeps: {
    include: ['pouchdb', 'chart.js', 'jspdf'],
    exclude: [],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Acueducto Rural - UPB',
        short_name: 'Acueducto UPB',
        description: 'Gestión Comunitaria de Acueducto Rural',
        theme_color: '#e3007b',
        icons: []
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Target modern browsers for Electron
    target: isElectron ? 'esnext' : 'es2015',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    copyPublicDir: true
  },
  
  publicDir: 'public'
});
