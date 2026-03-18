/*
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-03-18 08:38:24
 * @LastEditTime: 2026-03-18 16:55:08
 * @LastEditors: hui.chenn
 */
import { upload, post } from '../utils/request'
import { API_BASE_URL, CHAT_API_BASE_URL } from '../config/env'

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
 * 获取系统用户名
 * @returns {Promise<string>} - 返回系统用户名
 */
export const getSystemUsername = async () => {
  let userName = 'unknown'
  try {
    if (window.systemInfo) {
      // 尝试同步获取用户名
      if (window.systemInfo.getUserNameSync) {
        try {
          userName = window.systemInfo.getUserNameSync() || 'unknown'
          console.log('Got username sync from systemInfo:', userName)
        } catch (syncError) {
          console.error('Error calling getUserNameSync:', syncError)
          
          // 同步失败，尝试异步获取
          if (window.systemInfo.getUserName) {
            try {
              userName = await window.systemInfo.getUserName() || 'unknown'
              console.log('Got username async from systemInfo:', userName)
            } catch (asyncError) {
              console.error('Error calling getUserName async:', asyncError)
            }
          }
        }
      } else if (window.systemInfo.getUserName) {
        // 只有异步方法
        try {
          userName = await window.systemInfo.getUserName() || 'unknown'
          console.log('Got username async from systemInfo:', userName)
        } catch (asyncError) {
          console.error('Error calling getUserName async:', asyncError)
        }
      }
    } else {
      console.log('systemInfo not available')
    }
  } catch (error) {
    console.error('Error getting username:', error)
  }
  
  console.log('Final username:', userName)
  return userName
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
