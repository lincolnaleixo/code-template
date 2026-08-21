import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const nativeBuild = mode === 'native'
  const apiTarget = process.env.API_URL ?? 'http://localhost:3001'

  return {
    server: {
      port: 3000,
      proxy: nativeBuild
        ? undefined
        : {
            '/api': { target: apiTarget, changeOrigin: true },
            '/health': { target: apiTarget, changeOrigin: true },
            '/ready': { target: apiTarget, changeOrigin: true },
          },
    },
    plugins: [
      tanstackStart(
        nativeBuild
          ? {
              spa: {
                enabled: true,
                prerender: { outputPath: '/index.html' },
              },
            }
          : {},
      ),
      ...(nativeBuild ? [] : [nitro({ preset: 'bun' })]),
      tailwindcss(),
      react(),
    ],
  }
})
