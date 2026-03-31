<template>
  <div class="chat-content">
    <MessageList
      ref="messageList"
      :messages="messages"
      @file-click="downloadFile"
    />

    <!-- 消息发送区 -->
    <ChatInput
      v-if="showInput"
      @send="handleSend"
      @stop="handleStop"
      @show-error="handleShowError"
      :isSending="isSendingLocal"
      :isNewSession="isNewSession"
      :systemName="systemName"
      :moduleName="moduleName"
    />

    <!-- Toast 提示组件 -->
    <Toast ref="toast" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import ChatInput from './ChatInput.vue'
import MessageList from './MessageList.vue'
import Toast from '../common/Toast.vue'
import chatMessageService from '../../services/chatMessageService'

// Props
const props = defineProps({
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
})

// Emits
const emit = defineEmits(['update:messages', 'update:isSending', 'stop'])

// 响应式数据
const isLoading = ref(false)
const loadingMessageId = ref(null)
const isSendingLocal = ref(false)

// 模板引用
const messageList = ref(null)
const toast = ref(null)

/**
 * 处理显示错误提示
 * @param {string} message - 错误消息
 */
const handleShowError = (message) => {
  if (toast.value && toast.value.error) {
    toast.value.error(message)
  }
}

/**
 * 处理发送消息
 * @param {Object} data - 消息数据
 */
const handleSend = async (data) => {
  const { text, images, files, systemName, moduleName } = data

  if (!text && images.length === 0 && files.length === 0) return

  isSendingLocal.value = true
  emit('update:isSending', true)

  const message = {
    sender: 'user',
    text: text,
    time: new Date().toLocaleString('zh-CN'),
    images: images,
    files: files
  }
  let updatedMessages = [...props.messages, message]

  const loadingMessage = {
    sender: 'bot',
    text: '正在尝试思考您的问题...',
    time: new Date().toLocaleString('zh-CN'),
    images: [],
    isLoading: true
  }
  updatedMessages.push(loadingMessage)
  const loadingMessageId = updatedMessages.length - 1

  emit('update:messages', updatedMessages)
  const currentSessionId = chatMessageService.getCurrentChatSession() || 0
  chatMessageService.saveMessages(currentSessionId, updatedMessages)

  scrollToBottom()

  try {
    const responseMessage = await chatMessageService.handleSendMessage(data)

    updatedMessages = [...props.messages]
    updatedMessages.splice(loadingMessageId, 1, responseMessage)

    emit('update:messages', updatedMessages)
  } catch (error) {
    console.error('发送消息失败:', error)
    updatedMessages = [...props.messages]
    updatedMessages.splice(loadingMessageId, 1)

    emit('update:messages', updatedMessages)
  } finally {
    isSendingLocal.value = false
    emit('update:isSending', false)
    const finalSessionId = chatMessageService.getCurrentChatSession() || 0
    chatMessageService.saveMessages(finalSessionId, updatedMessages)
  }
}

/**
 * 滚动到底部
 */
const scrollToBottom = () => {
  nextTick(() => {
    const messageListEl = messageList.value
    if (messageListEl && messageListEl.$el) {
      const container = messageListEl.$el
      container.scrollTop = container.scrollHeight
    }
  })
}

/**
 * 处理中断请求
 */
const handleStop = () => {
  isSendingLocal.value = false
  emit('update:isSending', false)
  emit('stop')
}

/**
 * 下载文件
 * @param {Object} file - 文件对象
 */
const downloadFile = (file) => {
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
}

// 监听消息变化
watch(() => props.messages, () => {
  scrollToBottom()
})

// 生命周期钩子
onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.chat-content {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  height: 100%;
  position: relative;
}
</style>
