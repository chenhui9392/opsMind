/*
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-03-18 08:38:24
 * @LastEditTime: 2026-03-18 17:07:27
 * @LastEditors: hui.chenn
 */
import { upload, post } from '../utils/request'
import { API_BASE_URL, CHAT_API_BASE_URL } from '../config/env'
import { getSystemUsername } from '../utils/system'

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
  const userName = await getSystemUsername()
  
  return  await post(`${CHAT_API_BASE_URL}/omp/api/agentChat/chat`, {
    ...params,
    userName: userName,
  })
}
