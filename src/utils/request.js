// 网络请求封装

/**
 * 发送 GET 请求
 * @param {string} url - 请求地址
 * @param {Object} params - 请求参数
 * @returns {Promise} - 返回请求结果
 */
export const get = async (url, params = {}) => {
  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
  
  const response = await fetch(`${url}${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  return response.json()
}

/**
 * 发送 POST 请求
 * @param {string} url - 请求地址
 * @param {Object} data - 请求数据
 * @returns {Promise} - 返回请求结果
 */
export const post = async (url, data = {}) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  
  return response.json()
}

/**
 * 发送文件上传请求
 * @param {string} url - 请求地址
 * @param {FormData} formData - 表单数据
 * @returns {Promise} - 返回请求结果
 */
export const upload = async (url, formData) => {
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  })
  
  return response.json()
}
