<template>
  <div class="chat">
    <ChatHeader :userName="userName" />
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
        <div>
          <!-- 消息内容 -->
          <div class="message-content" v-if="message.text">
            <!-- 文本 -->
            <div class="message-text" v-if="message.sender === 'user'" v-html="renderMarkdown(message.text)"></div>
            <div class="message-text markdown-body" v-else v-html="renderMarkdown(message.text)"></div>
          </div>
          <!-- 图片 -->
          <div v-if="message.images && message.images.length > 0" class="message-images">
            <img
                v-for="(image, imgIndex) in message.images"
                :key="imgIndex"
                :src="image"
                class="message-image"
                @click="openImagePreview(image, message.images, imgIndex)"
            />
          </div>
          <!-- 时间 -->
          <div class="message-time">{{ message.time }}</div>
        </div>
      </div>
    </div>
    <ChatInput v-if="showInput" :isSending="isSending" @send="handleSend" @stop="handleStop" />
  </div>
</template>

<script>
import ChatInput from './ChatInput.vue'
import ChatHeader from './ChatHeader.vue'
import { getSystemUsername } from '../utils/system'
import { marked } from 'marked'

export default {
  name: 'Chat',
  components: {
    ChatInput,
    ChatHeader
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
     * 处理中断请求
     */
    handleStop() {
      this.$emit('stop')
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
    },
    /**
     * 获取系统用户名
     */
    async getUserName() {
      this.userName = await getSystemUsername()
    },
    /**
     * 渲染Markdown
     * @param {string} text - Markdown文本
     * @returns {string} - 渲染后的HTML
     */
    renderMarkdown(text) {
      return marked(text)
    }
  },
  watch: {
    messages() {
      this.scrollToBottom()
    }
  },
  mounted() {
    this.getUserName()
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
  margin-bottom: 8px;
}

/* 图片消息 */
.message-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  background: transparent;
  border: none;
  padding: 0;
}

.message-user .message-images {
  justify-content: flex-end;
}

.message-bot .message-images {
  justify-content: flex-start;
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
}

.message-bot .message-time {
  text-align: left;
}

/* Markdown样式 */
.markdown-body {
  font-size: 14px;
  line-height: 1.6;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 20px;
  margin-bottom: 10px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body h1 {
  font-size: 2em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-body h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-body h3 {
  font-size: 1.25em;
}

.markdown-body h4 {
  font-size: 1em;
}

.markdown-body h5 {
  font-size: 0.875em;
}

.markdown-body h6 {
  font-size: 0.85em;
  color: #6a737d;
}

.markdown-body p {
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body li {
  margin-top: 0.25em;
}

.markdown-body code {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.85em;
  padding: 0.2em 0.4em;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
}

.markdown-body pre {
  background-color: #f6f8fa;
  border-radius: 3px;
  padding: 16px;
  overflow: auto;
  font-size: 0.85em;
  line-height: 1.45;
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body pre code {
  background-color: transparent;
  padding: 0;
}

.markdown-body a {
  color: #0366d6;
  text-decoration: none;
}

.markdown-body a:hover {
  text-decoration: underline;
}

.markdown-body blockquote {
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
  margin: 0 0 16px 0;
}

.markdown-body table {
  border-collapse: collapse;
  margin-bottom: 16px;
  width: 100%;
  overflow: auto;
  display: block;
}

.markdown-body table th {
  font-weight: 600;
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
  background-color: #f6f8fa;
}

.markdown-body table td {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

.markdown-body table tr {
  background-color: #ffffff;
  border-top: 1px solid #c6cbd1;
}

.markdown-body table tr:nth-child(2n) {
  background-color: #f6f8fa;
}
</style>
