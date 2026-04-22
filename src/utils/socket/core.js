/*
 * @Author: hui.chenn
 * @Description:
 * @Date: 2026-04-03 16:09:10
 * @LastEditTime: 2026-04-03 16:09:18
 * @LastEditors: hui.chenn
 */
// Socket 服务 - 支持多连接管理
import { WS_BASE_URL } from '../../config/env'

// 常量定义
const CONSTANTS = {
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,
  DEFAULT_CONNECTION_ID: 'default',
  // 心跳相关常量
  HEARTBEAT_INTERVAL: 30000,      // 心跳发送间隔（30秒）
  HEARTBEAT_TIMEOUT: 10000,       // 心跳响应超时时间（10秒）
  MAX_HEARTBEAT_TIMEOUTS: 3       // 最大心跳超时次数
}

/**
 * 单个 WebSocket 连接类
 * 负责管理单个连接的生命周期、消息处理和重连逻辑
 */
class SocketConnection {
  /**
   * @param {string} connectionId - 连接唯一标识
   * @param {Object} options - 配置选项
   * @param {string} options.url - WebSocket URL（可选，默认使用 WS_BASE_URL）
   * @param {number} options.maxReconnectAttempts - 最大重连次数
   * @param {number} options.reconnectDelay - 重连延迟（毫秒）
   * @param {Object} options.protocols - WebSocket 子协议
   */
  constructor(connectionId, options = {}) {
    this.connectionId = connectionId
    this.url = options.url || WS_BASE_URL
    this.maxReconnectAttempts = options.maxReconnectAttempts || CONSTANTS.MAX_RECONNECT_ATTEMPTS
    this.reconnectDelay = options.reconnectDelay || CONSTANTS.RECONNECT_DELAY
    this.protocols = options.protocols || undefined

    // 心跳配置
    this.heartbeatInterval = options.heartbeatInterval || CONSTANTS.HEARTBEAT_INTERVAL
    this.heartbeatTimeout = options.heartbeatTimeout || CONSTANTS.HEARTBEAT_TIMEOUT
    this.maxHeartbeatTimeouts = options.maxHeartbeatTimeouts || CONSTANTS.MAX_HEARTBEAT_TIMEOUTS

    // 连接状态
    this.socket = null
    this.isConnected = false
    this.isConnecting = false
    this.reconnectAttempts = 0
    this.reconnectTimer = null

    // 心跳状态
    this.heartbeatTimer = null           // 心跳发送定时器
    this.heartbeatTimeoutTimer = null    // 心跳响应超时定时器
    this.heartbeatTimeouts = 0           // 当前心跳超时次数
    this.waitingForPong = false          // 是否在等待 pong 响应

    // 重连控制
    this.shouldReconnect = true          // 是否应该重连（用户主动断开时设为 false）

    // 监听器管理
    this.listeners = {
      message: [],
      error: [],
      close: [],
      open: []
    }

    // 消息队列（用于离线时缓存消息）
    this.messageQueue = []

    // 连接配置
    this.queryParams = options.queryParams || {}
  }

  /**
   * 构建完整的 WebSocket URL
   * @returns {string} 完整的 URL
   * @private
   */
  _buildUrl() {
    let url = this.url
    const params = new URLSearchParams()

    // 添加 userName 参数，优先使用传入的参数，否则从 localStorage 获取
    const userName = this.queryParams.userName || localStorage.getItem('userName') || ''
    if (userName) {
      params.append('userName', userName)
    }

    // 添加其他查询参数（排除 userName 避免重复）
    Object.entries(this.queryParams).forEach(([key, value]) => {
      if (key !== 'userName') {
        params.append(key, value)
      }
    })

    const queryString = params.toString()
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString
    }

    return url
  }

  /**
   * 连接到 WebSocket 服务
   * @returns {Promise<void>}
   */
  connect() {
    // 默认允许重连
    this.shouldReconnect = true

    if (this.isConnected) {
      return Promise.resolve()
    }

    if (this.isConnecting) {
      return Promise.reject(new Error('连接正在进行中'))
    }

    this.isConnecting = true

    return new Promise((resolve, reject) => {
      try {
        const url = this._buildUrl()

        this.socket = new WebSocket(url, this.protocols)

        this.socket.onopen = (event) => {
          console.log(`[SocketConnection:${this.connectionId}] 连接成功`)
          this.isConnected = true
          this.isConnecting = false
          this.reconnectAttempts = 0

          // 启动心跳机制
          this._startHeartbeat()

          // 发送队列中的消息
          this._flushMessageQueue()

          // 通知 open 监听器
          this._notifyListeners('open', { type: 'open', event, connectionId: this.connectionId })

          resolve()
        }

        this.socket.onclose = (event) => {
          console.log(`[SocketConnection:${this.connectionId}] 连接关闭:`, event.code, event.reason)
          const wasConnected = this.isConnected

          // 停止心跳机制
          this._stopHeartbeat()

          this.isConnected = false
          this.isConnecting = false

          // 通知 close 监听器
          this._notifyListeners('close', {
            type: 'close',
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            connectionId: this.connectionId
          })

          // 只在 shouldReconnect 为 true 时尝试重连（意外断开时重连，用户主动断开时不重连）
          if (wasConnected && this.shouldReconnect) {
            this._handleReconnect()
          }

          // 重置 shouldReconnect 状态（为下次连接做准备）
          this.shouldReconnect = true
        }

        this.socket.onerror = (error) => {
          console.error(`[SocketConnection:${this.connectionId}] 连接错误:`, error)
          this.isConnecting = false

          // 通知 error 监听器
          this._notifyListeners('error', { type: 'error', error, connectionId: this.connectionId })
        }

        this.socket.onmessage = (event) => {
          this._handleMessage(event)
        }
      } catch (error) {
        console.error(`[SocketConnection:${this.connectionId}] 连接失败:`, error)
        this.isConnecting = false
        reject(error)
      }
    })
  }

  /**
   * 断开 WebSocket 连接
   * @param {number} code - 关闭代码
   * @param {string} reason - 关闭原因
   */
  disconnect(code = 1000, reason = '正常关闭') {
    // 标记为用户主动断开，不需要重连
    this.shouldReconnect = false

    // 停止心跳机制
    this._stopHeartbeat()

    // 清除重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socket) {
      // 移除所有事件监听器以避免触发重连
      this.socket.onclose = null
      this.socket.onerror = null
      this.socket.onmessage = null
      this.socket.onopen = null

      if (this.isConnected || this.isConnecting) {
        this.socket.close(code, reason)
      }

      this.socket = null
    }

    this.isConnected = false
    this.isConnecting = false
    this.reconnectAttempts = 0
    this.messageQueue = []
  }

  /**
   * 发送消息
   * @param {Object|string} message - 要发送的消息
   * @returns {Promise<void>}
   */
  send(message) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        // 离线时将消息加入队列
        this.messageQueue.push(message)
        reject(new Error(`[SocketConnection:${this.connectionId}] Socket 未连接，消息已加入队列`))
        return
      }

      try {
        const data = typeof message === 'string' ? message : JSON.stringify(message)
        this.socket.send(data)
        resolve()
      } catch (error) {
        console.error(`[SocketConnection:${this.connectionId}] 消息发送失败:`, error)
        reject(error)
      }
    })
  }

  /**
   * 处理接收到的消息
   * @param {MessageEvent} event - 消息事件
   * @private
   */
  _handleMessage(event) {
    // 检查是否是 pong 响应（心跳响应）
    if (event.data === 'pong' || event.data === '{"type":"pong"}') {
      this._handlePong()
      return
    }

    try {
      const data = JSON.parse(event.data)
      // 检查 JSON 格式的 pong 响应
      if (data.type === 'pong') {
        this._handlePong()
        return
      }
      this._notifyListeners('message', { ...data, connectionId: this.connectionId })
    } catch (error) {
      // JSON 解析失败
      // 1. 先检查是否是 pong 响应
      if (event.data === 'pong') {
        this._handlePong()
        return
      }

      // 2. 不是 pong，将原始数据作为 message 通知（不抛出错误，让监听器自己处理）
      console.warn(`[SocketConnection:${this.connectionId}] 消息非 JSON 格式，传递原始数据:`, event.data)
      this._notifyListeners('message', {
        type: 'raw',
        rawContent: event.data,
        connectionId: this.connectionId
      })
    }
  }

  /**
   * 处理 pong 响应
   * @private
   */
  _handlePong() {
    if (this.waitingForPong) {
      this.waitingForPong = false
      this.heartbeatTimeouts = 0
      // 清除心跳超时定时器
      if (this.heartbeatTimeoutTimer) {
        clearTimeout(this.heartbeatTimeoutTimer)
        this.heartbeatTimeoutTimer = null
      }
      console.log(`[SocketConnection:${this.connectionId}] 收到心跳响应`)
    }
  }

  /**
   * 发送队列中的消息
   * @private
   */
  _flushMessageQueue() {
    if (this.messageQueue.length > 0) {
      console.log(`[SocketConnection:${this.connectionId}] 发送队列中的 ${this.messageQueue.length} 条消息`)
      const queue = [...this.messageQueue]
      this.messageQueue = []

      queue.forEach(message => {
        this.send(message).catch(error => {
          console.error(`[SocketConnection:${this.connectionId}] 队列消息发送失败:`, error)
        })
      })
    }
  }

  // ==================== 心跳机制 ====================

  /**
   * 启动心跳机制
   * @private
   */
  _startHeartbeat() {
    // 先停止之前的心跳（避免重复）
    this._stopHeartbeat()

    console.log(`[SocketConnection:${this.connectionId}] 启动心跳机制，间隔: ${this.heartbeatInterval}ms`)

    // 重置心跳状态
    this.heartbeatTimeouts = 0
    this.waitingForPong = false

    // 启动定时发送心跳
    this.heartbeatTimer = setInterval(() => {
      this._sendHeartbeat()
    }, this.heartbeatInterval)
  }

  /**
   * 停止心跳机制
   * @private
   */
  _stopHeartbeat() {
    // 清除心跳发送定时器
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    // 清除心跳超时定时器
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer)
      this.heartbeatTimeoutTimer = null
    }

    // 重置状态
    this.heartbeatTimeouts = 0
    this.waitingForPong = false

    console.log(`[SocketConnection:${this.connectionId}] 心跳机制已停止`)
  }

  /**
   * 发送心跳 ping
   * @private
   */
  _sendHeartbeat() {
    if (!this.isConnected || !this.socket) {
      return
    }

    // 如果已经在等待 pong 响应，不发送新的 ping
    if (this.waitingForPong) {
      console.warn(`[SocketConnection:${this.connectionId}] 等待前一次心跳响应中，跳过本次发送`)
      return
    }

    console.log(`[SocketConnection:${this.connectionId}] 发送心跳 ping`)

    // 发送 ping 消息
    try {
      const pingMessage = JSON.stringify({ type: 'ping' })
      this.socket.send(pingMessage)
      this.waitingForPong = true

      // 启动超时检测
      this._startHeartbeatTimeoutCheck()
    } catch (error) {
      console.error(`[SocketConnection:${this.connectionId}] 心跳发送失败:`, error)
      // 发送失败，可能连接已断开，触发重连
      this._handleHeartbeatTimeout()
    }
  }

  /**
   * 启动心跳超时检测
   * @private
   */
  _startHeartbeatTimeoutCheck() {
    this.heartbeatTimeoutTimer = setTimeout(() => {
      console.warn(`[SocketConnection:${this.connectionId}] 心跳超时，未收到 pong 响应`)
      this._handleHeartbeatTimeout()
    }, this.heartbeatTimeout)
  }

  /**
   * 处理心跳超时
   * @private
   */
  _handleHeartbeatTimeout() {
    this.waitingForPong = false
    this.heartbeatTimeouts++

    console.warn(`[SocketConnection:${this.connectionId}] 心跳超时次数: ${this.heartbeatTimeouts}/${this.maxHeartbeatTimeouts}`)

    // 达到最大超时次数，认为连接已断开，触发重连
    if (this.heartbeatTimeouts >= this.maxHeartbeatTimeouts) {
      console.error(`[SocketConnection:${this.connectionId}] 心跳连续超时 ${this.heartbeatTimeouts} 次，判定连接已断开`)

      // 清除心跳超时定时器
      if (this.heartbeatTimeoutTimer) {
        clearTimeout(this.heartbeatTimeoutTimer)
        this.heartbeatTimeoutTimer = null
      }

      // 主动关闭连接并触发重连
      if (this.socket) {
        this.socket.close(4000, '心跳超时')
      }
    }
  }

  /**
   * 处理重连
   * @private
   */
  _handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`[SocketConnection:${this.connectionId}] 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      // 指数退避重连
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

      this.reconnectTimer = setTimeout(() => {
        this.connect().catch(error => {
          console.error(`[SocketConnection:${this.connectionId}] 重连失败:`, error)
        })
      }, delay)
    } else {
      console.error(`[SocketConnection:${this.connectionId}] 重连失败，已达到最大尝试次数`)
      this._notifyListeners('error', {
        type: 'reconnect_failed',
        connectionId: this.connectionId,
        attempts: this.reconnectAttempts
      })
    }
  }

  /**
   * 注册事件监听器
   * @param {string} event - 事件类型: 'message' | 'error' | 'close' | 'open'
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    if (typeof callback === 'function') {
      this.listeners[event].push(callback)
    }
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件类型
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
  }

  /**
   * 通知监听器
   * @param {string} event - 事件类型
   * @param {*} data - 事件数据
   * @private
   */
  _notifyListeners(event, data) {
    if (this.listeners[event]) {
      // 复制监听器数组，避免在遍历过程中修改
      const listeners = [...this.listeners[event]]
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`[SocketConnection:${this.connectionId}] 监听器执行错误:`, error)
        }
      })
    }
  }

  /**
   * 获取连接状态
   * @returns {boolean}
   */
  getConnectionStatus() {
    return this.isConnected
  }

  /**
   * 获取消息队列长度
   * @returns {number}
   */
  getQueueLength() {
    return this.messageQueue.length
  }

  /**
   * 获取连接 ID
   * @returns {string}
   */
  getId() {
    return this.connectionId
  }
}

/**
 * Socket 连接管理器
 * 负责管理多个 WebSocket 连接实例
 */
class SocketManager {
  constructor() {
    /** @type {Map<string, SocketConnection>} */
    this.connections = new Map()
  }

  /**
   * 创建新的连接
   * @param {string} connectionId - 连接唯一标识
   * @param {Object} options - 连接配置选项
   * @returns {SocketConnection} 连接实例
   */
  createConnection(connectionId, options = {}) {
    if (this.connections.has(connectionId)) {
      console.warn(`[SocketManager] 连接 ${connectionId} 已存在，返回现有实例`)
      return this.connections.get(connectionId)
    }

    const connection = new SocketConnection(connectionId, options)
    this.connections.set(connectionId, connection)
    return connection
  }

  /**
   * 获取指定连接
   * @param {string} connectionId - 连接 ID
   * @returns {SocketConnection|undefined}
   */
  getConnection(connectionId) {
    return this.connections.get(connectionId)
  }

  /**
   * 连接到指定的 WebSocket 服务
   * @param {string} connectionId - 连接 ID
   * @param {Object} options - 连接配置（如果是新连接）
   * @returns {Promise<void>}
   */
  connect(connectionId, options = {}) {
    let connection = this.connections.get(connectionId)

    if (!connection) {
      connection = this.createConnection(connectionId, options)
    }

    return connection.connect()
  }

  /**
   * 断开指定连接
   * @param {string} connectionId - 连接 ID
   * @param {number} code - 关闭代码
   * @param {string} reason - 关闭原因
   */
  disconnect(connectionId, code = 1000, reason = '正常关闭') {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.disconnect(code, reason)
      this.connections.delete(connectionId)
    } else {
      console.warn(`[SocketManager] 连接 ${connectionId} 不存在`)
    }
  }

  /**
   * 断开所有连接
   */
  disconnectAll() {
    this.connections.forEach((connection, id) => {
      connection.disconnect()
    })
    this.connections.clear()
  }

  /**
   * 向指定连接发送消息
   * @param {string} connectionId - 连接 ID
   * @param {Object|string} message - 消息内容
   * @returns {Promise<void>}
   */
  sendMessage(connectionId, message) {
    const connection = this.connections.get(connectionId)
    if (!connection) {
      return Promise.reject(new Error(`[SocketManager] 连接 ${connectionId} 不存在`))
    }
    return connection.send(message)
  }

  /**
   * 向所有连接广播消息
   * @param {Object|string} message - 消息内容
   */
  broadcast(message) {
    this.connections.forEach((connection, id) => {
      connection.send(message).catch(error => {
        console.error(`[SocketManager] 向 ${id} 广播消息失败:`, error)
      })
    })
  }

  /**
   * 为指定连接注册消息处理回调
   * @param {string} connectionId - 连接 ID
   * @param {Function} callback - 回调函数
   */
  onMessage(connectionId, callback) {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.on('message', callback)
    } else {
      console.warn(`[SocketManager] 连接 ${connectionId} 不存在，无法注册消息监听器`)
    }
  }

  /**
   * 为指定连接注册错误处理回调
   * @param {string} connectionId - 连接 ID
   * @param {Function} callback - 回调函数
   */
  onError(connectionId, callback) {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.on('error', callback)
    } else {
      console.warn(`[SocketManager] 连接 ${connectionId} 不存在，无法注册错误监听器`)
    }
  }

  /**
   * 为指定连接注册关闭事件回调
   * @param {string} connectionId - 连接 ID
   * @param {Function} callback - 回调函数
   */
  onClose(connectionId, callback) {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.on('close', callback)
    } else {
      console.warn(`[SocketManager] 连接 ${connectionId} 不存在，无法注册关闭监听器`)
    }
  }

  /**
   * 为指定连接注册打开事件回调
   * @param {string} connectionId - 连接 ID
   * @param {Function} callback - 回调函数
   */
  onOpen(connectionId, callback) {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.on('open', callback)
    } else {
      console.warn(`[SocketManager] 连接 ${connectionId} 不存在，无法注册打开监听器`)
    }
  }

  /**
   * 移除指定连接的监听器
   * @param {string} connectionId - 连接 ID
   * @param {string} event - 事件类型
   * @param {Function} callback - 回调函数
   */
  off(connectionId, event, callback) {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.off(event, callback)
    }
  }

  /**
   * 获取指定连接的状态
   * @param {string} connectionId - 连接 ID
   * @returns {boolean}
   */
  getConnectionStatus(connectionId) {
    const connection = this.connections.get(connectionId)
    return connection ? connection.getConnectionStatus() : false
  }

  /**
   * 获取所有连接的 ID 列表
   * @returns {string[]}
   */
  getConnectionIds() {
    return Array.from(this.connections.keys())
  }

  /**
   * 检查连接是否存在
   * @param {string} connectionId - 连接 ID
   * @returns {boolean}
   */
  hasConnection(connectionId) {
    return this.connections.has(connectionId)
  }

  /**
   * 获取连接数量
   * @returns {number}
   */
  getConnectionCount() {
    return this.connections.size
  }
}

/**
 * 向后兼容的 SocketService 类
 * 包装 SocketManager，提供与旧代码兼容的 API
 */
class SocketService {
  constructor() {
    this.manager = new SocketManager()
    // 默认连接 ID
    this.defaultConnectionId = CONSTANTS.DEFAULT_CONNECTION_ID
    // 保存对默认连接的引用以便快速访问
    this.defaultConnection = null
  }

  /**
   * 获取单例实例
   * @returns {SocketService}
   */
  static getInstance() {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService()
    }
    return SocketService.instance
  }

  /**
   * 确保默认连接存在
   * @private
   */
  _ensureDefaultConnection() {
    if (!this.defaultConnection) {
      this.defaultConnection = this.manager.createConnection(this.defaultConnectionId)
    }
    return this.defaultConnection
  }

  /**
   * 连接到 WebSocket 服务（向后兼容）
   * @returns {Promise<void>}
   */
  connect() {
    this._ensureDefaultConnection()
    return this.manager.connect(this.defaultConnectionId)
  }

  /**
   * 断开连接（向后兼容）
   */
  disconnect() {
    this.manager.disconnect(this.defaultConnectionId)
    this.defaultConnection = null
  }

  /**
   * 发送消息（向后兼容）
   * @param {Object|string} message - 消息内容
   * @returns {Promise<void>}
   */
  send(message) {
    this._ensureDefaultConnection()
    return this.manager.sendMessage(this.defaultConnectionId, message)
  }

  /**
   * 注册监听器（向后兼容）
   * @param {string} event - 事件类型: 'message' | 'error' | 'close' | 'open'
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    this._ensureDefaultConnection()
    const connection = this.manager.getConnection(this.defaultConnectionId)
    if (connection) {
      connection.on(event, callback)
    }
  }

  /**
   * 移除监听器（向后兼容）
   * @param {string} event - 事件类型
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    const connection = this.manager.getConnection(this.defaultConnectionId)
    if (connection) {
      connection.off(event, callback)
    }
  }

  /**
   * 获取连接状态（向后兼容）
   * @returns {boolean}
   */
  getConnectionStatus() {
    return this.manager.getConnectionStatus(this.defaultConnectionId)
  }

  /**
   * 获取消息队列长度（向后兼容）
   * @returns {number}
   */
  getQueueLength() {
    const connection = this.manager.getConnection(this.defaultConnectionId)
    return connection ? connection.getQueueLength() : 0
  }

  // ==================== 多连接管理 API ====================

  /**
   * 创建新的连接
   * @param {string} connectionId - 连接唯一标识
   * @param {Object} options - 连接配置选项
   * @returns {SocketConnection}
   */
  createConnection(connectionId, options = {}) {
    return this.manager.createConnection(connectionId, options)
  }

  /**
   * 获取指定连接
   * @param {string} connectionId - 连接 ID
   * @returns {SocketConnection|undefined}
   */
  getConnection(connectionId) {
    return this.manager.getConnection(connectionId)
  }

  /**
   * 连接到指定的 WebSocket 服务
   * @param {string} connectionId - 连接 ID
   * @param {Object} options - 连接配置（如果是新连接）
   * @returns {Promise<void>}
   */
  connectTo(connectionId, options = {}) {
    return this.manager.connect(connectionId, options)
  }

  /**
   * 断开指定连接
   * @param {string} connectionId - 连接 ID
   */
  disconnectFrom(connectionId) {
    this.manager.disconnect(connectionId)
  }

  /**
   * 向指定连接发送消息
   * @param {string} connectionId - 连接 ID
   * @param {Object|string} message - 消息内容
   * @returns {Promise<void>}
   */
  sendTo(connectionId, message) {
    return this.manager.sendMessage(connectionId, message)
  }

  /**
   * 为指定连接注册消息处理回调
   * @param {string} connectionId - 连接 ID
   * @param {Function} callback - 回调函数
   */
  onMessage(connectionId, callback) {
    this.manager.onMessage(connectionId, callback)
  }

  /**
   * 为指定连接注册错误处理回调
   * @param {string} connectionId - 连接 ID
   * @param {Function} callback - 回调函数
   */
  onError(connectionId, callback) {
    this.manager.onError(connectionId, callback)
  }

  /**
   * 为指定连接注册关闭事件回调
   * @param {string} connectionId - 连接 ID
   * @param {Function} callback - 回调函数
   */
  onClose(connectionId, callback) {
    this.manager.onClose(connectionId, callback)
  }

  /**
   * 为指定连接注册打开事件回调
   * @param {string} connectionId - 连接 ID
   * @param {Function} callback - 回调函数
   */
  onOpen(connectionId, callback) {
    this.manager.onOpen(connectionId, callback)
  }

  /**
   * 移除指定连接的监听器
   * @param {string} connectionId - 连接 ID
   * @param {string} event - 事件类型
   * @param {Function} callback - 回调函数
   */
  offFrom(connectionId, event, callback) {
    this.manager.off(connectionId, event, callback)
  }

  /**
   * 向所有连接广播消息
   * @param {Object|string} message - 消息内容
   */
  broadcast(message) {
    this.manager.broadcast(message)
  }

  /**
   * 断开所有连接
   */
  disconnectAll() {
    this.manager.disconnectAll()
    this.defaultConnection = null
  }

  /**
   * 获取所有连接的 ID 列表
   * @returns {string[]}
   */
  getConnectionIds() {
    return this.manager.getConnectionIds()
  }

  /**
   * 获取连接管理器实例（用于高级用法）
   * @returns {SocketManager}
   */
  getManager() {
    return this.manager
  }
}

// 导出单例实例（默认导出，保持向后兼容）
const socketService = SocketService.getInstance()
export default socketService

// 命名导出（用于需要多连接管理的场景）
export { SocketService, SocketManager, SocketConnection, CONSTANTS }
