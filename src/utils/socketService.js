// Socket 服务
import { WS_BASE_URL } from '../config/env'

// 常量定义
const CONSTANTS = {
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000,
  MOCK_DATA_DELAY: 2000,
  MOCK_MESSAGE_INTERVAL: 3000
}

class SocketService {
  constructor() {
    // 连接状态
    this.socket = null
    this.isConnected = false
    this.reconnectAttempts = 0

    // 配置参数
    this.maxReconnectAttempts = CONSTANTS.MAX_RECONNECT_ATTEMPTS
    this.reconnectDelay = CONSTANTS.RECONNECT_DELAY

    // 监听器管理
    this.listeners = {}

    // 消息队列（用于离线时缓存消息）
    this.messageQueue = []
  }

  // 获取单例实例
  static getInstance() {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService()
    }
    return SocketService.instance
  }

  // 连接 Socket
  connect() {
    if (this.socket && this.isConnected) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      try {
        // 使用配置的 WebSocket 服务器地址
        const url = WS_BASE_URL

        this.socket = new WebSocket(url + '?id=111111')

        this.socket.onopen = () => {
          console.log('Socket 连接成功')
          this.isConnected = true
          this.reconnectAttempts = 0

          // 发送队列中的消息
          this.flushMessageQueue()

          resolve()
        }

        this.socket.onclose = (event) => {
          console.log('Socket 连接关闭:', event.code, event.reason)
          this.isConnected = false
          this.handleReconnect()
        }

        this.socket.onerror = (error) => {
          console.error('Socket 连接错误:', error)
          this.isConnected = false
          // 不 reject，让 onclose 处理重连逻辑
          // reject(error)
        }

        this.socket.onmessage = (event) => {
          this.handleMessage(event)
        }
      } catch (error) {
        console.error('Socket 连接失败:', error)
        reject(error)
      }
    })
  }

  // 处理接收到的消息
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data)
      this.notifyListeners('message', data)
    } catch (error) {
      console.error('Socket 消息解析错误:', error)
      this.notifyListeners('error', { type: 'parse_error', error })
    }
  }

  // 模拟 mock 数据（已禁用，使用真实 WebSocket 数据）
  simulateMockData() {
    // Mock 数据已禁用，请确保 WebSocket 服务器正常运行
    console.log('Mock 数据已禁用，等待真实 WebSocket 消息...')
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
      this.isConnected = false
      this.listeners = {}
      this.messageQueue = []
    }
  }

  // 发送消息
  send(message) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        // 离线时将消息加入队列
        this.messageQueue.push(message)
        reject(new Error('Socket 未连接，消息已加入队列'))
        return
      }

      try {
        this.socket.send(JSON.stringify(message))
        resolve()
      } catch (error) {
        console.error('Socket 消息发送失败:', error)
        reject(error)
      }
    })
  }

  // 发送队列中的消息
  flushMessageQueue() {
    if (this.messageQueue.length > 0) {
      console.log(`发送队列中的 ${this.messageQueue.length} 条消息`)
      this.messageQueue.forEach(message => {
        this.send(message).catch(error => {
          console.error('队列消息发送失败:', error)
        })
      })
      this.messageQueue = []
    }
  }

  // 处理重连
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Socket 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      // 指数退避重连
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Socket 重连失败:', error)
        })
      }, delay)
    } else {
      console.error('Socket 重连失败，已达到最大尝试次数')
      this.notifyListeners('error', { type: 'reconnect_failed' })
    }
  }

  // 添加监听器
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)
  }

  // 移除监听器
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
  }

  // 通知监听器
  notifyListeners(event, data) {
    if (this.listeners[event]) {
      // 复制监听器数组，避免在遍历过程中修改
      const listeners = [...this.listeners[event]]
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Socket 监听器执行错误:', error)
        }
      })
    }
  }

  // 检查连接状态
  getConnectionStatus() {
    return this.isConnected
  }

  // 获取队列长度
  getQueueLength() {
    return this.messageQueue.length
  }
}

export default SocketService.getInstance()
