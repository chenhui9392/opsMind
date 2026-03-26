<template>
  <div class="chat">
    <!-- 聊天头部组件 -->
    <div class="chat-header">
      <ChatHeader
        :userName="userName"
        @create-new-session="createNewSession"
        @navigate-to-session="handleNavigateToSession"
        @refresh-orders="handleRefreshOrders"
      />
    </div>

    <!-- 聊天内容组件（包含会话展示区和消息发送区） -->
    <div class="chat-content">
      <ChatContent
         ref="chatContent"
        :messages="messages"
        :showInput="showInput"
        :isSending="isSending"
        :isNewSession="isNewSession"
        :systemName="systemName"
        :moduleName="moduleName"
        @update:messages="$emit('update:messages', $event)"
        @stop="handleStop"
      />
    </div>
  </div>
</template>

<script>
import ChatHeader from './ChatHeader.vue'
import ChatContent from './ChatContent.vue'
import { getSystemUsername } from '../../utils/system'
import messageService from '../../services/messageService'
import { initialMessages } from '../../mock/data'

export default {
  name: 'Chat',
  components: {
    ChatHeader,
    ChatContent
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
    selectedContact: {
      type: [String, Number],
      default: ''
    },
    currentChatSession: {
      type: [String, Number],
      default: null
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
      userName: '',
      isLoading: false, // 发送消息加载状态
      loadingMessageId: null // 加载消息的ID
    }
  },
  methods: {

    /**
     * 处理新建会话
     */
    createNewSession() {
      // 如果正在发送消息，不允许创建新会话
      if (this.isSending) {
        console.log('正在发送消息中，无法创建新会话')
        return
      }
    
      const result = messageService.createNewSession()
      this.$emit('update:messages', result.messages)
      this.$emit('update:selectedContact', result.selectedContact)
      this.$emit('update:showInput', result.showInput)
      this.$emit('update:currentChatSession', result.selectedContact)
    },
    /**
     * 处理中断请求
     */
    handleStop() {
      // 调用消息服务处理停止发送
      messageService.handleStopSending()
    
      // 设置加载状态为 false
      this.isLoading = false
    
      // 移除加载消息
      if (this.loadingMessageId !== null) {
        const updatedMessages = [...this.messages]
        updatedMessages.splice(this.loadingMessageId, 1)
        this.loadingMessageId = null
        this.$emit('update:messages', updatedMessages)
      }
    
      console.log('发送消息已中断')
    },
    /**
     * 处理导航到会话
     * @param {number} sessionId - 会话 ID
     */
    async handleNavigateToSession(sessionId) {
      // 从父组件获取历史工单列表
      this.$emit('navigate-to-session', sessionId)
    },
    /**
     * 处理刷新历史工单列表
     */
    handleRefreshOrders() {
      this.$emit('refresh-orders')
    },
    /**
     * 回到当前聊天会话
     */
    backToCurrentChat() {
      console.log('Chat组件：backToCurrentChat 被调用')
      // 注意：这个方法现在主要由 MainApp 的 backToCurrentChat 处理
      // Chat 组件只需要响应父组件的 props 更新即可
      return {}
    },
    /**
     * 获取系统用户名
     */
    async getUserName() {
      this.userName = await getSystemUsername()
    },
    /**
     * 滚动到底部
     */
    scrollToBottom() {
      const chatComponent = this.$refs.chatContent
      if (chatComponent && chatComponent.scrollToBottom) {
        chatComponent.scrollToBottom()
      }
    },
  },
  mounted() {
    this.getUserName()
  }
}
</script>

<style scoped>
.chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  height: 100%;
  position: relative;
}

/* 确保ChatHeader固定在顶部 */
.chat-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
}

/* 确保ChatContent占据剩余空间 */
.chat-content {
  flex: 1;
  overflow: hidden;
}
</style>
