/*
 * @Author: hui.chenn
 * @Description: 聊天消息服务 - 专门处理聊天相关的消息操作
 * @Date: 2026-03-30 14:26:36
 * @LastEditTime: 2026-04-24 14:05:28
 * @LastEditors: hui.chenn
 */
import { sendChatMessage, downloadSoftware } from '../api'
import { createMessageObject, convertHistoryToMessages } from '../utils/messageUtils'

// 消息类型常量
const MESSAGE_TYPES = {
  NORMAL: 'normal',
  FORM: 'form',
  INSTALL: 'install',
  ERROR: 'error'
}

class ChatMessageService {
  constructor() {
    this.messageStore = {}
    this.sessionConfigStore = {}
    this.currentChatSession = 0
    this.activeChatSession = 0
    this.isNewSession = false
    this.currentConversationId = null
    this.currentBusinessType = ''
    this.currentSystemName = ''
    this.currentModuleName = ''
    this.chatAbortController = null
  }

  /**
   * 初始化聊天服务
   */
  init(initialMessages) {
    this.currentChatSession = 0
    this.messageStore[0] = initialMessages
    this.isNewSession = true
    this.currentConversationId = null
  }

  /**
   * 处理发送消息
   */
  async handleSendMessage(data) {
    const { text, images, files, businessType, systemName, moduleName } = data

    if (!text && images.length === 0 && files.length === 0) return null

    this.saveSessionConfig(businessType, systemName, moduleName)
    return await this.sendToServer(text, images, files)
  }

  /**
   * 保存会话配置
   */
  saveSessionConfig(businessType, systemName, moduleName) {
    if (!this.sessionConfigStore[this.currentChatSession]) {
      this.sessionConfigStore[this.currentChatSession] = {}
    }

    if (businessType) {
      this.currentBusinessType = businessType
      this.sessionConfigStore[this.currentChatSession].businessType = businessType
    }

    if (systemName) {
      this.currentSystemName = systemName
      this.sessionConfigStore[this.currentChatSession].systemName = systemName
    }

    if (moduleName) {
      this.currentModuleName = moduleName
      this.sessionConfigStore[this.currentChatSession].moduleName = moduleName
    }
  }

  /**
   * 获取登录用户名
   * @returns {string} - 登录用户名
   */
  getLoginUsername() {
    // 从 localStorage 获取登录时保存的用户名
    return localStorage.getItem('userName') || 'unknown'
  }

  /**
   * 发送消息到服务器
   */
  async sendToServer(text, fileUrls, files = []) {
    try {
      const allFileUrls = this.mergeFileUrls(fileUrls, files)
      const userName = this.getLoginUsername()
      const params = this.buildRequestParams(text, allFileUrls, userName)

      this.chatAbortController = new AbortController()

      const response = await sendChatMessage(params, this.chatAbortController.signal).finally(() => {
        this.chatAbortController = null
      })

      const responseMessage = this.handleServerResponse(response)
      return responseMessage || this.receiveErrorMessage('服务器未返回有效消息')
    } catch (error) {
      console.error('发送消息失败:', error)
      return this.receiveErrorMessage('发送消息失败，请稍后重试')
    }
  }

  /**
   * 合并文件 URL
   */
  mergeFileUrls(fileUrls, files) {
    const allFileUrls = [...fileUrls]
    if (files && files.length > 0) {
      allFileUrls.push(...files.map(file => file.url))
    }
    return allFileUrls
  }

  /**
   * 构建请求参数
   */
  buildRequestParams(text, fileUrls, userName) {
    // 构建 message：将选中的级联字段拼到 message 前面，用空格分隔（有值才拼）
    let combinedMessage = text
    const prefixParts = []
    if (this.currentBusinessType) {
      prefixParts.push(this.currentBusinessType)
    }
    if (this.currentSystemName) {
      prefixParts.push(this.currentSystemName)
    }
    if (this.currentModuleName) {
      prefixParts.push(this.currentModuleName)
    }
    if (prefixParts.length > 0) {
      combinedMessage = `${prefixParts.join(',')} ${text}`
    }

    const params = {
      message: combinedMessage,
      fileUrls: fileUrls,
      userName: userName
    }

    // 拆分三个字段传递，有值则传，没有则不传该字段
    if (this.currentBusinessType) {
      params.businessType = this.currentBusinessType
    }
    if (this.currentSystemName) {
      params.systemName = this.currentSystemName
    }
    if (this.currentModuleName) {
      params.moduleName = this.currentModuleName
    }

    if (this.isNewSession) {
      params.isNewSession = true
      this.isNewSession = false
    } else if (this.currentConversationId) {
      params.conversationId = this.currentConversationId
    }

    return params
  }

  // ==========================================
  // 服务器响应处理（拆分后的方法）
  // ==========================================

  /**
   * 处理服务器响应（主入口方法）
   * @param {Object} response - 服务器响应数据
   * @returns {Object} - 响应消息对象
   */
  handleServerResponse(response) {
    // 验证响应格式
    if (!this.isValidResponse(response)) {
      return this.handleInvalidResponse(response)
    }

    // 保存 conversationId
    this.saveConversationId(response.data.conversationId)

    // 解析 content 并确定消息类型
    const messageData = response.data.message
    const rawContent = messageData.content
    const parsedResult = this.parseContent(rawContent)
    // 根据消息类型分发处理
    switch (parsedResult.type) {
      case MESSAGE_TYPES.FORM:
        return this.handleFormMessage(parsedResult, rawContent)
      case MESSAGE_TYPES.INSTALL:
        return this.handleInstallMessage(parsedResult)
      default:
        return this.handleNormalMessage(parsedResult.content)
    }
  }

  /**
   * 验证响应是否有效
   * @param {Object} response - 服务器响应
   * @returns {boolean}
   */
  isValidResponse(response) {
    return response && response.code === 200 && response.data && response.data.message
  }

  /**
   * 处理无效响应
   * @param {Object} response - 无效的响应对象
   * @returns {Object} - 错误消息对象
   */
  handleInvalidResponse(response) {
    console.error('Invalid response format:', response)
    const errorMessage = this.receiveErrorMessage(response?.message || '服务器响应格式不正确')
    this.saveMessageToStore(errorMessage)
    return errorMessage
  }

  /**
   * 保存 conversationId
   * @param {string} conversationId - 会话ID
   */
  saveConversationId(conversationId) {
    if (conversationId) {
      this.currentConversationId = conversationId
    }
  }

  /**
   * 解析 content 内容，返回解析结果对象
   * @param {string} content - 原始 content 字符串
   * @returns {Object} - 包含 type、content、formInfo、installId 的对象
   */
  parseContent(content) {
    const result = {
      type: MESSAGE_TYPES.NORMAL,
      content: content || '稍后再试，系统正在全力维修中....',
      formInfo: null,
      installId: null
    }

    // 3. 如果 content 为空或不是 JSON，显示原始内容
    if (!content || content.trim() === '') {
      return result
    }

    // 尝试解析 JSON
    try {
      const parsed = JSON.parse(content)
      // 1. 判断是否有 hasfull 字段
      if (parsed.hasfull !== undefined) {
        // a. hasfull=false 时，显示 tip 内容
        if (parsed.hasfull === false && parsed.tip) {
          result.content = parsed.tip
          return result
        }
        // b. hasfull=true 时，获取 formInfo 渲染 UI
        if (parsed.hasfull === true && parsed.formInfo) {
          result.type = MESSAGE_TYPES.FORM
          result.formInfo = parsed.formInfo
          result.content = parsed.input || parsed.message || ''
          return result
        }
      }

      // 2. 判断是否有 type 字段（安装类型）
      if (parsed.type === 'install' && parsed.id) {
        result.type = MESSAGE_TYPES.INSTALL
        result.installId = parsed.id
        result.content = parsed.message || ''
        return result
      }
    } catch (parseError) {
      // 3. 解析失败，content 不是 JSON，直接显示原始内容
      console.log('Content is not JSON, treating as plain text:', content)
    }

    return result
  }

  /**
   * 处理表单类型消息
   * @param {Object} parsedResult - 解析后的结果对象
   * @param {string} rawContent - 原始 content JSON 字符串
   * @returns {Object} - 消息对象
   */
  handleFormMessage(parsedResult, rawContent) {
    const message = this.createResponseMessage(parsedResult.content, {
      hasFull: true,
      formInfo: parsedResult.formInfo,
      rawContent: rawContent
    })
    this.saveMessageToStore(message)
    return message
  }

  /**
   * 处理安装类型消息
   * @param {Object} parsedResult - 解析后的结果对象
   * @returns {Object} - 消息对象
   */
  handleInstallMessage(parsedResult) {
    // 触发软件下载
    downloadSoftware(parsedResult.installId)

    const message = this.createResponseMessage(parsedResult.content)
    this.saveMessageToStore(message)
    return message
  }

  /**
   * 处理普通文本消息
   * @param {string} content - 消息内容
   * @returns {Object} - 消息对象
   */
  handleNormalMessage(content) {
    const message = this.createResponseMessage(content)
    this.saveMessageToStore(message)
    return message
  }

  /**
   * 创建响应消息对象
   * @param {string} text - 消息文本
   * @param {Object} options - 可选参数（hasFull、formInfo 等）
   * @returns {Object} - 消息对象
   */
  createResponseMessage(text, options = {}) {
    return {
      sender: 'bot',
      text: text,
      time: new Date().toLocaleString('zh-CN'),
      images: [],
      hasFull: options.hasFull || false,
      formInfo: options.formInfo || null,
      rawContent: options.rawContent || null
    }
  }

  /**
   * 保存消息到当前会话存储
   * @param {Object} message - 消息对象
   */
  saveMessageToStore(message) {
    if (this.messageStore[this.currentChatSession]) {
      this.messageStore[this.currentChatSession].push(message)
    }
  }

  // ==========================================
  // 其他辅助方法
  // ==========================================

  /**
   * 创建错误消息
   * @param {string} errorText - 错误文本
   * @returns {Object} - 错误消息对象
   */
  receiveErrorMessage(errorText) {
    return createMessageObject(errorText)
  }

  /**
   * 处理下载软件
   * @param {string} id - 软件ID
   * @returns {Promise<Object>}
   */
  async handleDownloadSoftware(id) {
    try {
      const response = await downloadSoftware(id)
      const messageText = response.message || '下载软件操作已执行'
      const message = createMessageObject(messageText)
      this.saveMessageToStore(message)
      return message
    } catch (error) {
      return this.receiveErrorMessage(`下载软件失败: ${error.message}`)
    }
  }

  /**
   * 处理停止发送消息
   */
  handleStopSending() {
    if (this.chatAbortController) {
      this.chatAbortController.abort()
      this.chatAbortController = null
    }
  }

  /**
   * 保存消息到存储
   * @param {string} sessionId - 会话ID
   * @param {Array} messages - 消息列表
   */
  saveMessages(sessionId, messages) {
    this.messageStore[sessionId] = [...messages]
  }

  /**
   * 创建新会话
   * @returns {Object}
   */
  createNewSession() {
    const newSessionId = Date.now()

    this.currentChatSession = newSessionId
    this.activeChatSession = newSessionId
    this.isNewSession = true
    this.currentConversationId = null

    const messages = [
      {
        sender: 'bot',
        text: '您好！我是智能助手，请问有什么可以帮助您的吗？',
        time: new Date().toLocaleString('zh-CN'),
        images: []
      }
    ]

    this.messageStore[newSessionId] = [...messages]

    return {
      messages,
      selectedContact: newSessionId,
      showInput: true,
      isNewSession: true
    }
  }

  getIsNewSession() {
    return this.isNewSession
  }

  getCurrentChatSession() {
    return this.currentChatSession
  }

  /**
   * 获取当前会话ID
   * @returns {string|null} - 当前 conversationId
   */
  getCurrentConversationId() {
    return this.currentConversationId
  }

  /**
   * 获取当前系统名称
   * @returns {string} - 当前 systemName
   */
  getCurrentSystemName() {
    return this.currentSystemName
  }

  /**
   * 获取登录用户名
   * @returns {string} - 登录用户名
   */
  getCurrentUserName() {
    return this.getLoginUsername()
  }
}

const chatMessageService = new ChatMessageService()
export default chatMessageService
