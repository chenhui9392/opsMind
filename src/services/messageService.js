/**
 * 消息管理服务 - 负责工单导航和会话管理
 * 聊天消息相关功能已迁移到 chatMessageService
 */
import { getHistoryOrderDetail } from '../api'
import { createMessageObject, convertHistoryToMessages } from '../utils/messageUtils'
import chatMessageService from './chatMessageService'

class MessageService {
  constructor() {
    // 委托给 chatMessageService 的状态
    this.chatService = chatMessageService
  }

  /**
   * 初始化消息服务
   * @param {Array} initialMessages - 初始消息
   */
  init(initialMessages) {
    this.chatService.init(initialMessages)
  }

  /**
   * 选择工单
   * @param {Object} order - 工单对象
   * @returns {Promise<Array>} - 消息列表
   */
  async selectOrder(order) {
    console.log('选择工单:', order)
    this.chatService.currentChatSession = 0
    this.chatService.isNewSession = false

    // 获取工单详情
    try {
      const response = await getHistoryOrderDetail(order.conversationId)
      if (response) {
        // 将详情数据转换为消息格式，传递工单状态
        const messages = convertHistoryToMessages(response, { orderStatus: order.orderStatus })
        // 保存到消息存储
        this.chatService.messageStore[order.id] = [...messages]
        return messages
      } else {
        // 如果获取失败，显示默认消息
        const messages = [
          {
            sender: 'bot',
            text: `无法加载工单"${order.orderTitle}"的历史记录。`,
            time: new Date().toLocaleString('zh-CN'),
            images: []
          }
        ]
        this.chatService.messageStore[order.id] = [...messages]
        return messages
      }
    } catch (error) {
      const messages = [
        {
          sender: 'bot',
          text: `加载工单"${order.orderTitle}"失败，请稍后重试。`,
          time: new Date().toLocaleString('zh-CN'),
          images: []
        }
      ]
      this.chatService.messageStore[order.id] = [...messages]
      return messages
    }
  }

  /**
   * 回到当前聊天会话
   * @param {Array} initialMessages - 初始消息
   * @returns {Object} - 包含消息和会话信息的对象
   */
  backToCurrentChat(initialMessages) {
    // 使用 activeChatSession 而不是 currentChatSession，因为后者在查看历史工单时会被改变
    const targetSessionId = this.chatService.activeChatSession

    if (this.chatService.messageStore[targetSessionId]) {
      // 从缓存中获取当前会话的消息
      this.chatService.isNewSession = this.chatService.messageStore[targetSessionId].length === 1
      // 恢复当前会话ID
      this.chatService.currentChatSession = targetSessionId
      // 恢复会话配置（业务类型、系统、模块等）
      const config = this.chatService.sessionConfigStore[targetSessionId] || {}
      this.chatService.currentBusinessType = config.businessType || ''
      this.chatService.currentSystemName = config.systemName || ''
      this.chatService.currentModuleName = config.moduleName || ''
      return {
        messages: [...this.chatService.messageStore[targetSessionId]],
        selectedContact: targetSessionId,
        showInput: true,
        isNewSession: this.chatService.messageStore[targetSessionId].length === 1,
        businessType: this.chatService.currentBusinessType,
        systemName: this.chatService.currentSystemName,
        moduleName: this.chatService.currentModuleName
      }
    } else {
      // 如果没有当前聊天会话，使用默认会话 (ID 为 0)
      if (!this.chatService.messageStore[0]) {
        this.chatService.messageStore[0] = initialMessages
        this.chatService.isNewSession = true
      }

      this.chatService.currentChatSession = 0
      this.chatService.activeChatSession = 0

      return {
        messages: this.chatService.messageStore[0],
        selectedContact: 0,
        showInput: true,
        isNewSession: this.chatService.isNewSession
      }
    }
  }

  /**
   * 处理导航到会话
   * @param {number} sessionId - 会话 ID
   * @param {Array} historyOrders - 历史工单列表
   * @returns {Promise<Array>} - 消息列表
   */
  async handleNavigateToSession(sessionId, historyOrders) {
    // 选择对应的会话
    let order = historyOrders.find(contact => contact.id === sessionId)
    if (!order) {
      return []
    }
    return this.selectOrder(order)
  }

  /**
   * 获取当前是否为新会话状态 - 委托给 chatMessageService
   * @returns {boolean} - 是否为新会话
   */
  getIsNewSession() {
    return this.chatService.getIsNewSession()
  }
}

// 导出单例
const messageService = new MessageService()
export default messageService
