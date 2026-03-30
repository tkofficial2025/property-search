import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { fetchNominatimSearchResults } from './src/lib/nominatimSearch'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname)

/** 本番は Vercel /api/geocode。pnpm dev では同一パスを Node から Nominatim に中継（CORS 回避） */
function geocodeApiDevPlugin(): Plugin {
  return {
    name: 'geocode-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url ?? ''
        const parsed = new URL(rawUrl, 'http://localhost')
        const pathname = parsed.pathname
        const isGeocodePath = pathname === '/api/geocode' || pathname.endsWith('/api/geocode')
        if (!isGeocodePath) {
          next()
          return
        }
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }
        try {
          const q = parsed.searchParams.get('q')
          if (!q?.trim()) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing q' }))
            return
          }
          const data = await fetchNominatimSearchResults(q)
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'public, max-age=86400')
          res.end(JSON.stringify(data))
        } catch (e) {
          const status = (e as { status?: number }).status === 429 ? 429 : 502
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'geocoding_failed' }))
        }
      })
    },
  }
}

export default defineConfig({
  root: projectRoot,
  server: {
    // Dropbox / 同期フォルダではネイティブの file watcher が不安定になり、HMR が落ちやすい
    watch: {
      usePolling: true,
      interval: 1000,
    },
    port: 5173,
    // 5173 が取れなければ起動失敗にする（別ポートで起動→古いタブが connection refused になるのを防ぐ）
    strictPort: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    geocodeApiDevPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(projectRoot, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'motion', 'leaflet', 'react-leaflet', 'sonner'],
    force: true, // 504 Outdated Optimize Dep 対策。解消したら false に戻してよい
  },
})
