<template>
  <div class="chat">
    <!-- 聊天头部组件 -->
    <div class="chat-header">
      <ChatHeader
        :userName="userName"
        @create-new-session="handleCreateNewSession"
        @navigate-to-session="handleNavigateToSession"
      />
    </div>

    <!-- 聊天内容组件（包含会话展示区和消息发送区） -->
    <div class="chat-content">
      <ChatContent
         ref="chatContent"
        :messages="messages"
        :showInput="showInput"
        :isSending="isSending"
        @send="handleSend"
        @stop="handleStop"
      />
    </div>
  </div>
</template>

<script>
import ChatHeader from './ChatHeader.vue'
import ChatContent from './ChatContent.vue'
import { getSystemUsername } from '../../utils/system'

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
    }
  },
  data() {
    return {
      userName: ''
    }
  },
  methods: {
    /**
     * 处理发送消息
     * @param {Object} data - 消息数据
     */
    handleSend(data) {
      this.$emit('send', data)
    },
    /**
     * 处理新建会话
     */
    handleCreateNewSession() {
      this.$emit('create-new-session');
    },
    /**
     * 处理中断请求
     */
    handleStop() {
      this.$emit('stop')
    },
    /**
     * 处理导航到会话
     * @param {number} sessionId - 会话 ID
     */
    handleNavigateToSession(sessionId) {
      this.$emit('navigate-to-session', sessionId)
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
