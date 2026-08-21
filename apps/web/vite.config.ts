import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  server: { port: 3000 },
  plugins: [
    tanstackStart(
      mode === 'native'
        ? {
            spa: {
              enabled: true,
              prerender: { outputPath: '/index.html' },
            },
          }
        : {},
    ),
    tailwindcss(),
    react(),
  ],
}))
