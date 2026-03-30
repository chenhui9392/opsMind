<template>
  <div class="chat-content">
    <MessageList
      ref="messageList"
      :messages="messages"
      @file-click="downloadFile"
    />

    <!-- 消息发送区 -->
    <ChatInput
      v-if="showInput"
      @send="handleSend"
      @stop="handleStop"
      @show-error="handleShowError"
      :isSending="isSendingLocal"
      :isNewSession="isNewSession"
      :systemName="systemName"
      :moduleName="moduleName"
    />

    <!-- Toast 提示组件 -->
    <Toast ref="toast" />
  </div>
</template>

<script>
import ChatInput from './ChatInput.vue'
import MessageList from './MessageList.vue'
import Toast from '../common/Toast.vue'
import chatMessageService from '../../services/chatMessageService'

export default {
  name: 'ChatContent',
  components: {
    ChatInput,
    MessageList,
    Toast
  },
  props: {
    messages: {
      type: Array,
      default: () => []
    },
    showInput: {
      type: Boolean,
      default: true
    },
    isSending: {
      type: Boolean,
      default: false
    },
    isNewSession: {
      type: Boolean,
      default: false
    },
    systemName: {
      type: String,
      default: ''
    },
    moduleName: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      isLoading: false, // 发送消息加载状态
      loadingMessageId: null, // 加载消息的ID
      isSendingLocal: false // 本地发送状态
    }
  },
  methods: {
    /**
     * 处理显示错误提示
     * @param {string} message - 错误消息
     */
    handleShowError(message) {
      // 使用 Toast 组件显示错误提示
      this.$refs.toast.error(message)
    },

    /**
     * 处理发送消息
     * @param {Object} data - 消息数据
     */
    async handleSend(data) {
      const { text, images, files, systemName, moduleName } = data

      if (!text && images.length === 0 && files.length === 0) return

      // 设置发送状态为 true
      this.isSendingLocal = true
      this.$emit('update:isSending', true)

      // 添加用户消息
      const message = {
        sender: 'user',
        text: text,
        time: new Date().toLocaleString('zh-CN'),
        images: images,
        files: files
      }
      let updatedMessages = [...this.messages, message]

      // 添加加载状态消息
      const loadingMessage = {
        sender: 'bot',
        text: '正在尝试思考您的问题...',
        time: new Date().toLocaleString('zh-CN'),
        images: [],
        isLoading: true
      }
      updatedMessages.push(loadingMessage)
      const loadingMessageId = updatedMessages.length - 1

      // 立即通知父组件更新消息，实现即时显示
      this.$emit('update:messages', updatedMessages)
      // 使用当前会话ID保存消息，而不是固定的0
      const currentSessionId = chatMessageService.getCurrentChatSession() || 0
      chatMessageService.saveMessages(currentSessionId, updatedMessages)

      // 滚动会话列表到底部
      this.scrollToBottom()

      try {
        // 发送消息到服务器
        const responseMessage = await chatMessageService.handleSendMessage(data)

        // 替换加载状态消息
        updatedMessages = [...this.messages]
        updatedMessages.splice(loadingMessageId, 1, responseMessage)

        // 通知父组件更新消息
        this.$emit('update:messages', updatedMessages)
      } catch (error) {
        console.error('发送消息失败:', error)
        // 错误处理：移除加载消息
        updatedMessages = [...this.messages]
        updatedMessages.splice(loadingMessageId, 1)

        // 通知父组件更新消息
        this.$emit('update:messages', updatedMessages)
      } finally {
        // 无论成功失败，都设置发送状态为 false
        this.isSendingLocal = false
        this.$emit('update:isSending', false)
        // 使用当前会话ID保存消息，而不是固定的0
        const finalSessionId = chatMessageService.getCurrentChatSession() || 0
        chatMessageService.saveMessages(finalSessionId, updatedMessages)
      }
    },
    /**
     * 滚动到底部
     */
    scrollToBottom() {
      this.$nextTick(() => {
        const messageList = this.$refs.messageList
        if (messageList) {
          const container = messageList.$el
          container.scrollTop = container.scrollHeight
        }
      })
    },
    /**
     * 处理中断请求
     */
    handleStop() {
      // 中断发送时设置发送状态为 false
      this.isSendingLocal = false
      this.$emit('update:isSending', false)
      this.$emit('stop')
    },
    /**
     * 下载文件
     * @param {Object} file - 文件对象
     */
    downloadFile(file) {
      try {
        if (file.url) {
          const link = document.createElement('a')
          link.href = file.url
          link.download = file.name || 'download'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        } else {
          console.error('文件URL不存在')
        }
      } catch (error) {
        console.error('文件下载失败:', error)
      }
    }
  },
  watch: {
    messages() {
      this.scrollToBottom()
    }
  },
  mounted() {
    this.scrollToBottom()
  }
}
</script>

<style scoped>
.chat-content {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  height: 100%;
  position: relative;
}
</style>
