import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname)

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
