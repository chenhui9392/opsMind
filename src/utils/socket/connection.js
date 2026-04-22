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
 */
export function initSocketConnection() {
  // 注册消息处理器
  socketService.on('message', handleSocketMessage)
  socketService.on('error', handleSocketError)
  socketService.on('close', handleSocketClose)
  socketService.on('open', handleSocketOpen)

  // 建立连接
  socketService.connect().then(() => {
    console.log('[SocketConnectionService] Socket 连接成功')
  }).catch(error => {
    console.error('[SocketConnectionService] Socket 连接失败:', error)
  })
}

/**
 * 处理 Socket 消息
 * @param {Object} data - 消息数据
 */
function handleSocketMessage(data) {
  console.log('[SocketConnectionService] 收到消息:', data)
  console.log('[SocketConnectionService] 消息类型:', data.type)

  // 根据[object Object]消息类型分发处理
  switch (data.type) {
    case 'raw':
      // 处理原始非 JSON 格式消息
      handleRawMessage(data)
      break
    case 'notice':
      console.log('[SocketConnectionService] 分发到广播消息处理器')
      handleBroadcastMessage(data)
      break
    case 'system':
      handleSystemMessage(data)
      break
    case 'chat':
      handleChatMessage(data)
      break
    default:
      console.log('[SocketConnectionService] 未知消息类型:', data.type)
      break
  }
}

/**
 * 处理原始非 JSON 格式消息
 * @param {Object} data - 消息数据
 */
function handleRawMessage(data) {
  console.log('[SocketConnectionService] 收到原始格式消息:', data.rawContent)

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
  console.log('[SocketConnectionService] 触发 socket:broadcast 事件:', data)
  // 触发自定义事件，供其他组件监听
  window.dispatchEvent(new CustomEvent('socket:broadcast', {
    detail: data
  }))

  // 通过 IPC 发送未读消息通知到悬浮球窗口
  // 悬浮球和 ChatHeader 都会收到此通知，各自维护自己的计数
  if (data.type === 'broadcast' && data.message) {
    console.log('[SocketConnectionService] 发送未读消息通知到悬浮球')
    if (window.mainWindowAPI && window.mainWindowAPI.notifyUnreadMessage) {
      window.mainWindowAPI.notifyUnreadMessage(data)
    }
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
  console.error('[SocketConnectionService] Socket 错误:', error)

  window.dispatchEvent(new CustomEvent('socket:error', {
    detail: error
  }))
}

/**
 * 处理 Socket 关闭
 * @param {Object} event - 关闭事件
 */
function handleSocketClose(event) {
  console.log('[SocketConnectionService] Socket 连接关闭:', event)

  window.dispatchEvent(new CustomEvent('socket:close', {
    detail: event
  }))
}

/**
 * 处理 Socket 打开
 * @param {Object} event - 打开事件
 */
function handleSocketOpen(event) {
  console.log('[SocketConnectionService] Socket 连接打开')

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
  console.log('[SocketConnectionService] Socket 连接已断开')
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
