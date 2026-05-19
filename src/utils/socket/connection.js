/*
 * @Author: hui.chenn
 * @Description:
 * @Date: 2026-04-03 16:09:44
 * @LastEditTime: 2026-04-03 16:09:55
 * @LastEditors: hui.chenn
 */
/**
 * Socket 连接服务
 * 统一管理应用中的 WebSocket 连接
 */
import socketService from './core.js'

// 连接配置
const CONNECTION_CONFIG = {
  // 默认连接 ID
  DEFAULT: 'default',
  // 通知连接 ID
  NOTIFICATION: 'notification'
}

/**
 * 初始化 Socket 连接
 * 在应用首页加载时调用
 * @param {string} [userName] - 可选的用户名参数
 */
export function initSocketConnection(userName) {
  // 先确保之前的监听器已清理，避免重复注册
  try {
    socketService.off('message', handleSocketMessage)
    socketService.off('error', handleSocketError)
    socketService.off('close', handleSocketClose)
    socketService.off('open', handleSocketOpen)
  } catch (error) {
    // 忽略清理错误
  }
  
  // 注册消息处理器
  socketService.on('message', handleSocketMessage)
  socketService.on('error', handleSocketError)
  socketService.on('close', handleSocketClose)
  socketService.on('open', handleSocketOpen)

  // 建立连接，传递用户名参数
  const options = userName ? { queryParams: { userName } } : {}
  socketService.connect(options).then(() => {
  }).catch(error => {
  })
}

/**
 * 处理 Socket 消息
 * @param {Object} data - 消息数据
 */
function handleSocketMessage(data) {
  // 根据消息类型分发处理
  switch (data.type) {
    case 'raw':
      // 处理原始非 JSON 格式消息
      handleRawMessage(data)
      break
    case 'notice':
      handleBroadcastMessage(data)
      break
    case 'system':
      handleSystemMessage(data)
      break
    case 'chat':
      handleChatMessage(data)
      break
    default:
      break
  }
}

/**
 * 处理原始非 JSON 格式消息
 * @param {Object} data - 消息数据
 */
function handleRawMessage(data) {
  // 触发自定义事件，让需要的地方处理原始消息
  window.dispatchEvent(new CustomEvent('socket:raw', {
    detail: data
  }))
}

/**
 * 处理广播消息
 * @param {Object} data - 消息数据
 */
function handleBroadcastMessage(data) {
  // 触发自定义事件，供其他组件监听
  window.dispatchEvent(new CustomEvent('socket:broadcast', {
    detail: data
  }))

  // 通过 IPC 发送未读消息通知到悬浮球窗口
  // 收到广播消息即视为有新的未读消息
  if (window.mainWindowAPI && window.mainWindowAPI.notifyUnreadMessage) {
    window.mainWindowAPI.notifyUnreadMessage(data)
  }
}

/**
 * 处理系统消息
 * @param {Object} data - 消息数据
 */
function handleSystemMessage(data) {
  window.dispatchEvent(new CustomEvent('socket:system', {
    detail: data
  }))
}

/**
 * 处理聊天消息
 * @param {Object} data - 消息数据
 */
function handleChatMessage(data) {
  window.dispatchEvent(new CustomEvent('socket:chat', {
    detail: data
  }))
}

/**
 * 处理 Socket 错误
 * @param {Object} error - 错误信息
 */
function handleSocketError(error) {
  window.dispatchEvent(new CustomEvent('socket:error', {
    detail: error
  }))
}

/**
 * 处理 Socket 关闭
 * @param {Object} event - 关闭事件
 */
function handleSocketClose(event) {
  window.dispatchEvent(new CustomEvent('socket:close', {
    detail: event
  }))
}

/**
 * 处理 Socket 打开
 * @param {Object} event - 打开事件
 */
function handleSocketOpen(event) {
  window.dispatchEvent(new CustomEvent('socket:open', {
    detail: event
  }))
}

/**
 * 断开 Socket 连接
 * 在应用卸载或需要断开时调用
 */
export function disconnectSocket() {
  socketService.off('message', handleSocketMessage)
  socketService.off('error', handleSocketError)
  socketService.off('close', handleSocketClose)
  socketService.off('open', handleSocketOpen)

  socketService.disconnect()
}

/**
 * 发送消息
 * @param {Object|string} message - 消息内容
 * @returns {Promise<void>}
 */
export function sendMessage(message) {
  return socketService.send(message)
}

/**
 * 获取连接状态
 * @returns {boolean}
 */
export function getConnectionStatus() {
  return socketService.getConnectionStatus()
}

// 导出配置常量
export { CONNECTION_CONFIG }

// 默认导出
export default {
  init: initSocketConnection,
  disconnect: disconnectSocket,
  send: sendMessage,
  getStatus: getConnectionStatus,
  CONNECTION_CONFIG
}
