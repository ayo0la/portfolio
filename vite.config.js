import { defineConfig } from 'vite'

export default defineConfig({
  // Rapier ships pre-built WASM — exclude from Vite's pre-bundling
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat'],
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'three-core': ['three'],
          'rapier':     ['@dimforge/rapier3d-compat'],
        }
      }
    }
  }
})
