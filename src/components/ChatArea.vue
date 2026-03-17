<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import MessageInput from './MessageInput.vue'
import ImagePreview from './ImagePreview.vue'
import type { Contact, Message } from '../types'

interface Props {
  contact: Contact | null
  messages: Message[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  send: [message: Message]
}>()

const messageContainer = ref<HTMLElement | null>(null)
const previewVisible = ref(false)
const previewImages = ref<string[]>([])
const previewIndex = ref(0)

// 自动滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

// 监听消息变化，自动滚动
watch(() => props.messages.length, () => {
  scrollToBottom()
})

// 处理发送消息
const handleSend = (content: string, images: string[]) => {
  const message: Message = {
    id: Date.now().toString(),
    type: 'sent',
    content,
    time: new Date().toLocaleTimeString(),
    sender: '我',
    images
  }
  emit('send', message)
}

// 打开图片预览
const openPreview = (images: string[], index: number) => {
  previewImages.value = images
  previewIndex.value = index
  previewVisible.value = true
}

// 关闭图片预览
const closePreview = () => {
  previewVisible.value = false
}
</script>

<template>
  <div class="chat-area">
    <!-- 聊天头部 -->
    <div class="chat-header" v-if="contact">
      <div class="header-avatar">
        {{ contact.name.charAt(0) }}
      </div>
      <div class="header-info">
        <span class="header-name">{{ contact.name }}</span>
        <span class="header-status" :class="contact.status">
          {{ contact.status === 'online' ? '在线' : contact.status === 'busy' ? '忙碌' : '离线' }}
        </span>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div class="empty-state" v-else>
      <p>请选择一个联系人开始聊天</p>
    </div>

    <!-- 消息列表 -->
    <div v-if="contact" ref="messageContainer" class="message-list">
      <div
        v-for="message in messages"
        :key="message.id"
        class="message-item"
        :class="message.type"
      >
        <div class="message-avatar">
          {{ message.sender.charAt(0) }}
        </div>
        <div class="message-content">
          <div class="message-bubble">
            <p v-if="message.content" class="message-text">{{ message.content }}</p>
            <div v-if="message.images.length > 0" class="message-images">
              <img
                v-for="(img, index) in message.images"
                :key="index"
                :src="img"
                class="message-image"
                @click="openPreview(message.images, index)"
              />
            </div>
          </div>
          <span class="message-time">{{ message.time }}</span>
        </div>
      </div>
    </div>

    <!-- 输入框 -->
    <MessageInput 
      v-if="contact"
      @send="handleSend" 
    />

    <!-- 图片预览 -->
    <ImagePreview
      v-model:visible="previewVisible"
      :images="previewImages"
      :initial-index="previewIndex"
      @close="closePreview"
    />
  </div>
</template>

<style scoped>
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background-color: #fff;
  border-bottom: 1px solid #e0e0e0;
}

.header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin-right: 12px;
}

.header-info {
  display: flex;
  flex-direction: column;
}

.header-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.header-status {
  font-size: 12px;
  color: #999;
}

.header-status.online {
  color: #52c41a;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message-item {
  display: flex;
  margin-bottom: 20px;
}

.message-item.sent {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.message-item.sent .message-avatar {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  margin-left: 12px;
}

.message-item.received .message-avatar {
  margin-right: 12px;
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: 60%;
}

.message-item.sent .message-content {
  align-items: flex-end;
}

.message-item.received .message-content {
  align-items: flex-start;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 12px;
  word-wrap: break-word;
}

.message-item.sent .message-bubble {
  background-color: #95ec69;
}

.message-item.received .message-bubble {
  background-color: #fff;
}

.message-text {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin: 0;
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
  transition: opacity 0.2s;
}

.message-image:hover {
  opacity: 0.8;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>