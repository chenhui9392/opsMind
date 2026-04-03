/*
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-04-03 16:07:00
 * @LastEditTime: 2026-04-03 16:07:08
 * @LastEditors: hui.chenn
 */
/**
 * Socket 模块统一入口
 * 整合所有 Socket 相关功能
 */

// 导入核心 Socket 服务
import socketService, {
  SocketService,
  SocketManager,
  SocketConnection,
  CONSTANTS
} from './core.js'

// 导入连接管理服务
import socketConnectionService, {
  initSocketConnection,
  disconnectSocket,
  sendMessage,
  getConnectionStatus,
  CONNECTION_CONFIG
} from './connection.js'

// 统一导出
export {
  // 核心类
  SocketService,
  SocketManager,
  SocketConnection,
  CONSTANTS,

  // 连接管理方法
  initSocketConnection,
  disconnectSocket,
  sendMessage,
  getConnectionStatus,
  CONNECTION_CONFIG,

  // 默认导出
  socketService,
  socketConnectionService
}

// 默认导出 socketService（保持向后兼容）
export default socketService
