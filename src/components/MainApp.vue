<template>
  <div class="app">
    <!-- 左侧历史工单列表 -->
    <div class="contacts-container" :style="{ width: contactsWidth + 'px' }">
      <OrderList
        ref="contactsComponent"
        :contacts="contacts"
        v-model:selectedContact="selectedContact"
        :currentChatSession="currentChatSession"
        v-model:showInput="showInput"
        v-model:messages="messages"
        :isSending="isSending"
        @back-to-current="backToCurrentChat"
      />
      <div class="resize-handle" @mousedown="startResizing"></div>
    </div>

    <!-- 右侧聊天区域 -->
    <Chat
      ref="chatComponent"
      v-model:messages="messages"
      v-model:showInput="showInput"
      v-model:selectedContact="selectedContact"
      v-model:currentChatSession="currentChatSession"
      :isSending="isSending"
      @navigate-to-session="handleNavigateToSession"
      @update:isSending="isSending = $event"
    />
  </div>
</template>

<script>
import OrderList from './order/OrderList.vue'
import Chat from './chat/Chat.vue'
import { contacts as mockContacts, initialMessages } from '../mock/data'
import messageService from '../services/messageService'
import { updateMessageStatus } from '../api/index'

export default {
  name: 'MainApp',
  components: {
    OrderList,
    Chat
  },
  data() {
    return {
      contacts: mockContacts,
      selectedContact: '',
      currentChatSession: null, // 当前正在进行的聊天会话
      messages: initialMessages,
      showInput: true, // 是否显示聊天输入框
      contactsWidth: 300, // 初始宽度
      isResizing: false,
      isLoading: false, // 发送消息加载状态
      loadingMessageId: null, // 加载消息的 ID
      isSending: false // 全局发送中状态
    }
  },
  methods: {
    /**
     * 开始调整宽度
     * @param {Event} event - 鼠标事件
     */
    startResizing(event) {
      this.isResizing = true
      document.addEventListener('mousemove', this.onResizing)
      document.addEventListener('mouseup', this.stopResizing)
    },
    /**
     * 调整宽度中
     * @param {Event} event - 鼠标事件
     */
    onResizing(event) {
      if (!this.isResizing) return
      const newWidth = event.clientX - this.$el.getBoundingClientRect().left
      if (newWidth >= 200 && newWidth <= 500) {
        this.contactsWidth = newWidth
      }
    },
    /**
     * 停止调整宽度
     */
    stopResizing() {
      this.isResizing = false
      document.removeEventListener('mousemove', this.onResizing)
      document.removeEventListener('mouseup', this.stopResizing)
    },
    /**
     * 回到当前聊天会话
     */
    backToCurrentChat() {
      // 如果正在发送消息，不允许切换会话
      if (this.isSending) {
        console.log('正在发送消息中，无法切换会话')
        return
      }

      console.log('开始回到当前聊天')
      // 调用 messageService 的 backToCurrentChat 方法从缓存获取数据
      const result = messageService.backToCurrentChat(initialMessages)

      // 更新状态
      this.messages = result.messages
      this.selectedContact = result.selectedContact
      this.showInput = result.showInput

      console.log('已从缓存恢复会话数据:', result.selectedContact)
    },
    /**
     * 处理导航到会话
     * @param {number} sessionId - 会话 ID
     */
    async handleNavigateToSession(sessionId) {
      // 如果正在发送消息，不允许切换会话
      if (this.isSending) {
        console.log('正在发送消息中，无法切换会话')
        return
      }

      // 从 Contacts 组件获取历史工单列表
      const historyOrders = this.$refs.contactsComponent.$refs.orderItemList.historyOrders
      // 调用消息服务处理导航
      const messages = await messageService.handleNavigateToSession(sessionId, historyOrders)
      // 更新状态
      this.messages = messages
      this.selectedContact = sessionId
      this.showInput = false

      // 调用 OrderList 组件的 updateOrder 方法
      if (this.$refs.contactsComponent && this.$refs.contactsComponent.updateOrder) {
        this.$refs.contactsComponent.updateOrder(sessionId)
      }

      // 导航到历史工单列表时滚动到顶部
      setTimeout(() => {
        if (this.$refs.contactsComponent && this.$refs.contactsComponent.$refs.orderItemList) {
          this.$refs.contactsComponent.$refs.orderItemList.scrollToTop()
        }
      }, 100)
    },
  },
  mounted() {
    // 初始化消息服务
    messageService.init(initialMessages)
    // 初始化当前聊天会话
    this.currentChatSession = 0
    this.selectedContact = 0
  }
}
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  font-family: Arial, sans-serif;
  position: relative;
}

.contacts-container {
  position: relative;
  height: 100%;
  transition: width 0.2s ease;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  background-color: transparent;
  z-index: 10;
}

.resize-handle:hover {
  background-color: rgba(103, 58, 183, 0.3);
}

.resize-handle:active {
  background-color: rgba(103, 58, 183, 0.5);
}
</style>
