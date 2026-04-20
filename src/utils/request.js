// 网络请求封装

/**
 * 获取请求 headers，自动添加 token
 * @param {Object} extraHeaders - 额外的 headers
 * @returns {Object} - 返回 headers 对象
 */
const getHeaders = (extraHeaders = {}) => {
  const headers = { ...extraHeaders }
  const token = localStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

/**
 * 发送 GET 请求
 * @param {string} url - 请求地址
 * @param {Object} params - 请求参数
 * @param {AbortSignal} signal - 用于中断请求的 AbortSignal
 * @returns {Promise} - 返回请求结果
 */
export const get = async (url, params = {}, signal = null) => {
  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')

  const options = {
    method: 'GET',
    headers: getHeaders({ 'Content-Type': 'application/json' })
  }

  if (signal) {
    options.signal = signal
  }

  const response = await fetch(`${url}${queryString ? `?${queryString}` : ''}`, options)

  return response.json()
}

/**
 * 发送 POST 请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求数据
 * @param {AbortSignal} signal - 用于中断请求的 AbortSignal
 * @returns {Promise} - 返回请求结果
 */
export const post = async (url, data = {}, signal = null) => {
  const options = {
    method: 'POST',
    headers: getHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data)
  }

  if (signal) {
    options.signal = signal
  }

  const response = await fetch(url, options)

  return response.json()
}

/**
 * 发送文件上传请求
 * @param {string} url - 请求地址
 * @param {FormData} formData - 表单数据
 * @param {AbortSignal} signal - 用于中断请求的 AbortSignal
 * @returns {Promise} - 返回请求结果
 */
export const upload = async (url, formData, signal = null) => {

  const options = {
    method: 'POST',
    headers: getHeaders(),
    body: formData
  }

  if (signal) {
    options.signal = signal
  }

  const response = await fetch(url, options)

  return response.json()
}
