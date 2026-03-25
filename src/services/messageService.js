/**
 * 消息管理服务
 */
import { sendChatMessage, abortChatRequest, downloadSoftware, getHistoryOrderDetail } from '../api'
import { createMessage, createMessageObject, convertHistoryToMessages } from '../utils/messageUtils'

class MessageService {
  constructor() {
    this.messageStore = {} // 存储每个会话的消息
    this.currentChatSession = 0 // 当前正在进行的聊天会话
    this.isNewSession = false // 标记是否为新会话
  }

  /**
   * 初始化消息服务
   * @param {Array} initialMessages - 初始消息
   */
  init(initialMessages) {
    this.currentChatSession = 0
    this.messageStore[0] = initialMessages
    this.isNewSession = true
  }

  /**
   * 选择工单
   * @param {Object} order - 工单对象
   * @returns {Promise<Array>} - 消息列表
   */
  async selectOrder(order) {
    console.log('选择工单:', order)
    this.currentChatSession = 0
    this.isNewSession = false

    // 获取工单详情
    try {
      const response = await getHistoryOrderDetail(order.conversationId)
      if (response) {
        // 将详情数据转换为消息格式
        const messages = convertHistoryToMessages(response)
        // 保存到消息存储
        this.messageStore[order.id] = [...messages]
        console.log('已从 API 获取并保存会话消息到缓存:', order.id)
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
        this.messageStore[order.id] = [...messages]
        return messages
      }
    } catch (error) {
      console.error('获取工单详情失败:', error)
      const messages = [
        {
          sender: 'bot',
          text: `加载工单"${order.orderTitle}"失败，请稍后重试。`,
          time: new Date().toLocaleString('zh-CN'),
          images: []
        }
      ]
      this.messageStore[order.id] = [...messages]
      return messages
    }
  }

  /**
   * 处理发送消息
   * @param {Object} data - 消息数据
   * @returns {Promise<Object>} - 消息对象
   */
  async handleSendMessage(data) {
    const { text, images, files } = data

    if (!text && images.length === 0 && files.length === 0) return null

    // 发送消息到服务器并返回响应消息
    return await this.sendToServer(text, images, files)
  }

  /**
   * 发送消息到服务器
   * @param {string} text - 消息内容
   * @param {Array} fileUrls - 图片URL数组
   * @param {Array} files - 文件数组
   * @returns {Promise<Object>} - 服务器响应
   */
  async sendToServer(text, fileUrls, files = []) {
    try {
      // 合并图片URL和非图片文件URL
      const allFileUrls = [...fileUrls];

      // 提取非图片文件的URL并加入到allFileUrls中
      if (files && files.length > 0) {
        const fileUrlsFromFiles = files.map(file => file.url);
        allFileUrls.push(...fileUrlsFromFiles);
      }

      // 准备参数，如果当前是新会话，则添加isNewSession参数
      const params = {
        message: text,
        fileUrls: allFileUrls
      }

      // 如果是新会话，添加isNewSession参数
      if (this.isNewSession) {
        params.isNewSession = true
        // 发送完第一条消息后，将isNewSession设置为false
        this.isNewSession = false
      }

      const response = await sendChatMessage(params)
      // 处理服务器响应
      const responseMessage = this.handleServerResponse(response)
      // 确保返回有效的消息对象
      return responseMessage || this.receiveErrorMessage('服务器未返回有效消息')
    } catch (error) {
      console.error('发送消息失败:', error)
      // 错误处理：显示错误消息
      return this.receiveErrorMessage('发送消息失败，请稍后重试')
    }
  }

  /**
   * 处理服务器响应
   * @param {Object} response - 服务器响应数据
   * @returns {Object} - 响应消息
   */
  handleServerResponse(response) {
    if (response && response.code === 200 && response.data && response.data.message) {
      const messageData = response.data.message
      let content = messageData.content

      // 如果 reasonerContent 没有内容，显示系统维修中提示
      if (!content || content.trim() === '') {
        content = '稍后再试，系统正在全力维修中....'
      }

      // 尝试解析 content 字段（如果是 JSON 字符串）
      let isInstallType = false
      let installId = null
      try {
        const parsedContent = JSON.parse(content)
        if (parsedContent.input) {
          content = parsedContent.input
        }
        // 检查是否为安装类型消息
        if (parsedContent.type === 'install' && parsedContent.id) {
          isInstallType = true
          installId = parsedContent.id
        }
      } catch (parseError) {
        // 如果解析失败，使用原始 content
        console.log('Content is not JSON:', content)
      }

      // 如果是安装类型消息，调用下载接口并显示响应
      if (isInstallType && installId) {
        // 调用下载接口
        this.handleDownloadSoftware(installId)
        // 返回一个提示消息，而不是null
        return createMessageObject('正在处理软件下载请求...')
      }

      // 创建响应消息并添加到聊天
      // const responseMessage = createMessageObject(content)
      // this.saveMessages(this.currentChatSession, responseMessage)
      // 创建响应消息
      return createMessageObject(content)
    } else {
      // 响应格式不正确
      console.error('Invalid response format:', response)
      return this.receiveErrorMessage(response?.message || '服务器响应格式不正确')
    }
  }

  /**
   * 接收错误消息
   * @param {string} errorText - 错误信息
   * @returns {Object} - 错误消息对象
   */
  receiveErrorMessage(errorText) {
    return createMessageObject(errorText)
  }

  /**
   * 处理下载软件接口调用
   * @param {string} id - 软件ID
   * @returns {Promise<Object>} - 响应消息
   */
  async handleDownloadSoftware(id) {
    try {
      const response = await downloadSoftware(id)
      console.log('Download API response:', response)

      // 创建响应消息
      return createMessageObject(JSON.stringify(response, null, 2))
    } catch (error) {
      console.error('下载软件失败:', error)
      // 显示错误消息
      return this.receiveErrorMessage(`下载软件失败: ${error.message}`)
    }
  }

  /**
   * 处理停止发送消息
   */
  handleStopSending() {
    // 中断API请求
    abortChatRequest()
  }

  /**
   * 回到当前聊天会话
   * @param {Array} initialMessages - 初始消息
   * @returns {Object} - 包含消息和会话信息的对象
   */
  backToCurrentChat(initialMessages) {
    console.log('回到当前聊天，currentChatSession:', this.currentChatSession)
    console.log('回到当前聊天，currentChatSession2:', this.messageStore)
    if (this.messageStore[this.currentChatSession]) {
      console.log('回到当前聊天，currentChatSession3=============',this.messageStore[this.currentChatSession])
      // 从缓存中获取当前会话的消息
      console.log('从缓存中恢复当前会话消息:', this.messageStore[this.currentChatSession])
      return {
        messages: [...this.messageStore[this.currentChatSession]],
        selectedContact: this.currentChatSession,
        showInput: true,
        isNewSession: false
      }
    } else {
      // 如果没有当前聊天会话，使用默认会话 (ID 为 0)
      if (!this.messageStore[0]) {
        this.messageStore[0] = initialMessages
        this.isNewSession = true
      }

      this.currentChatSession = 0
      console.log('使用默认会话:', this.currentChatSession)

      return {
        messages: this.messageStore[0],
        selectedContact: 0,
        showInput: true,
        isNewSession: this.isNewSession
      }
    }
  }

  /**
   * 创建新会话
   * @returns {Object} - 包含消息和会话信息的对象
   */
  createNewSession() {
    // 保存当前会话的消息到缓存
    if (this.currentChatSession !== null && this.messageStore[this.currentChatSession]) {
      console.log('已保存当前会话消息到缓存:', this.currentChatSession)
    }

    // 生成新的会话 ID
    const newSessionId = Date.now()

    // 更新当前会话
    this.currentChatSession = newSessionId
    this.isNewSession = true

    // 初始化新会话的消息
    const messages = [
      {
        sender: 'bot',
        text: '您好！我是智能助手，请问有什么可以帮助您的吗？',
        time: new Date().toLocaleString('zh-CN'),
        images: []
      }
    ]

    // 保存到消息存储
    this.messageStore[newSessionId] = [...messages]
    console.log('创建新会话并保存到缓存:', newSessionId)

    return {
      messages,
      selectedContact: newSessionId,
      showInput: true,
      isNewSession: true
    }
  }

  /**
   * 处理导航到会话
   * @param {number} sessionId - 会话 ID
   * @param {Array} historyOrders - 历史工单列表
   * @returns {Promise<Array>} - 消息列表
   */
  async handleNavigateToSession(sessionId, historyOrders) {
    console.log('导航到会话:', sessionId)
    // 选择对应的会话
    let order = historyOrders.find(contact => contact.id === sessionId)
    return this.selectOrder(order)
  }

  /**
   * 保存消息到存储
   * @param {string} sessionId - 会话ID
   * @param {Array} messages - 消息列表
   */
  saveMessages(sessionId, messages) {
    this.messageStore[sessionId] = [...messages]
  }
}

// 导出单例
const messageService = new MessageService()
export default messageService
