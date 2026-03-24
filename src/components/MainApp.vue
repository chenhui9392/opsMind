<template>
  <div class="app">
    <!-- 左侧历史工单列表 -->
    <div class="contacts-container" :style="{ width: contactsWidth + 'px' }">
      <OrderList
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
      @stop="handleStopSending"
      @navigate-to-session="handleNavigateToSession"
    />
  </div>
</template>

<script>
import OrderList from './order/OrderList.vue'
import Chat from './chat/Chat.vue'
import { contacts as mockContacts, initialMessages } from '../mock/data'
import messageService from '../services/messageService'
import { updateMessageStatus } from '../api/index'

export default {
  name: 'MainApp',
  components: {
    OrderList,
    Chat
  },
  data() {
    return {
      contacts: mockContacts,
      selectedContact: '',
      currentChatSession: null, // 当前正在进行的聊天会话
      messages: initialMessages,
      showInput: true, // 是否显示聊天输入框
      contactsWidth: 300, // 初始宽度
      isResizing: false,
      isLoading: false, // 发送消息加载状态
      loadingMessageId: null // 加载消息的ID
    }
  },
  methods: {
    /**
     * 选择联系人
     * @param {string} contactId - 联系人ID
     */
    selectContact(contactId) {
      this.selectedContact = contactId
      this.showInput = false // 点击历史会话时不显示输入框
      // 从消息服务获取消息
      this.messages = messageService.selectContact(contactId, this.contacts)
    },

    /**
     * 选择工单
     * @param {Object} order - 工单对象
     */
    async selectOrder(order) {
      this.selectedContact = order.id
      this.showInput = false
      // 从消息服务获取工单消息
      this.messages = await messageService.selectOrder(order)
    },
    /**
     * 处理发送消息
     * @param {Object} data - 消息数据
     */
    async handleSendMessage(data) {
      const { text, images, files } = data

      if (!text && images.length === 0 && files.length === 0) return

      // 添加用户消息
      const message = {
        sender: 'user',
        text: text,
        time: new Date().toLocaleString('zh-CN'),
        images: images,
        files: files
      }
      this.messages.push(message)

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

      try {
        // 发送消息到服务器
        const responseMessage = await messageService.handleSendMessage(data)

        // 替换加载状态消息
        if (this.isLoading && this.loadingMessageId !== null) {
          this.messages.splice(this.loadingMessageId, 1, responseMessage)
          this.isLoading = false
          this.loadingMessageId = null
        }
      } catch (error) {
        console.error('发送消息失败:', error)
        // 错误处理：移除加载消息
        if (this.isLoading && this.loadingMessageId !== null) {
          this.messages.splice(this.loadingMessageId, 1)
          this.isLoading = false
          this.loadingMessageId = null
        }
      }

    },
    /**
     * 回到当前聊天会话
     */
    backToCurrentChat() {
      const result = messageService.backToCurrentChat(initialMessages)
      this.messages = result.messages
      this.selectedContact = result.selectedContact
      this.showInput = result.showInput
      this.currentChatSession = result.selectedContact
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
      const result = messageService.createNewSession()
      this.messages = result.messages
      this.selectedContact = result.selectedContact
      this.showInput = result.showInput
      this.currentChatSession = result.selectedContact
    },

    /**
     * 处理停止发送消息
     */
    handleStopSending() {
      // 调用消息服务处理停止发送
      messageService.handleStopSending()

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
     * 更新工单
     * @param {Object} id - 工单id
     */
    updateOrder(id) {
      // 调用更新工单消息状态接口
      try {
        updateMessageStatus(id, 'READ')
        console.log('工单消息状态更新成功:', id)
      } catch (error) {
        console.error('更新工单消息状态失败:', error)
      }
    },
    /**
     * 处理导航到会话
     * @param {number} sessionId - 会话 ID
     */
    async handleNavigateToSession(sessionId) {
      // 从Contacts组件获取历史工单列表
      const historyOrders = this.$refs.contactsComponent.$refs.orderItemList.historyOrders
      // 调用消息服务处理导航
      this.messages = await messageService.handleNavigateToSession(sessionId, historyOrders)
      this.selectedContact = sessionId
      this.showInput = false
      this.updateOrder(sessionId)
      
      // 导航到历史工单列表时滚动到顶部
      setTimeout(() => {
        if (this.$refs.contactsComponent && this.$refs.contactsComponent.$refs.orderItemList) {
          this.$refs.contactsComponent.$refs.orderItemList.scrollToTop()
        }
      }, 100)
    },
  },
  mounted() {
    // 初始化消息服务
    messageService.init(initialMessages)
    // 初始化当前聊天会话
    this.currentChatSession = 0
    this.selectedContact = 0
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
