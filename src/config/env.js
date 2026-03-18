// 环境配置
// const isDev = process.env.NODE_ENV === 'development'

const isDev = true
// 域名配置
export const API_BASE_URL = isDev ? 'https://css-test.tineco.com' : 'https://css.tineco.com'

// 聊天接口域名
export const CHAT_API_BASE_URL = isDev ? 'https://cloud-test.tineco.com' : 'https://cloud.tineco.com'
