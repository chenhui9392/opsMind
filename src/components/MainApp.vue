<template>
  <div class="app">
    <!-- 左侧联系人列表 (已隐藏) -->
    <div class="contacts-container" :style="{ width: contactsWidth + 'px' }">
      <Contacts
        ref="contactsComponent"
        :contacts="contacts"
        :selectedContact="selectedContact"
        :currentChatSession="currentChatSession"
        @select="selectContact"
        @select-order="selectOrder"
        @back-to-current="backToCurrentChat"
        @create-new-session="createNewSession"
      />
      <div class="resize-handle" @mousedown="startResizing"></div>
    </div>

    <!-- 右侧聊天区域 -->
    <Chat
      ref="chatComponent"
      :messages="messages"
      :showInput="showInput"
      :isSending="isLoading"
      @send="handleSendMessage"
      @preview-image="handlePreviewImage"
      @stop="handleStopSending"
      @navigate-to-session="handleNavigateToSession"
    />

    <!-- 图片预览模态框 -->
    <ImagePreview
      :show="imagePreview.show"
      :images="imagePreview.images"
      :currentIndex="imagePreview.currentIndex"
      @close="closeImagePreview"
      @navigate="handleNavigateImage"
    />
  </div>
</template>

<script>
import Contacts from './Contacts.vue'
import Chat from './Chat.vue'
import ImagePreview from './ImagePreview.vue'
import { sendChatMessage, abortChatRequest, downloadSoftware, getHistoryOrderDetail } from '../api'
import { contacts as mockContacts, initialMessages, mockReply } from '../mock/data'
import socketService from '../utils/socketService'

export default {
  name: 'MainApp',
  components: {
    Contacts,
    Chat,
    ImagePreview
  },
  data() {
    return {
      contacts: mockContacts,
      selectedContact: 1,
      currentChatSession: null, // 当前正在进行的聊天会话
      messages: initialMessages,
      messageStore: {}, // 存储每个会话的消息
      showInput: true, // 是否显示聊天输入框
      imagePreview: {
        show: false,
        images: [],
        currentIndex: 0
      },
      contactsWidth: 300, // 初始宽度
      isResizing: false,
      isLoading: false, // 发送消息加载状态
      loadingMessageId: null, // 加载消息的ID
      isNewSession: false // 标记是否为新会话
    }
  },
  methods: {
    /**
     * 选择联系人
     * @param {number} contactId - 联系人ID
     */
    selectContact(contactId) {
      // 保存当前会话的消息
      if (this.currentChatSession) {
        this.messageStore[this.currentChatSession] = [...this.messages]
      }

      this.selectedContact = contactId
      this.currentChatSession = null // 点击历史会话时，清除当前聊天会话状态
      this.showInput = false // 点击历史会话时不显示输入框
      // 选择历史会话不是新会话
      this.isNewSession = false

      // 加载对应会话的消息，如果没有则使用默认消息
      if (this.messageStore[contactId]) {
        this.messages = [...this.messageStore[contactId]]
      } else {
        // 模拟加载历史会话消息
        this.messages = [
          {
            sender: 'bot',
            text: `您好！欢迎咨询关于"${this.contacts.find(c => c.id === contactId)?.name}"的问题。`,
            time: new Date().toLocaleString('zh-CN'),
            images: []
          }
        ]
        // 保存到消息存储
        this.messageStore[contactId] = [...this.messages]
      }
    },

    /**
     * 选择工单
     * @param {Object} order - 工单对象
     */
    async selectOrder(order) {
      console.log('选择工单:', order)

      // 保存当前会话的消息
      if (this.currentChatSession) {
        this.messageStore[this.currentChatSession] = [...this.messages]
      }

      this.selectedContact = order.id
      this.currentChatSession = null
      this.showInput = false
      this.isNewSession = false

      // 获取工单详情
      try {
        const response = await getHistoryOrderDetail(order.conversationId)
        debugger
        if (response) {
          // 将详情数据转换为消息格式
          const messages = this.convertHistoryToMessages(response)
          this.messages = messages
          console.log('工单详情:', this.messages)
          // 保存到消息存储
          this.messageStore[order.id] = [...this.messages]
        } else {
          // 如果获取失败，显示默认消息
          this.messages = [
            {
              sender: 'bot',
              text: `无法加载工单"${order.orderTitle}"的历史记录。`,
              time: new Date().toLocaleString('zh-CN'),
              images: []
            }
          ]
          this.messageStore[order.id] = [...this.messages]
        }
      } catch (error) {
        console.error('获取工单详情失败:', error)
        this.messages = [
          {
            sender: 'bot',
            text: `加载工单"${order.orderTitle}"失败，请稍后重试。`,
            time: new Date().toLocaleString('zh-CN'),
            images: []
          }
        ]
        this.messageStore[order.id] = [...this.messages]
      }
    },

    /**
     * 将历史记录转换为消息格式
     * @param {Array} historyData - 历史记录数据
     * @returns {Array} - 消息数组
     */
    convertHistoryToMessages(historyData) {
      if (!Array.isArray(historyData)) {
        return []
      }

      return historyData.map(item => {
        // 解析 content 字段（如果是 JSON 字符串）
        let content = item.content
        try {
          const parsedContent = JSON.parse(content)
          if (parsedContent.questionContent) {
            content = parsedContent.questionContent
          } else if (parsedContent.input) {
            content = parsedContent.input
          }
        } catch (parseError) {
          // 如果解析失败，使用原始 content
          console.log('Content is not JSON:', content)
        }

        return {
          sender: item.messageType === 'user' ? 'user' : 'bot',
          text: content,
          time: item.createTime || new Date().toLocaleString('zh-CN'),
          images: []
        }
      })
    },
    /**
     * 处理发送消息
     * @param {Object} data - 消息数据
     */
    async handleSendMessage(data) {
      const { text, images, files } = data

      if (!text && images.length === 0 && files.length === 0) return

      const message = this.createMessage(text, images, files)
      this.addMessageToChat(message)

      // 添加加载状态消息
      this.isLoading = true
      const loadingMessage = {
        sender: 'bot',
        text: '正在尝试思考您的问题...',
        time: new Date().toLocaleString('zh-CN'),
        images: [],
        isLoading: true
      }
      this.messages.push(loadingMessage)
      this.loadingMessageId = this.messages.length - 1

      // 滚动会话列表到底部
      this.scrollContactsToBottom()

      await this.sendToServer(text, images, files)
    },
    /**
     * 创建用户消息对象
     * @param {string} text - 消息内容
     * @param {Array} images - 图片URL数组
     * @returns {Object} - 消息对象
     */
    createMessage(text, images, files = []) {
      return {
        sender: 'user',
        text: text,
        time: new Date().toLocaleString('zh-CN'),
        images: images,
        files: files
      }
    },
    /**
     * 发送消息到服务器
     * @param {string} text - 消息内容
     * @param {Array} fileUrls - 图片URL数组
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
        // const response = await downloadSoftware(33)
        // 处理服务器响应
        this.handleServerResponse(response)
      } catch (error) {
        console.error('发送消息失败:', error)
        // 错误处理：显示错误消息
        this.receiveErrorMessage('发送消息失败，请稍后重试')
      }
    },
    /**
     * 处理服务器响应
     * @param {Object} response - 服务器响应数据
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
          return
        }

        // 创建响应消息并添加到聊天
        const responseMessage = this.createMessageObject(content)
        this.addMessageToChat(responseMessage)
      } else {
        // 响应格式不正确
        console.error('Invalid response format:', response)
        this.receiveErrorMessage(response?.message || '服务器响应格式不正确')
      }
    },
    /**
     * 创建消息对象
     * @param {string} text - 消息内容
     * @param {string} sender - 发送者
     * @param {Array} images - 图片数组
     * @returns {Object} - 消息对象
     */
    createMessageObject(text, sender = 'bot', images = []) {
      return {
        sender: sender,
        text: text,
        time: new Date().toLocaleString('zh-CN'),
        images: images
      }
    },
    /**
     * 添加消息到聊天
     * @param {Object} message - 消息对象
     */
    addMessageToChat(message) {
      // 替换加载状态消息
      if (this.isLoading && this.loadingMessageId !== null) {
        this.messages.splice(this.loadingMessageId, 1, message)
        this.isLoading = false
        this.loadingMessageId = null
      } else {
        this.messages.push(message)
      }

      // 如果是当前聊天会话，保存到消息存储
      if (this.currentChatSession) {
        this.messageStore[this.currentChatSession] = [...this.messages]
      }
    },
    /**
     * 接收错误消息
     * @param {string} errorText - 错误信息
     */
    receiveErrorMessage(errorText) {
      const errorMessage = this.createMessageObject(errorText)
      this.addMessageToChat(errorMessage)
    },
    /**
     * 模拟收到回复（保留用于测试）
     */
    simulateReply() {
      setTimeout(() => {
        // 模拟响应
        const mockResponse = {
          code: 200,
          data: {
            conversationId: '2034196054756937729',
            message: {
              content: '{\n  "input" : "11"\n}',
              reasonerContent: '',
              role: 'assistant'
            }
          },
          message: 'success'
        }
        this.handleServerResponse(mockResponse)
      }, 1000)
    },
    /**
     * 处理图片预览
     * @param {Object} data - 预览数据
     */
    handlePreviewImage(data) {
      const { images, index } = data
      this.imagePreview = {
        show: true,
        images: images,
        currentIndex: index
      }
    },
    /**
     * 关闭图片预览
     */
    closeImagePreview() {
      this.imagePreview.show = false
    },
    /**
     * 导航图片
     * @param {number} index - 图片索引
     */
    handleNavigateImage(index) {
      this.imagePreview.currentIndex = index
    },
    /**
     * 回到当前聊天会话
     */
    backToCurrentChat() {
      if (this.currentChatSession) {
        this.selectedContact = this.currentChatSession
        this.messages = [...this.messageStore[this.currentChatSession]]
        this.showInput = true
        // 回到当前聊天会话时，这不是一个新会话
        this.isNewSession = false
      } else {
        // 如果没有当前聊天会话，创建一个新的
        this.currentChatSession = 0 // 使用0作为当前聊天会话的ID
        this.selectedContact = 0
        this.messages = initialMessages
        this.showInput = true
        // 设置为新会话状态
        this.isNewSession = true
      }
    },
    /**
     * 开始调整宽度
     * @param {Event} event - 鼠标事件
     */
    startResizing(event) {
      this.isResizing = true
      document.addEventListener('mousemove', this.onResizing)
      document.addEventListener('mouseup', this.stopResizing)
    },
    /**
     * 调整宽度中
     * @param {Event} event - 鼠标事件
     */
    onResizing(event) {
      if (!this.isResizing) return
      const newWidth = event.clientX - this.$el.getBoundingClientRect().left
      if (newWidth >= 200 && newWidth <= 500) {
        this.contactsWidth = newWidth
      }
    },
    /**
     * 停止调整宽度
     */
    stopResizing() {
      this.isResizing = false
      document.removeEventListener('mousemove', this.onResizing)
      document.removeEventListener('mouseup', this.stopResizing)
    },
    /**
     * 滚动会话列表到底部
     */
    scrollContactsToBottom() {
      const chatComponent = this.$refs.chatComponent
      if (chatComponent && chatComponent.scrollToBottom) {
        chatComponent.scrollToBottom()
      }
    },
    /**
     * 创建新会话
     */
    createNewSession() {
      // 保存当前会话的消息
      if (this.currentChatSession) {
        this.messageStore[this.currentChatSession] = [...this.messages]
      }

      // 生成新的会话ID
      const newSessionId = Date.now()

      // 更新当前会话和选中的联系人
      this.currentChatSession = newSessionId
      this.selectedContact = newSessionId
      this.showInput = true
      // 标记为新会话
      this.isNewSession = true

      // 初始化新会话的消息
      this.messages = [
        {
          sender: 'bot',
          text: '您好！我是智能助手，请问有什么可以帮助您的吗？',
          time: new Date().toLocaleString('zh-CN'),
          images: []
        }
      ]

      // 保存到消息存储
      this.messageStore[newSessionId] = [...this.messages]
    },

    /**
     * 处理停止发送消息
     */
    async handleStopSending() {
      // 中断API请求
      abortChatRequest()

      // 设置加载状态为false
      this.isLoading = false

      // 移除加载消息
      if (this.loadingMessageId !== null) {
        this.messages.splice(this.loadingMessageId, 1)
        this.loadingMessageId = null
      }

      console.log('发送消息已中断')
    },
    /**
     * 处理下载软件接口调用
     * @param {string} id - 软件ID
     */
    async handleDownloadSoftware(id) {
      try {
        const response = await downloadSoftware(id)
        console.log('Download API response:', response)

        // 创建响应消息并添加到聊天
        const responseMessage = this.createMessageObject(JSON.stringify(response, null, 2))
        this.addMessageToChat(responseMessage)
      } catch (error) {
        console.error('下载软件失败:', error)
        // 显示错误消息
        this.receiveErrorMessage(`下载软件失败: ${error.message}`)
      }
    },
    /**
     * 处理导航到会话
     * @param {number} sessionId - 会话 ID
     */
    handleNavigateToSession(sessionId) {
      console.log('导航到会话:', sessionId)
      // 选择对应的会话
      this.selectContact(sessionId)
    },
    /**
     * 初始化 Socket 服务
     */
    initSocketService() {
      // 连接 Socket 服务
      socketService.connect().then(() => {
        console.log('Socket 服务连接成功')
      }).catch(error => {
        console.error('Socket 服务连接失败:', error)
        this.receiveErrorMessage('Socket 连接失败，请稍后重试')
      })

      // 添加消息监听器
      socketService.on('message', this.handleSocketMessage)
      socketService.on('error', this.handleSocketError)
    },
    /**
     * 处理 Socket 消息
     * @param {Object} message - 消息对象
     */
    handleSocketMessage(message) {
      console.log('收到 Socket 消息:', message)

      // 过滤掉连接成功的提示消息，不显示在会话列表中
      if (message.type === 'connected' && message.message === 'WebSocket 连接成功') {
        console.log('Socket 连接成功，不显示在会话列表中')
        return
      }

      // 创建消息对象并添加到聊天
      const responseMessage = this.createMessageObject(JSON.stringify(message, null, 2))
      this.addMessageToChat(responseMessage)
    },
    /**
     * 处理 Socket 错误
     * @param {Object} error - 错误对象
     */
    handleSocketError(error) {
      console.error('Socket 错误:', error)
      this.receiveErrorMessage(`Socket 错误: ${error.type || '未知错误'}`)
    },
    /**
     * 发送消息到 Socket 服务器
     * @param {Object} message - 消息对象
     */
    sendSocketMessage(message) {
      socketService.send(message).then(() => {
        console.log('Socket 消息已发送:', message)
      }).catch(error => {
        console.error('发送 Socket 消息失败:', error)
        this.receiveErrorMessage('发送消息失败，请稍后重试')
      })
    },
    /**
     * 关闭 Socket 服务
     */
    closeSocketService() {
      socketService.disconnect()
      console.log('Socket 服务已关闭')
    }
  },
  mounted() {
    // 初始化当前聊天会话
    this.currentChatSession = 0
    this.messageStore[0] = initialMessages
    // 初始化时，设置为新会话状态
    this.isNewSession = true
    // 初始化 Socket 服务
    // this.initSocketService()
  },
  beforeDestroy() {
    // 关闭 Socket 服务
    this.closeSocketService()
  }
}
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  font-family: Arial, sans-serif;
  position: relative;
}

.contacts-container {
  position: relative;
  height: 100%;
  transition: width 0.2s ease;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  background-color: transparent;
  z-index: 10;
}

.resize-handle:hover {
  background-color: rgba(103, 58, 183, 0.3);
}

.resize-handle:active {
  background-color: rgba(103, 58, 183, 0.5);
}
</style>
