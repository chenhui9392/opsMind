/*
 * @Author: hui.chenn
 * @Description: API接口服务 - 路径内置，仅接收参数
 * @Date: 2026-03-18 08:38:24
 * @LastEditTime: 2026-04-03 17:30:37
 * @LastEditors: hui.chenn
 */
import { upload, post, get } from '../utils/request'
import {API_BASE_URL, API_LOGIN_URL, DOWNLOAD_API_BASE_URL} from '../config/env'
import { getVersionCheckUrl } from '../config/updateConfig'

/**
 * 图片上传接口
 * @param {FormData} formData - 包含file和bucket的表单数据
 * @returns {Promise<Object>}
 */
export const uploadImage = (formData) => {
  return upload(`${API_LOGIN_URL}/basic/file/upload/multi`, formData)
}

/**
 * 发送聊天消息接口
 * @param {Object} params - 包含message、fileUrls、userName等参数
 * @param {AbortSignal} signal - 中断信号
 * @returns {Promise<Object>}
 */
export const sendChatMessage = (params, signal) => {
  return post(`${API_BASE_URL}/hinton-agent-mario-server/api/agentChat/chat`, params, signal)
}

/**
 * 下载软件接口
 * @param {string} id - 软件ID
 * @returns {Promise<Object>}
 */
export const downloadSoftware = (id) => {
  return post(`${DOWNLOAD_API_BASE_URL}/api/software/download/${id}`, {})
}

/**
 * 获取历史工单列表接口
 * @param {Object} params - 包含userName、分页等参数
 * @returns {Promise<Object>}
 */
export const getHistoryOrders = (params) => {
  return post(`${API_BASE_URL}/hinton-agent-mario-server/api/agentOrder/pageList`, params)
}

/**
 * 获取历史工单详情接口
 * @param {string} conversationId - 会话ID
 * @returns {Promise<Object>}
 */
export const getHistoryOrderDetail = (conversationId) => {
  return get(`${API_BASE_URL}/hinton-agent-mario-server/api/agentChat/history/${conversationId}`)
}

/**
 * 更新工单消息状态接口
 * @param {Object} params - 包含id、messageStatus等参数
 * @returns {Promise<Object>}
 */
export const updateMessageStatus = (params) => {
  return post(`${API_BASE_URL}/hinton-agent-mario-server/api/agentOrder/updateMessageStatus`, params)
}

/**
 * 检查应用版本更新接口
 * @returns {Promise<Object>}
 */
export const checkAppVersion = () => {
  return get(getVersionCheckUrl())
}

/**
 * 用户登录接口
 * @param {Object} params - 包含username、password等参数
 * @returns {Promise<Object>}
 */
export const login = (params) => {
  return post(`${API_LOGIN_URL}/user/v1.0/login/by-domain`, params)
}

/**
 * 获取系统配置树列表接口
 * @returns {Promise<Object>}
 */
export const getSystemConfigTree = () => {
  return get(`${API_BASE_URL}/hinton-agent-mario-server/ops/systemConfig/getTreeList`)
}
