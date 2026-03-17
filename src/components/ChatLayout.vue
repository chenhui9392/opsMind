<script setup lang="ts">
import { ref, reactive } from 'vue'
import ContactList from './ContactList.vue'
import ChatArea from './ChatArea.vue'
import type { Contact, Message } from '../types'

const currentContact = ref<Contact | null>(null)
const messages = reactive<Message[]>([])

// 模拟联系人数据
const contacts = reactive<Contact[]>([
  {
    id: '1',
    name: '智能客服助手',
    avatar: '',
    status: 'online',
    lastMessage: '正在为您查询...',
    lastTime: '14:30'
  },
  {
    id: '2',
    name: '技术支持',
    avatar: '',
    status: 'online',
    lastMessage: '好的，我来帮您处理',
    lastTime: '昨天'
  },
  {
    id: '3',
    name: '运维团队',
    avatar: '',
    status: 'offline',
    lastMessage: '服务器已恢复正常',
    lastTime: '前天'
  }
])

const handleSelectContact = (contact: Contact) => {
  currentContact.value = contact
  // 清空消息，实际项目中应该加载该联系人的历史消息
  messages.length = 0
  // 添加欢迎消息
  if (contact.id === '1') {
    messages.push({
      id: Date.now().toString(),
      type: 'received',
      content: '您好!我是智能助手，请问有什么可以帮助您的吗?',
      time: new Date().toLocaleTimeString(),
      sender: contact.name,
      images: []
    })
  }
}

const handleSendMessage = (message: Message) => {
  messages.push(message)
  // 模拟回复
  setTimeout(() => {
    messages.push({
      id: Date.now().toString(),
      type: 'received',
      content: '收到您的消息，正在处理中...',
      time: new Date().toLocaleTimeString(),
      sender: currentContact.value?.name || '智能助手',
      images: []
    })
  }, 1000)
}
</script>

<template>
  <div class="chat-layout">
    <ContactList 
      :contacts="contacts" 
      :current-contact="currentContact"
      @select="handleSelectContact" 
    />
    <ChatArea 
      :contact="currentContact" 
      :messages="messages"
      @send="handleSendMessage"
    />
  </div>
</template>

<style scoped>
.chat-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f5f5f5;
}
</style>
