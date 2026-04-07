<template>
  <div class="chat-header">
    <div class="chat-title">
      <div class="avatar">
        <div class="avatar-icon">🤖</div>
      </div>
      <div class="header-info">
        <div class="chat-name-container">
          <span class="chat-name">
            {{ title }}
            <span v-if="isDev" class="env-tag">（测试）</span>
          </span>
          <button class="new-session-button" @click="createNewSession">
            + 新建会话
          </button>
        </div>
        <span class="chat-status">{{ status }}</span>
      </div>

      <div class="offline-session-box"  @mouseenter="showMessagePopup = true" @mouseleave="showMessagePopup = false">
        <div class="offline-session-container"  >
        <SvgIcon name="bell" width="14" height="14" class="bell-icon" />
        <span class="offline-session">消息通知</span>
        <div class="notification-dot" v-if="hasNotification"></div>
        <!-- 消息弹窗 -->
        <MessagePopup
          v-if="showMessagePopup && messages.length > 0"
          :messages="messages"
          @click="handleMessageClick"
        />
        </div>
      </div>

      <div class="user-info" v-if="userName">
        <span class="user-name">{{ userName }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import MessagePopup from '../common/MessagePopup.vue'
import SvgIcon from '../../assets/svg/SvgIcon.vue'
import { isDev } from '../../config/env.js'

// Props
const props = defineProps({
  title: {
    type: String,
    default: '智能助手'
  },
  status: {
    type: String,
    default: '在线'
  },
  userName: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['create-new-session', 'navigate-to-session', 'refresh-orders'])

// 响应式数据
const hasNotification = ref(false)
const showMessagePopup = ref(false)
const messages = ref([])
const recentSessionId = ref(null)
const isDevEnv = ref(false)

// 方法
const createNewSession = () => {
  emit('create-new-session')
}

const handleSocketBroadcast = (event) => {
  const data = event.detail
  console.log('ChatHeader 收到广播消息:', data)
  if (data.type === 'broadcast' && data.message) {
    hasNotification.value = true
    const message = {
      id: Date.now(),
      sessionId: data.id || 1,
      content: data.message,
      time: new Date().toLocaleString('zh-CN')
    }
    messages.value.unshift(message)
    if (messages.value.length > 5) {
      messages.value = messages.value.slice(0, 5)
    }
    recentSessionId.value = data.sessionId || 1


  }
}

/**
 * 处理消息点击 - 先刷新历史工单，再导航到会话
 * @param {number} sessionId - 会话 ID
 */
const handleMessageClick = async (sessionId) => {
  const targetSessionId = sessionId || recentSessionId.value

  emit('refresh-orders')

  await new Promise(resolve => setTimeout(resolve, 300))

  emit('navigate-to-session', targetSessionId)

  showMessagePopup.value = false

  messages.value = messages.value.filter(msg => msg.sessionId !== targetSessionId)

  hasNotification.value = messages.value.length > 0

  // 同步未读消息计数到悬浮球
  const remainingCount = messages.value.length
  console.log('[ChatHeader] 同步未读消息计数到悬浮球:', remainingCount)
  if (window.mainWindowAPI && window.mainWindowAPI.syncUnreadCount) {
    window.mainWindowAPI.syncUnreadCount(remainingCount)
  }
}

// const navigateToSession = (sessionId) => {
//   const targetSessionId = sessionId || recentSessionId.value
//
//   emit('navigate-to-session', targetSessionId)
//
//   showMessagePopup.value = false
//
//   messages.value = messages.value.filter(msg => msg.sessionId !== targetSessionId)
//
//   hasNotification.value = messages.value.length > 0
// }

// 注册 Socket 事件监听
const initSocketListeners = () => {
  window.addEventListener('socket:broadcast', handleSocketBroadcast)
}

// 移除 Socket 事件监听
const removeSocketListeners = () => {
  window.removeEventListener('socket:broadcast', handleSocketBroadcast)
}

// 生命周期钩子
onMounted(() => {
  isDevEnv.value = isDev

  // 注册 Socket 事件监听
  initSocketListeners()
})

// 组件卸载时移除监听
onUnmounted(() => {
  removeSocketListeners()
})
</script>

<style scoped>
.chat-header {
  padding: 0 16px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  height: 72px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
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

.env-tag {
  color: #ffd700;
  font-weight: bold;
  margin-left: 4px;
}

.chat-name-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.new-session-button {
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  background-color: transparent;
  color: white;
  font-weight: bold;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.new-session-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.user-name {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  padding: 4px 12px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

.offline-session-box{
  margin-right: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  height: 40px;
}

.offline-session-container {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.offline-session {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-right: 8px;
  transition: color 0.3s ease;
}

.offline-session-container:hover .offline-session {
  color: white;
}

.bell-icon {
  color: rgba(255, 255, 255, 0.8);
  margin-right: 4px;
  transition: color 0.3s ease;
}

.offline-session-container:hover .bell-icon {
  color: white;
}

.notification-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background-color: #ff4757;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(0.8);
    opacity: 1;
  }
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
</style>
