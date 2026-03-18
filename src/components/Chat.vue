<template>
  <div class="chat">
    <div class="chat-header">
      <div class="chat-title">
        <div class="avatar">
          <div class="avatar-icon">🤖</div>
        </div>
        <div class="header-info">
          <span class="chat-name">智能助手</span>
          <span class="chat-status">在线</span>
        </div>
        <div class="user-info">
          <span class="user-name">hui.chenn</span>
        </div>
      </div>
    </div>
    <div class="chat-messages" ref="chatMessages">
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="message"
        :class="{ 'message-user': message.sender === 'user', 'message-bot': message.sender === 'bot' }"
      >
        <div class="message-avatar" v-if="message.sender === 'bot'">
          <div class="avatar-icon">🤖</div>
        </div>
        <div class="message-content">
          <div v-if="message.text" class="message-text">{{ message.text }}</div>
          <div v-if="message.images && message.images.length > 0" class="message-images">
            <img
              v-for="(image, imgIndex) in message.images"
              :key="imgIndex"
              :src="image"
              class="message-image"
              @click="openImagePreview(image, message.images, imgIndex)"
            />
          </div>
          <div class="message-time">{{ message.time }}</div>
        </div>
      </div>
    </div>
    <ChatInput v-if="showInput" @send="handleSend" />
  </div>
</template>

<script>
import ChatInput from './ChatInput.vue'

export default {
  name: 'Chat',
  components: {
    ChatInput
  },
  props: {
    messages: {
      type: Array,
      default: () => []
    },
    showInput: {
      type: Boolean,
      default: true
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
     * 打开图片预览
     * @param {string} image - 当前图片
     * @param {Array} images - 图片数组
     * @param {number} index - 当前索引
     */
    openImagePreview(image, images, index) {
      this.$emit('preview-image', { image, images, index })
    },
    /**
     * 滚动到底部
     */
    scrollToBottom() {
      setTimeout(() => {
        const chatMessages = this.$refs.chatMessages
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight
        }
      }, 100)
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
.chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  height: 100%;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.chat-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.avatar {
  margin-right: 12px;
}

.avatar-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.header-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.chat-name {
  font-weight: bold;
  color: white;
  margin-right: 0;
  margin-bottom: 4px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-name {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  padding: 4px 12px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

.chat-status {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
}

.chat-status::before {
  content: '';
  width: 8px;
  height: 8px;
  background-color: #4caf50;
  border-radius: 50%;
  margin-right: 4px;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #fafafa;
}

.message {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
}

.message-user {
  align-self: flex-end;
  flex-direction: row-reverse;
  align-items: flex-end;
}

.message-bot {
  align-self: flex-start;
  flex-direction: row;
  align-items: flex-start;
}

.message-avatar {
  margin-right: 10px;
  margin-top: 4px;
}

.message-content {
  padding: 12px 16px;
  border-radius: 18px;
  margin-bottom: 4px;
  max-width: 80%;
  word-wrap: break-word;
}

.message-bot .message-content {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 4px;
}

.message-user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-bottom-right-radius: 4px;
}

.message-user .message-text {
  color: #ffffff;
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
  color: #333;
}

.message-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.message-user .message-images {
  justify-content: flex-end;
}

.message-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.message-image:hover {
  transform: scale(1.05);
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  text-align: right;
}

.message-user .message-time {
  text-align: right;
  color: rgba(255, 255, 255, 0.7);
}

.message-bot .message-time {
  text-align: left;
}
</style>
