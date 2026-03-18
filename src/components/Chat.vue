<template>
  <div class="chat">
    <div class="chat-header">
      <div class="chat-title">
        <span class="chat-name">智能客服助手</span>
        <span class="chat-status">在线</span>
      </div>
    </div>
    <div class="chat-messages" ref="chatMessages">
      <div 
        v-for="(message, index) in messages" 
        :key="index"
        class="message"
        :class="{ 'message-user': message.sender === 'user', 'message-bot': message.sender === 'bot' }"
      >
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
        </div>
        <div class="message-time">{{ message.time }}</div>
        <div class="message-sender">{{ message.sender === 'user' ? 'hui.chenn' : '智能助手' }}</div>
      </div>
    </div>
    <ChatInput @send="handleSend" />
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
  background-color: #f5f5f5;
}

.chat-title {
  display: flex;
  align-items: center;
}

.chat-name {
  font-weight: bold;
  color: #333;
  margin-right: 12px;
}

.chat-status {
  font-size: 14px;
  color: #4caf50;
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
  max-width: 80%;
}

.message-user {
  align-self: flex-end;
}

.message-bot {
  align-self: flex-start;
}

.message-content {
  padding: 12px 16px;
  border-radius: 18px;
  margin-bottom: 4px;
}

.message-user .message-content {
  background-color: #e3f2fd;
  border-bottom-right-radius: 4px;
}

.message-bot .message-content {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 4px;
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
  align-self: flex-end;
  margin-top: 4px;
}

.message-sender {
  font-size: 12px;
  color: #666;
  align-self: flex-end;
  margin-top: 2px;
}
</style>
