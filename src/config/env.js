/*
 * @Author: hui.chenn
 * @Description: 环境配置 - 使用 Vite 环境变量
 * @Date: 2026-03-20 15:19:16
 * @LastEditTime: 2026-03-30 11:00:00
 * @LastEditors: hui.chenn
 */

// 使用 Vite 的环境变量（自动根据 .env.development 或 .env.production 加载）
// 开发环境: npm run dev (加载 .env.development)
// 生产环境: npm run build (加载 .env.production)

// API 基础域名
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// 聊天接口域名
export const CHAT_API_BASE_URL = import.meta.env.VITE_CHAT_API_BASE_URL

// WebSocket 服务器地址
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL

// 版本检查接口域名
export const UPDATE_API_BASE_URL = import.meta.env.VITE_UPDATE_API_BASE_URL

// 环境标识
export const isDev = import.meta.env.DEV
export const isProd = import.meta.env.PROD
