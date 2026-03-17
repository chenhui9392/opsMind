<template>
  <div class="app">
    <!-- 左侧联系人列表 -->
    <div class="contacts">
      <div class="contacts-header">
        <h2>历史会话</h2>
      </div>
      <div class="contacts-list">
        <div 
          v-for="contact in contacts" 
          :key="contact.id"
          class="contact-item"
          :class="{ active: selectedContact === contact.id }"
          @click="selectContact(contact.id)"
        >
          <div class="contact-info">
            <div class="contact-name">{{ contact.name }}</div>
            <div class="contact-time">{{ contact.time }}</div>
          </div>
          <div class="contact-status" :class="contact.status">{{ contact.statusText }}</div>
          <div class="contact-message">{{ contact.lastMessage }}</div>
        </div>
      </div>
    </div>

    <!-- 右侧聊天区域 -->
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
      <div class="chat-input-area">
        <input 
          type="text" 
          v-model="inputMessage"
          class="chat-input"
          placeholder="请输入您的问题..."
          @keydown.enter.prevent="handleEnterKey"
        />
        <div class="chat-actions">
          <input 
            type="file" 
            ref="fileInput"
            multiple
            accept="image/*"
            class="file-input"
            @change="handleFileSelect"
          />
          <button class="action-button" @click="$refs.fileInput.click()">
            📷
          </button>
          <button class="send-button" @click="sendMessage">
            发送
          </button>
        </div>
      </div>
    </div>

    <!-- 图片预览模态框 -->
    <div v-if="imagePreview.show" class="image-preview-overlay" @click="closeImagePreview">
      <div class="image-preview-content" @click.stop>
        <button class="preview-close" @click="closeImagePreview">×</button>
        <button 
          class="preview-nav preview-prev" 
          @click="navigateImage(-1)"
          :disabled="imagePreview.currentIndex <= 0"
        >
          ←
        </button>
        <img :src="imagePreview.images[imagePreview.currentIndex]" class="preview-image" />
        <button 
          class="preview-nav preview-next" 
          @click="navigateImage(1)"
          :disabled="imagePreview.currentIndex >= imagePreview.images.length - 1"
        >
          →
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      contacts: [
        {
          id: 1,
          name: '账户登录问题',
          time: '2023-11-15 14:30',
          status: 'completed',
          statusText: '已完成',
          lastMessage: '无法登录账户，密码重置失败'
        },
        {
          id: 2,
          name: '支付流程咨询',
          time: '2023-11-15 15:45',
          status: 'processing',
          statusText: '处理中',
          lastMessage: '在线支付时遇到网络错误'
        },
        {
          id: 3,
          name: '订单配送查询',
          time: '2023-11-14 09:20',
          status: 'completed',
          statusText: '已完成',
          lastMessage: '想知道订单何时能够送达'
        },
        {
          id: 4,
          name: '退款申请处理',
          time: '2023-11-14 16:10',
          status: 'pending',
          statusText: '待响应',
          lastMessage: '申请退款但未收到处理通知'
        },
        {
          id: 5,
          name: '产品功能介绍',
          time: '2023-11-13 11:05',
          status: 'completed',
          statusText: '已完成',
          lastMessage: '询问高级功能的具体使用方法'
        },
        {
          id: 6,
          name: '发票开具申请',
          time: '2023-11-13 13:40',
          status: 'processing',
          statusText: '处理中',
          lastMessage: '需要开具增值税专用发票'
        }
      ],
      selectedContact: 1,
      messages: [
        {
          sender: 'bot',
          text: '您好！我是智能助手，请问有什么可以帮助您的吗？',
          time: '2026-03-16 17:00',
          images: []
        }
      ],
      inputMessage: '',
      selectedFiles: [],
      imagePreview: {
        show: false,
        images: [],
        currentIndex: 0
      }
    }
  },
  methods: {
    selectContact(contactId) {
      this.selectedContact = contactId
      // 这里可以根据联系人ID加载对应的聊天记录
    },
    handleEnterKey(event) {
      if (event.shiftKey) {
        // Shift + Enter 换行
        this.inputMessage += '\n'
      } else {
        // Enter 发送消息
        this.sendMessage()
      }
    },
    handleFileSelect(event) {
      const files = event.target.files
      if (files.length > 0) {
        this.selectedFiles = Array.from(files)
      }
    },
    async sendMessage() {
      if (!this.inputMessage && this.selectedFiles.length === 0) return

      const message = {
        sender: 'user',
        text: this.inputMessage,
        time: new Date().toLocaleString('zh-CN'),
        images: []
      }

      // 上传图片
      if (this.selectedFiles.length > 0) {
        for (const file of this.selectedFiles) {
          try {
            const imageUrl = await this.uploadImage(file)
            message.images.push(imageUrl)
          } catch (error) {
            console.error('图片上传失败:', error)
          }
        }
      }

      // 添加消息到聊天记录
      this.messages.push(message)
      
      // 清空输入和文件
      this.inputMessage = ''
      this.selectedFiles = []
      this.$refs.fileInput.value = ''

      // 滚动到底部
      this.scrollToBottom()

      // 模拟收到回复
      setTimeout(() => {
        this.receiveMessage()
      }, 1000)
    },
    async uploadImage(file) {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('https://css-test.tineco.com/gateway/fileServer/v4/upload/single', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        return data.data.accessPath.trim()
      } else {
        throw new Error('上传失败')
      }
    },
    async receiveMessage() {
      // 模拟收到消息
      const responseMessage = {
        sender: 'bot',
        text: '网络错误或服务异常，请稍后再试。',
        time: new Date().toLocaleString('zh-CN'),
        images: []
      }

      this.messages.push(responseMessage)
      this.scrollToBottom()
    },
    scrollToBottom() {
      setTimeout(() => {
        const chatMessages = this.$refs.chatMessages
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight
        }
      }, 100)
    },
    openImagePreview(image, images, index) {
      this.imagePreview = {
        show: true,
        images: images,
        currentIndex: index
      }
    },
    closeImagePreview() {
      this.imagePreview.show = false
    },
    navigateImage(direction) {
      const newIndex = this.imagePreview.currentIndex + direction
      if (newIndex >= 0 && newIndex < this.imagePreview.images.length) {
        this.imagePreview.currentIndex = newIndex
      }
    }
  },
  mounted() {
    this.scrollToBottom()
  }
}
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  font-family: Arial, sans-serif;
}

/* 左侧联系人列表 */
.contacts {
  width: 300px;
  border-right: 1px solid #e0e0e0;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

.contacts-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #ffffff;
}

.contacts-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
}

.contact-item {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  background-color: #ffffff;
  transition: background-color 0.2s;
}

.contact-item:hover {
  background-color: #f0f0f0;
}

.contact-item.active {
  background-color: #e3f2fd;
}

.contact-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.contact-name {
  font-weight: bold;
  color: #333;
}

.contact-time {
  font-size: 12px;
  color: #999;
}

.contact-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-bottom: 8px;
}

.contact-status.completed {
  background-color: #e8f5e8;
  color: #4caf50;
}

.contact-status.processing {
  background-color: #fff3e0;
  color: #ff9800;
}

.contact-status.pending {
  background-color: #f3e5f5;
  color: #9c27b0;
}

.contact-message {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 右侧聊天区域 */
.chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
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

.chat-input-area {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 14px;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.chat-input:focus {
  border-color: #2196f3;
}

.chat-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-input {
  display: none;
}

.action-button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background-color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background-color 0.2s;
}

.action-button:hover {
  background-color: #e0e0e0;
}

.send-button {
  padding: 10px 20px;
  border: none;
  border-radius: 20px;
  background-color: #2196f3;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-button:hover {
  background-color: #1976d2;
}

/* 图片预览 */
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.image-preview-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.preview-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: #ffffff;
  font-size: 32px;
  cursor: pointer;
}

.preview-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: #ffffff;
  font-size: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-prev {
  left: -50px;
}

.preview-next {
  right: -50px;
}

.preview-nav:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
  border-radius: 8px;
}
</style>
