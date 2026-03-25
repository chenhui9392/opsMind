/*
 * @Author: hui.chenn
 * @Description:
 * @Date: 2026-03-18 08:38:24
 * @LastEditTime: 2026-03-25 09:21:34
 * @LastEditors: hui.chenn
 */
import { upload, post, get } from '../utils/request'
import { API_BASE_URL, CHAT_API_BASE_URL } from '../config/env'
import { getSystemUsername } from '../utils/system'

// 用于中断发送消息请求的控制器
let chatAbortController = null

/**
 * 图片上传接口
 * @param {File} file - 图片文件
 * @returns {Promise<string>} - 返回图片访问路径
 */
export const uploadImage = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bucket', 'CSS-01')

  const data = await upload(`${API_BASE_URL}/gateway/fileServer/v4/upload/single`, formData)
  if (data.success) {
    return data.data.accessPath.trim()
  } else {
    throw new Error('上传失败')
  }
}

/**
 * 发送聊天消息接口
 * @param {Object} params - 消息参数
 * @param {string} params.message - 消息内容
 * @param {Array} params.fileUrls - 图片URL数组
 * @param {string} params.userName - 用户名
 * @returns {Promise<Object>} - 返回响应数据
 */
export const sendChatMessage = async (params) => {
  console.log('sendChatMessage called with params:', params)
  // const userName = await getSystemUsername()
  const userName = 'hui.chenn'

  // 创建新的 AbortController
  chatAbortController = new AbortController()

  try {
    const result = await post(`${CHAT_API_BASE_URL}/omp/api/agentChat/chat`, {
      ...params,
      userName: userName,
    }, chatAbortController.signal)
    return result
  } finally {
    // 请求完成后清空控制器
    chatAbortController = null
  }
}

/**
 * 中断发送消息请求
 */
export const abortChatRequest = () => {
  if (chatAbortController) {
    chatAbortController.abort()
    chatAbortController = null
    console.log('发送消息请求已中断')
  }
}

/**
 * 下载软件接口
 * @param {string} id - 软件 ID
 * @returns {Promise<Object>} - 返回响应数据
 */
export const downloadSoftware = async (id) => {
  const downloadUrl = `${CHAT_API_BASE_URL}/api/software/download/${id}`
  // 发送 POST 请求
  return await post(downloadUrl, {})
}

/**
 * 获取历史工单列表接口
 * @param {Object} params - 请求参数（分页等）
 * @returns {Promise<Object>} - 返回响应数据
 */
export const getHistoryOrders = async (params = {}) => {
  try {
    const userName = await getSystemUsername()
    // 默认请求参数
    const defaultParams = {
      ...params,
      userName: userName
    }
    return await post(`${CHAT_API_BASE_URL}/omp/api/agentOrder/pageList`, defaultParams)
  } catch (error) {
    throw error
  }
}

/**
 * 获取历史工单详情接口
 * @param {string} conversationId - 会话ID
 * @returns {Promise<Object>} - 返回响应数据
 */
export const getHistoryOrderDetail = async (conversationId) => {
  try {
    return await get(`${CHAT_API_BASE_URL}/omp/api/agentChat/history/${conversationId}`)
  } catch (error) {
    throw error
  }
}

/**
 * 更新工单消息状态接口
 * @param {string} id - 工单ID
 * @param {string} messageStatus - 消息状态
 * @returns {Promise<Object>} - 返回响应数据
 */
export const updateMessageStatus = async (id, messageStatus) => {
  try {
    return await post(`${CHAT_API_BASE_URL}/omp/api/agentOrder/updateMessageStatus`, {
      id,
      messageStatus
    })
  } catch (error) {
    throw error
  }
}
