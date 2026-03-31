/*
 * @Author: hui.chenn
 * @Description:
 * @Date: 2026-03-30 14:26:36
 * @LastEditTime: 2026-03-30 14:26:43
 * @LastEditors: hui.chenn
 */
/**
 * 聊天消息服务 - 专门处理聊天相关的消息操作
 * 供 chat 目录下的组件使用
 */
import { sendChatMessage, downloadSoftware } from '../api'
import { createMessageObject, convertHistoryToMessages } from '../utils/messageUtils'
import { getSystemUsername } from '../utils/system'

class ChatMessageService {
  constructor() {
    this.messageStore = {} // 存储每个会话的消息
    this.sessionConfigStore = {} // 存储每个会话的配置（系统、模块等）
    this.currentChatSession = 0 // 当前正在进行的聊天会话
    this.activeChatSession = 0 // 当前活跃的聊天会话（用于回到当前聊天）
    this.isNewSession = false // 标记是否为新会话
    this.currentConversationId = null // 当前会话的conversationId
    this.currentSystemName = '' // 当前选择的系统名称
    this.currentModuleName = '' // 当前选择的模块名称
    this.chatAbortController = null // 用于中断发送消息请求的控制器
  }

  /**
   * 初始化聊天服务
   * @param {Array} initialMessages - 初始消息
   */
  init(initialMessages) {
    this.currentChatSession = 0
    this.messageStore[0] = initialMessages
    this.isNewSession = true
    this.currentConversationId = null
  }

  /**
   * 处理发送消息
   * @param {Object} data - 消息数据
   * @returns {Promise<Object>} - 消息对象
   */
  async handleSendMessage(data) {
    const { text, images, files, systemName, moduleName } = data

    if (!text && images.length === 0 && files.length === 0) return null

    // 保存系统名称和模块名称（首次发送时传入）
    if (systemName) {
      this.currentSystemName = systemName
      // 保存到会话配置中
      if (!this.sessionConfigStore[this.currentChatSession]) {
        this.sessionConfigStore[this.currentChatSession] = {}
      }
      this.sessionConfigStore[this.currentChatSession].systemName = systemName
    }
    if (moduleName) {
      this.currentModuleName = moduleName
      // 保存到会话配置中
      if (!this.sessionConfigStore[this.currentChatSession]) {
        this.sessionConfigStore[this.currentChatSession] = {}
      }
      this.sessionConfigStore[this.currentChatSession].moduleName = moduleName
    }

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

      const userName = await getSystemUsername()
      // 准备参数
      const params = {
        message: text,
        fileUrls: allFileUrls,
        userName: userName
      }

      // 添加系统名称和模块名称（如果有）
      if (this.currentSystemName) {
        params.systemName = this.currentSystemName
      }
      if (this.currentModuleName) {
        params.moduleName = this.currentModuleName
      }

      // 如果是新会话，添加isNewSession参数；否则添加conversationId
      if (this.isNewSession) {
        params.isNewSession = true
        // 发送完第一条消息后，将isNewSession设置为false
        this.isNewSession = false
      } else if (this.currentConversationId) {
        // 非新会话时，传入conversationId
        params.conversationId = this.currentConversationId
      }

      // 创建新的 AbortController
      this.chatAbortController = new AbortController()

      const response = await sendChatMessage(params, this.chatAbortController.signal).finally(() => {
        // 请求完成后清空控制器
        this.chatAbortController = null
      })
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
      // 保存返回的conversationId
      if (response.data.conversationId) {
        this.currentConversationId = response.data.conversationId
      }

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
          content = parsedContent?.message
        }
      } catch (parseError) {
        // 如果解析失败，使用原始 content
        console.log('Content is not JSON:', content)
      }

      // 如果是安装类型消息，调用下载接口并显示响应
      if (isInstallType && installId) {
        // // 调用下载接口
        // const message = this.handleDownloadSoftware(installId)
        // // 确保提示消息被添加到当前会话
        // if (this.messageStore[this.currentChatSession]) {
        //   this.messageStore[this.currentChatSession].push(message)
        // }
        // return message
        // this.handleDownloadSoftware(installId)
         downloadSoftware(installId)
      }

      // 创建响应消息
      const responseMessage = createMessageObject(content)
      // 确保消息被添加到当前会话
      if (this.messageStore[this.currentChatSession]) {
        this.messageStore[this.currentChatSession].push(responseMessage)
      }
      return responseMessage
    } else {
      // 响应格式不正确
      console.error('Invalid response format:', response)
      const errorMessage = this.receiveErrorMessage(response?.message || '服务器响应格式不正确')
      // 确保错误消息被添加到当前会话
      if (this.messageStore[this.currentChatSession]) {
        this.messageStore[this.currentChatSession].push(errorMessage)
      }
      return errorMessage
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
      // 创建响应消息，只显示message字段
      const messageText = response.message || '下载软件操作已执行'
      const message = createMessageObject(messageText)
      // 确保消息被添加到当前会话
      if (this.messageStore[this.currentChatSession]) {
        this.messageStore[this.currentChatSession].push(message)
      }
      return message
    } catch (error) {
      // 显示错误消息
      const errorMessage = this.receiveErrorMessage(`下载软件失败: ${error.message}`)
      // 确保错误消息被添加到当前会话
      if (this.messageStore[this.currentChatSession]) {
        this.messageStore[this.currentChatSession].push(errorMessage)
      }
      return errorMessage
    }
  }

  /**
   * 处理停止发送消息
   */
  handleStopSending() {
    // 中断API请求
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
   * @returns {Object} - 包含消息和会话信息的对象
   */
  createNewSession() {
    // 生成新的会话 ID
    const newSessionId = Date.now()

    // 更新当前会话
    this.currentChatSession = newSessionId
    this.activeChatSession = newSessionId // 更新活跃聊天会话
    this.isNewSession = true
    this.currentConversationId = null // 新会话清空conversationId

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

    return {
      messages,
      selectedContact: newSessionId,
      showInput: true,
      isNewSession: true
    }
  }

  /**
   * 获取当前是否为新会话状态
   * @returns {boolean} - 是否为新会话
   */
  getIsNewSession() {
    return this.isNewSession
  }

  /**
   * 获取当前聊天会话ID
   * @returns {number} - 当前会话ID
   */
  getCurrentChatSession() {
    return this.currentChatSession
  }
}

// 导出单例
const chatMessageService = new ChatMessageService()
export default chatMessageService
