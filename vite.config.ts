import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    // Use jsdom so React components can render in a simulated browser environment
    environment: 'jsdom',
    // Import jest-dom matchers (toBeInTheDocument, toHaveTextContent, etc.)
    // globally so every test file gets them without an explicit import
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
