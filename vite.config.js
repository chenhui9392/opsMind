/*
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-03-17 18:17:56
 * @LastEditTime: 2026-03-19 10:23:45
 * @LastEditors: hui.chenn
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2
      },
      mangle: {
        toplevel: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue'],
          marked: ['marked']
        },
        compact: true
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false
      }
    },
    sourcemap: false,
    target: 'es2015'
  }
})
