<template>
  <div class="chat">
    <!-- 聊天头部组件 -->
    <div class="chat-header">
      <ChatHeader
        :userName="userName"
        :isSidebarCollapsed="isSidebarCollapsed"
        :firstUserMessage="firstUserMessage"
        :hasSocketNotification="hasSocketNotification"
        @create-new-session="createNewSession"
        @navigate-to-session="handleNavigateToSession"
        @refresh-orders="handleRefreshOrders"
        @toggle-sidebar="handleToggleSidebar"
        @refresh-orders-with-notification="handleRefreshOrdersWithNotification"
        @download-session="handleDownloadSession"
      />
    </div>

    <!-- 聊天内容组件（包含会话展示区和消息发送区） -->
    <div class="chat-content">
      <ChatContent
        ref="chatContent"
        :messages="messages"
        :showInput="showInput"
        :isSending="isSending"
        :isNewSession="isNewSession"
        :isInputDisabled="isInputDisabled"
        :systemName="systemName"
        :moduleName="moduleName"
        @update:messages="$emit('update:messages', $event)"
        @update:isSending="$emit('update:isSending', $event)"
        @stop="handleStop"
        @submit-success="handleSubmitSuccess"
        @refresh-orders="$emit('refresh-orders', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ChatHeader from './ChatHeader.vue'
import ChatContent from './ChatContent.vue'
import { getSystemUsername } from '../../utils/system'
import chatMessageService from '../../services/chatMessageService'
import { initialMessages } from '../../mock/data'

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
  selectedContact: {
    type: [String, Number],
    default: ''
  },
  currentChatSession: {
    type: [String, Number],
    default: null
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
  },
  /**
   * 侧边栏是否收起
   */
  isSidebarCollapsed: {
    type: Boolean,
    default: false
  },
  /**
   * 是否有 Socket 通知（显示红点）
   */
  hasSocketNotification: {
    type: Boolean,
    default: false
  },
  isInputDisabled: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'update:messages',
  'update:selectedContact',
  'update:showInput',
  'update:currentChatSession',
  'update:isSending',
  'navigate-to-session',
  'refresh-orders',
  'refresh-orders-with-notification',
  'toggle-sidebar',
  'download-session',
  'new-session',
  'submit-success',
  'update:isInputDisabled'
])

// 响应式数据
const userName = ref('')
const isLoading = ref(false)
const loadingMessageId = ref(null)

// 模板引用
const chatContent = ref(null)

// 计算属性
/**
 * 获取第一条用户消息作为标题
 */
const firstUserMessage = computed(() => {
  if (!props.messages || props.messages.length === 0) return ''
  const firstUserMsg = props.messages.find(msg => msg.sender === 'user')
  return firstUserMsg ? firstUserMsg.text : ''
})

/**
 * 处理新建会话
 */
const createNewSession = () => {
  // 如果正在发送消息，不允许创建新会话
  if (props.isSending) {
    return
  }

  const result = chatMessageService.createNewSession()
  emit('update:messages', result.messages)
  emit('update:selectedContact', result.selectedContact)
  emit('update:showInput', result.showInput)
  emit('update:currentChatSession', result.selectedContact)
  // 重置输入框禁用状态
  emit('update:isInputDisabled', false)
  
  // 重置级联选择器
  resetCascader()
}

/**
 * 处理中断请求
 */
const handleStop = () => {
  // 调用消息服务处理停止发送
  chatMessageService.handleStopSending()

  // 设置加载状态为 false
  isLoading.value = false

  // 移除加载消息
  if (loadingMessageId.value !== null) {
    const updatedMessages = [...props.messages]
    updatedMessages.splice(loadingMessageId.value, 1)
    loadingMessageId.value = null
    emit('update:messages', updatedMessages)
  }
}

/**
 * 处理导航到会话
 * @param {number} sessionId - 会话 ID
 */
const handleNavigateToSession = async (sessionId) => {
  // 从父组件获取历史工单列表
  emit('navigate-to-session', sessionId)
}

/**
 * 处理刷新历史工单列表
 */
const handleRefreshOrders = () => {
  emit('refresh-orders')
}

/**
 * 处理带通知状态的刷新历史工单列表
 * 如果有 socket 通知，点击后清除通知
 */
const handleRefreshOrdersWithNotification = () => {
  emit('refresh-orders-with-notification')
}

/**
 * 获取系统用户名
 */
const getUserName = async () => {
  userName.value = await getSystemUsername()
}

/**
 * 滚动到底部
 */
const scrollToBottom = () => {
  const chatComponent = chatContent.value
  if (chatComponent && chatComponent.scrollToBottom) {
    chatComponent.scrollToBottom()
  }
}

/**
 * 重置级联选择器
 */
const resetCascader = () => {
  const chatComponent = chatContent.value
  if (chatComponent && chatComponent.resetCascader) {
    chatComponent.resetCascader()
  }
}

/**
 * 处理切换侧边栏
 */
const handleToggleSidebar = () => {
  emit('toggle-sidebar')
}

/**
 * 处理下载会话
 */
const handleDownloadSession = () => {
  emit('download-session')
}

/**
 * 处理提交成功事件
 * 禁用发送按钮，不隐藏输入框
 * @param {Object} payload - 提交结果数据，可能包含 tip
 */
const handleSubmitSuccess = (payload) => {
  // 禁用发送按钮，不隐藏输入框
  emit('update:isInputDisabled', true)

  // 如果有 tip 内容，追加到消息列表
  if (payload && payload.tip) {
    const tipMessage = {
      sender: 'bot',
      text: payload.tip,
      time: new Date().toLocaleString('zh-CN'),
      images: []
    }
    const updatedMessages = [...props.messages, tipMessage]
    emit('update:messages', updatedMessages)
  }

  // 同时触发 submit-success 事件，供父组件做其他处理
  emit('submit-success')
}

// 生命周期钩子
onMounted(() => {
  getUserName()
})

// 暴露方法给父组件
defineExpose({
  resetCascader,
  scrollToBottom
})
</script>

<style scoped>
.chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  height: 100%;
  position: relative;
}

/* 确保ChatHeader固定在顶部 */
.chat-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: #ffffff;
  /* border-bottom: 1px solid #e0e0e0; */
}

/* 确保ChatContent占据剩余空间 */
.chat-content {
  flex: 1;
  overflow: hidden;
}
</style>
