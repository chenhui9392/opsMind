<template>
  <div class="app">
    <!-- 左侧联系人列表 -->
    <Contacts 
      :contacts="contacts" 
      :selectedContact="selectedContact"
      @select="selectContact"
    />

    <!-- 右侧聊天区域 -->
    <Chat 
      :messages="messages"
      @send="handleSendMessage"
      @preview-image="handlePreviewImage"
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
import { uploadImage, sendChatMessage } from '../api'
import { contacts as mockContacts, initialMessages, mockReply } from '../mock/data'

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
      messages: initialMessages,
      imagePreview: {
        show: false,
        images: [],
        currentIndex: 0
      }
    }
  },
  methods: {
    /**
     * 选择联系人
     * @param {number} contactId - 联系人ID
     */
    selectContact(contactId) {
      this.selectedContact = contactId
      // 这里可以根据联系人ID加载对应的聊天记录
    },
    /**
     * 处理发送消息
     * @param {Object} data - 消息数据
     */
    async handleSendMessage(data) {
      const { text, files } = data
      
      if (!text && files.length === 0) return

      const message = this.createMessage(text)
      await this.uploadImages(files, message)
      this.addMessageToChat(message)
      await this.sendToServer(text, message.images)
      this.simulateReply()
    },
    /**
     * 创建消息对象
     * @param {string} text - 消息内容
     * @returns {Object} - 消息对象
     */
    createMessage(text) {
      return {
        sender: 'user',
        text: text,
        time: new Date().toLocaleString('zh-CN'),
        images: []
      }
    },
    /**
     * 上传图片
     * @param {Array} files - 文件数组
     * @param {Object} message - 消息对象
     */
    async uploadImages(files, message) {
      if (files.length > 0) {
        for (const file of files) {
          try {
            const imageUrl = await uploadImage(file)
            message.images.push(imageUrl)
          } catch (error) {
            console.error('图片上传失败:', error)
          }
        }
      }
    },
    /**
     * 添加消息到聊天记录
     * @param {Object} message - 消息对象
     */
    addMessageToChat(message) {
      this.messages.push(message)
    },
    /**
     * 发送消息到服务器
     * @param {string} text - 消息内容
     * @param {Array} fileUrls - 图片URL数组
     */
    async sendToServer(text, fileUrls) {
      try {
        await sendChatMessage({
          message: text,
          userName: 'hui.chenn',
          fileUrls: fileUrls
        })
      } catch (error) {
        console.error('发送消息失败:', error)
      }
    },
    /**
     * 模拟收到回复
     */
    simulateReply() {
      setTimeout(() => {
        this.receiveMessage()
      }, 1000)
    },
    /**
     * 接收消息
     */
    async receiveMessage() {
      // 模拟收到消息
      const responseMessage = {
        ...mockReply,
        time: new Date().toLocaleString('zh-CN')
      }

      this.messages.push(responseMessage)
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
    }
  }
}
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  font-family: Arial, sans-serif;
}
</style>
