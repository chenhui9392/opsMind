/*
 * @Author: hui.chenn
 * @Description: Vite 配置 - 支持多环境
 * @Date: 2026-03-17 18:17:56
 * @LastEditTime: 2026-03-30 11:00:00
 * @LastEditors: hui.chenn
 */
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载对应的环境变量文件 (.env.development 或 .env.production)
  const env = loadEnv(mode, path.resolve(__dirname), '')

  // 获取版本检查域名用于代理配置
  const updateApiBaseUrl = env.VITE_UPDATE_API_BASE_URL || 'https://unitive-api.tineco.cn'

  return {
    plugins: [
      vue(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
        imports: ['vue', 'vue-router'],
        dts: true
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: true
      })
    ],
    base: './',
    server: {
      host: '0.0.0.0',
      port: parseInt(env.VITE_DEV_SERVER_PORT) || 9090,
      strictPort: false,
      webSecurity: false,
      proxy: {
        // 版本检查接口代理
        '/api/apprelease': {
          target: updateApiBaseUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/apprelease/, '/api/v2/apprelease')
        },
        // 版本检查接口代理
        '/hinton-agent-mario-server': {
          target: updateApiBaseUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/hinton-agent-mario-server/, '/hinton')
        },
        // cloud-test 环境接口代理
        '/cloud-api': {
          target: 'https://cloud-test.tineco.com',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/cloud-api/, '')
        }
      }
    },
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
      target: 'es2015',
    },
    // 定义环境变量前缀（只有以 VITE_ 开头的变量才会暴露给客户端代码）
    envPrefix: 'VITE_'
  }
})
