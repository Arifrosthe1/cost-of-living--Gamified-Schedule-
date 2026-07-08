import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

const cleanUrlsPlugin = () => ({
  name: 'clean-urls',
  configureServer(server: any) {
    server.middlewares.use((req: any, _res: any, next: any) => {
      const url = req.url || '';
      if (url === '/app' || url.startsWith('/app?')) {
        const query = url.includes('?') ? url.substring(url.indexOf('?')) : '';
        req.url = '/app.html' + query;
      }
      next();
    });
  }
});

const removePwaFromIndexPlugin = () => ({
  name: 'remove-pwa-from-index',
  transformIndexHtml(html: string, ctx: any) {
    if (ctx.path === '/index.html' || ctx.filename.endsWith('index.html')) {
      return html
        .replace(/<link rel="manifest" [^>]*>/g, '')
        .replace(/<script[^>]*id="vite-plugin-pwa:[^"]*"[^>]*>.*?<\/script>/gs, '');
    }
    return html;
  }
});

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5199
  },
  plugins: [
    react(),
    cleanUrlsPlugin(),
    removePwaFromIndexPlugin(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Cost of Living',
        short_name: 'Cost of Living',
        description: 'Gamified daily schedule and habit tracking PWA',
        theme_color: '#ffffff',
        start_url: '/app',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          },
          {
            src: 'pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'app.html'
      }
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app.html')
      }
    }
  }
})
