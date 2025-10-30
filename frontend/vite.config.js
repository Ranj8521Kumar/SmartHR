import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      overlay: false
    },
    proxy: {
      // Proxy API calls during development to the backend server
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // Map "/api/..." from the frontend to backend "/api/v1/..."
        rewrite: (path) => path.replace(/^\/api/, '/api/v1')
      }
    }
  }
})
