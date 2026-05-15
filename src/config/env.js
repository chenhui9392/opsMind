/*
 * @Author: hui.chenn
 * @Description: 环境配置 - 使用 Vite 环境变量
 * @Date: 2026-03-20 15:19:16
 * @LastEditTime: 2026-05-14 14:00:00
 * @LastEditors: hui.chenn
 */

// 使用 Vite 的环境变量（自动根据 .env.development/.env.beta/.env.production 加载）
// 开发环境: npm run dev (加载 .env.development)
// Beta 环境: npm run build:beta (加载 .env.beta)
// 生产环境: npm run build (加载 .env.production)

// 聊天接口域名
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// API 附件上传域名
export const API_LOGIN_URL = import.meta.env.VITE_API_LOGIN_URL

// 下载接口域名
export const DOWNLOAD_API_BASE_URL = import.meta.env.VITE_DOWNLOAD_API_BASE_URL

// WebSocket 服务器地址
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL

// 版本检查接口域名
export const UPDATE_API_BASE_URL = import.meta.env.VITE_UPDATE_API_BASE_URL

// 环境标识
// 使用 VITE_APP_ENV 环境变量来判断
export const APP_ENV = import.meta.env.VITE_APP_ENV

// Dev 开发环境
export const isDevEnv = APP_ENV === 'development'

// Beta 测试环境
export const isBetaEnv = APP_ENV === 'beta'

// 正式生产环境
export const isProdEnv = APP_ENV === 'production'

// 兼容旧的命名
export const isDev = isDevEnv || isBetaEnv
export const isProd = isProdEnv
