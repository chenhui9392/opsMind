<template>
  <div class="chat-content">
    <MessageList
      ref="messageList"
      :messages="messages"
      @file-click="downloadFile"
      @submit-success="handleSubmitSuccess"
      @resolved="handleShowSatisfaction"
      @unresolved="handleShowSatisfaction"
    />

    <!-- 满意度评价 -->
    <SatisfactionCard
      v-if="showInput && showSatisfaction"
      class="satisfaction-wrapper"
      @change="handleSatisfactionChange"
    />

    <!-- 消息发送区 -->
    <ChatInput
      ref="chatInputRef"
      v-if="showInput"
      @send="handleSend"
      @stop="handleStop"
      @show-error="handleShowError"
      :isSending="isSendingLocal"
      :isNewSession="isNewSession"
      :systemName="systemName"
      :moduleName="moduleName"
      :isInputDisabled="isInputDisabled"
    />


  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import ChatInput from './ChatInput.vue'
import MessageList from './MessageList.vue'
import SatisfactionCard from '../common/SatisfactionCard.vue'
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
  isInputDisabled: {
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
const emit = defineEmits(['update:messages', 'update:isSending', 'stop', 'submit-success', 'refresh-orders'])

// 响应式数据
const isLoading = ref(false)
const loadingMessageId = ref(null)
const isSendingLocal = ref(false)
const showSatisfaction = ref(false)

// 模板引用
const messageList = ref(null)
const chatInputRef = ref(null)

/**
 * 显示满意度评价卡片，并标记是否已解决卡片为已处理
 */
const handleShowSatisfaction = () => {
  showSatisfaction.value = true
  // 给 resolve-status 消息添加 resolved 标记
  const updatedMessages = props.messages.map(msg => {
    if (msg.sender === 'resolve-status') {
      return { ...msg, resolved: true }
    }
    return msg
  })
  emit('update:messages', updatedMessages)
}

/**
 * 处理显示错误提示
 * @param {string} message - 错误消息
 */
const handleShowError = (message) => {
  ElMessage.error(message)
}

/**
 * 处理发送消息
 * @param {Object} data - 消息数据
 */
const handleSend = async (data) => {
  const { text, images, files, businessType, systemName, moduleName } = data

  if (!text && images.length === 0 && files.length === 0) return

  // 记录当前是否为新会话，用于发送成功后判断是否需要刷新历史列表
  const wasNewSession = props.isNewSession

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

    // 如果是新会话的首次发送成功，无感知刷新历史会话列表
    if (wasNewSession) {
      emit('refresh-orders', true)
    }
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
  // 如果没有 resolve-status 消息，重置满意度显示
  if (!props.messages.some(msg => msg.sender === 'resolve-status')) {
    showSatisfaction.value = false
  }
})

// 生命周期钩子
onMounted(() => {
  scrollToBottom()
})

/**
 * 重置级联选择器
 */
const resetCascader = () => {
  if (chatInputRef.value && chatInputRef.value.resetCascader) {
    chatInputRef.value.resetCascader()
  }
}

/**
 * 处理满意度评价
 * @param {number} value - 评分值 1-5
 */
const handleSatisfactionChange = (value) => {
  console.log('用户满意度评分：', value)
  // TODO: 调用 API 提交满意度评价
}

/**
 * 处理提交成功事件
 * @param {Object} payload - 提交结果数据，可能包含 tip
 */
const handleSubmitSuccess = (payload) => {
  emit('submit-success', payload)
}

// 暴露方法给父组件
defineExpose({
  resetCascader,
  scrollToBottom
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

.satisfaction-wrapper {
  margin: 0 16px;
  flex-shrink: 0;
}
</style>
