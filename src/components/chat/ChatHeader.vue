<template>
  <div class="chat-header">
    <div class="chat-title">
      <div class="avatar">
        <div class="avatar-icon">🤖</div>
      </div>
      <div class="header-info">
        <div class="chat-name-container">
          <span class="chat-name">{{ title }}</span>
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

<script>
import socketService from '../../utils/socketService'
import MessagePopup from '../common/MessagePopup.vue'
import SvgIcon from '../../assets/svg/SvgIcon.vue'

export default {
  components: {
    MessagePopup,
    SvgIcon
  },
  name: 'ChatHeader',
  props: {
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
  },
  emits: ['create-new-session', 'navigate-to-session', 'refresh-orders'],
  data() {
    return {
      hasNotification: false,
      showMessagePopup: false,
      messages: [], // 消息列表
      recentSessionId: null
    }
  },
  methods: {
    createNewSession() {
      this.$emit('create-new-session');
    },
    handleSocketMessage(data) {
      console.log('收到 Socket 消息:', data)
      // 这里可以根据实际消息内容判断是否显示通知
      // 保存消息到列表
      if (data.type === 'broadcast' && data.message) {
        this.hasNotification = true
        const message = {
          id: Date.now(),
          sessionId: data.id || 1, // 默认会话 ID
          content: data.message,
          time: new Date().toLocaleString('zh-CN')
        }
        this.messages.unshift(message) // 添加到列表开头
        // 限制消息列表长度navigate-to-session
        if (this.messages.length > 5) {
          this.messages = this.messages.slice(0, 5)
        }
        this.recentSessionId = data.sessionId || 1
      }
    },
    /**
     * 处理消息点击 - 先刷新历史工单，再导航到会话
     * @param {number} sessionId - 会话 ID
     */
    async handleMessageClick(sessionId) {
      const targetSessionId = sessionId || this.recentSessionId

      // 先触发刷新历史工单列表
      this.$emit('refresh-orders')

      // 等待刷新完成后再导航（给刷新操作一些时间）
      await new Promise(resolve => setTimeout(resolve, 300))

      // 触发导航事件，定位到历史工单
      this.$emit('navigate-to-session', targetSessionId)

      // 点击后隐藏弹窗
      this.showMessagePopup = false

      // 从消息列表中删除对应的会话记录
      this.messages = this.messages.filter(msg => msg.sessionId !== targetSessionId)

      // 检查是否还有离线会话数据
      this.hasNotification = this.messages.length > 0
    },
    navigateToSession(sessionId) {
      // 点击离线会话或消息项，定位到历史会话列表
      const targetSessionId = sessionId || this.recentSessionId

      // 先触发导航事件，定位到历史工单
      this.$emit('navigate-to-session', targetSessionId)

      // 点击后隐藏弹窗
      this.showMessagePopup = false

      // 从消息列表中删除对应的会话记录
      this.messages = this.messages.filter(msg => msg.sessionId !== targetSessionId)

      // 检查是否还有离线会话数据
      this.hasNotification = this.messages.length > 0
    }
  },
  mounted() {
    // 连接 Socket
    socketService.connect().catch(error => {
      console.error('Socket 连接失败:', error)
    })

    // 添加消息监听器
    socketService.on('message', this.handleSocketMessage)
  },
  beforeUnmount() {
    // 移除监听器
    socketService.off('message', this.handleSocketMessage)
  }
}
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
