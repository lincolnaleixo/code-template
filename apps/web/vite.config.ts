import { loadClientEnv } from '@matrix/env/client'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const loadedEnvironment = loadEnv(mode, process.cwd(), '')
  const nativeBuild = mode === 'native' || process.env.MATRIX_NATIVE_BUILD === '1'

  if (nativeBuild) {
    loadClientEnv(
      {
        VITE_API_URL: loadedEnvironment.VITE_API_URL,
        VITE_APP_NAME: loadedEnvironment.VITE_APP_NAME,
      },
      'native',
    )
  }

  const apiTarget = loadedEnvironment.API_URL || 'http://localhost:3001'

  return {
    server: {
      port: 3000,
      proxy: nativeBuild
        ? undefined
        : {
            '/api': { target: apiTarget, changeOrigin: true },
            '/health': { target: apiTarget, changeOrigin: true },
            '/ready': { target: apiTarget, changeOrigin: true },
            '/metrics': { target: apiTarget, changeOrigin: true },
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
