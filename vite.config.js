import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,    // Allow external connections
    port: 5173     // Default port
  },
  build: {
    // Build optimizations
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom']
        }
      }
    },
    // Enable minification for production
    minify: 'terser',
    // Generate source maps for debugging
    sourcemap: false
  }
})