/*
 * @Author: hui.chenn
 * @Description:
 * @Date: 2026-03-20 15:19:16
 * @LastEditTime: 2026-03-26 13:24:31
 * @LastEditors: hui.chenn
 */
// 环境配置
// const isDev = process.env.NODE_ENV === 'development'

const isDev = true
// 域名配置
export const API_BASE_URL = isDev ? 'https://css-test.tineco.com' : 'https://css.tineco.com'

// 聊天接口域名
export const CHAT_API_BASE_URL = isDev ? 'https://cloud-test.tineco.com' : 'https://cloud.tineco.com'
// export const CHAT_API_BASE_URL = 'http://10.100.60.57:8084'


// WebSocket 服务器地址
// export const WS_BASE_URL = 'ws://10.100.60.55:8084/omp/ws-native'
export const WS_BASE_URL = `ws://cloud-test.tineco.com/omp/ws-native`
