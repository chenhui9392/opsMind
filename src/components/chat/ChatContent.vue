<template>
  <div class="chat-content">
    <div class="chat-messages" ref="chatMessages">
      <!-- 空状态提示 -->
      <div class="empty-state" v-if="messages.length === 0">
        <div class="empty-icon">
          <SvgIcon name="inbox" width="64" height="64" />
        </div>
        <div class="empty-text">暂无消息记录</div>
        <div class="empty-subtext">工单详情将在这里展示</div>
      </div>

      <!-- 消息列表 -->
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
            <div class="message-text markdown-body" v-html="renderMarkdown(message.text)"></div>
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

          <!-- 文件 -->
          <div v-if="message.files && message.files.length > 0" class="message-files">
            <div
              v-for="(file, fileIndex) in message.files"
              :key="'file_' + fileIndex"
              class="file-item"
              @click="downloadFile(file)"
            >
              <div class="file-icon" :class="getFileIconClass(file.name)">{{ getFileIcon(file.name) }}</div>
              <div class="file-name">{{ file.name }}</div>
              <div class="file-download-icon">⬇</div>
            </div>
          </div>
          <!-- 时间 -->
          <div class="message-time">{{ message.time }}</div>
        </div>
      </div>
    </div>

    <!-- 消息发送区 -->
    <ChatInput
      v-if="showInput"
      @send="handleSend"
      @stop="handleStop"
      :isSending="isSendingLocal"
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
import ChatInput from './ChatInput.vue'
import SvgIcon from '../../assets/svg/SvgIcon.vue'
import ImagePreview from '../common/ImagePreview.vue'
import { marked } from 'marked'
import messageService from '../../services/messageService'

// 配置 marked 选项
marked.setOptions({
  breaks: true,
  gfm: true,
  sanitize: false // 允许 HTML 标签，但 marked 会自动转义
})

export default {
  name: 'ChatContent',
  components: {
    ChatInput,
    SvgIcon,
    ImagePreview
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
      imagePreview: {
        show: false,
        images: [],
        currentIndex: 0
      },
      isLoading: false, // 发送消息加载状态
      loadingMessageId: null, // 加载消息的ID
      isSendingLocal: false // 本地发送状态
    }
  },
  methods: {
    /**
     * 处理发送消息
     * @param {Object} data - 消息数据
     */
    async handleSend(data) {
      const { text, images, files } = data

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
      messageService.saveMessages(0, updatedMessages)

      // 滚动会话列表到底部
      this.scrollToBottom()

      try {
        // 发送消息到服务器
        const responseMessage = await messageService.handleSendMessage(data)

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
      }
      messageService.saveMessages(0, updatedMessages)
    },
    /**
     * 打开图片预览
     * @param {string} image - 当前图片
     * @param {Array} images - 图片数组
     * @param {number} index - 当前索引
     */
    openImagePreview(image, images, index) {
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
     * 滚动到底部
     */
    scrollToBottom() {
      // 使用requestAnimationFrame确保滚动在浏览器的动画帧中执行，使滚动更加平滑
      this.$nextTick(() => {
        const chatMessages = this.$refs.chatMessages
        if (chatMessages) {
          // 计算滚动位置，确保滚动到最底部
          const scrollHeight = chatMessages.scrollHeight
          const clientHeight = chatMessages.clientHeight

          // 只有当内容高度大于可视高度时才执行滚动
          if (scrollHeight > clientHeight) {
            // 使用requestAnimationFrame确保滚动平滑
            window.requestAnimationFrame(() => {
              chatMessages.scrollTop = scrollHeight
            })
          }
        }
      })
    },
    /**
     * 渲染Markdown
     * @param {string} text - Markdown文本
     * @returns {string} - 渲染后的HTML
     */
    renderMarkdown(text) {
      // 对包含<符号的内容进行处理，确保被正确渲染
      if (!text) return ''

      // 将文本转换为字符串
      const textStr = String(text)

      // 对<符号进行转义，确保marked库不会将其解释为HTML标签
      // 先将<转换为&lt;，然后使用marked渲染
      const escapedText = textStr.replace(/</g, '&lt;')

      return marked(escapedText)
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
    },
    /**
     * 根据文件名获取文件图标
     * @param {string} fileName - 文件名
     * @returns {string} - 图标
     */
    getFileIcon(fileName) {
      const extension = fileName.toLowerCase().split('.').pop()
      switch (extension) {
        case 'pdf':
          return '📄'
        case 'xlsx':
        case 'xls':
          return '📊'
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
          return '🖼️'
        default:
          return '📄'
      }
    },
    /**
     * 根据文件名获取文件图标类
     * @param {string} fileName - 文件名
     * @returns {string} - 图标类
     */
    getFileIconClass(fileName) {
      const extension = fileName.toLowerCase().split('.').pop()
      return `file-icon-${extension}`
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

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #fafafa;
  padding-bottom: 100px; /* 为输入框预留空间 */
}

/* 确保输入框固定在底部 */
.chat-input-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
  margin-top: 100px;
}

.empty-icon {
  color: #d1c4e9;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: #999;
  font-weight: 500;
}

.empty-subtext {
  font-size: 13px;
  color: #bbb;
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

/* 文件消息 */
.message-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  background: transparent;
  border: none;
  padding: 0;
}

.message-user .message-files {
  justify-content: flex-end;
}

.message-bot .message-files {
  justify-content: flex-start;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-item:hover {
  background-color: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.file-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.file-icon-pdf {
  color: #e74c3c;
}

.file-icon-xlsx,
.file-icon-xls {
  color: #27ae60;
}

.file-icon-jpg,
.file-icon-jpeg,
.file-icon-png,
.file-icon-gif {
  color: #3498db;
}

.file-name {
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  max-width: 220px;
}

.file-download-icon {
  font-size: 14px;
  color: #666;
  flex-shrink: 0;
  transition: color 0.3s ease;
}

.file-item:hover .file-download-icon {
  color: #673ab7;
  transform: translateY(-1px);
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
