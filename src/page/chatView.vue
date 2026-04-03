<template>
  <div class="app">
    <!-- 左侧历史工单列表 -->
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

    <!-- 右侧聊天区域 -->
    <Chat
      ref="chatComponent"
      v-model:messages="messages"
      v-model:showInput="showInput"
      v-model:selectedContact="selectedContact"
      v-model:currentChatSession="currentChatSession"
      :isSending="isSending"
      :isNewSession="isNewSession"
      :systemName="currentSystemName"
      :moduleName="currentModuleName"
      @navigate-to-session="handleNavigateToSession"
      @update:isSending="isSending = $event"
      @refresh-orders="handleRefreshOrders"
    />

    <!-- 版本更新对话框 -->
    <UpdateDialog
      v-model:visible="showUpdateDialog"
      :currentVersion="updateInfo.currentVersion"
      :latestVersion="updateInfo.latestVersion"
      :releaseNotes="updateInfo.releaseNotes"
      :downloadUrl="updateInfo.downloadUrl"
      :fileSize="updateInfo.fileSize"
      :forceUpdate="updateInfo.forceUpdate"
      @confirm="handleUpdateConfirm"
      @cancel="handleUpdateCancel"
    />
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import OrderList from '../components/order/OrderList.vue'
import Chat from '../components/chat/Chat.vue'
import UpdateDialog from '../components/common/UpdateDialog.vue'
import { initialMessages } from '../mock/data'
import messageService from '../services/messageService'
import updateService from '../services/updateService'
import { initSocketConnection, disconnectSocket } from '../utils/socket'

// 响应式数据
const contacts = ref([])
const selectedContact = ref(0)
const currentChatSession = ref(null)
const messages = ref(initialMessages)
const showInput = ref(true)
const isLoading = ref(false)
const loadingMessageId = ref(null)
const isSending = ref(false)
const isNewSession = ref(true)
const currentSystemName = ref('')
const currentModuleName = ref('')
const showUpdateDialog = ref(false)
const updateInfo = reactive({
  currentVersion: '',
  latestVersion: '',
  releaseNotes: '',
  downloadUrl: '',
  fileSize: 0,
  forceUpdate: false
})

// 模板引用
const contactsComponent = ref(null)
const chatComponent = ref(null)

/**
 * 回到当前聊天会话
 */
const backToCurrentChat = () => {
  // 如果正在发送消息，不允许切换会话
  if (isSending.value) {
    return
  }

  // 调用 messageService 的 backToCurrentChat 方法从缓存获取数据
  const result = messageService.backToCurrentChat(initialMessages)

  // 更新状态
  messages.value = result.messages
  selectedContact.value = result.selectedContact
  showInput.value = result.showInput
  isNewSession.value = result.isNewSession
  // 恢复系统/模块名称
  currentSystemName.value = result.systemName || ''
  currentModuleName.value = result.moduleName || ''
}

/**
 * 处理导航到会话
 * @param {number} sessionId - 会话 ID
 */
const handleNavigateToSession = async (sessionId) => {
  // 如果正在发送消息，不允许切换会话
  if (isSending.value) {
    return
  }

  // 从 Contacts 组件获取历史工单列表
  let historyOrders = [];
  if (contactsComponent.value && contactsComponent.value.$refs && contactsComponent.value.$refs.orderItemList && contactsComponent.value.$refs.orderItemList.historyOrders) {
    historyOrders = contactsComponent.value.$refs.orderItemList.historyOrders;
  }

  // 更新状态
  messages.value = await messageService.handleNavigateToSession(sessionId, historyOrders);
  // 调用消息服务处理导航
  selectedContact.value = sessionId;
  showInput.value = false;

  // 调用 OrderList 组件的 updateOrder 方法
  if (contactsComponent.value && contactsComponent.value.updateOrder) {
    contactsComponent.value.updateOrder(sessionId);
  }

  // 导航到历史工单列表时滚动到顶部
  setTimeout(() => {
    if (contactsComponent.value && contactsComponent.value.$refs && contactsComponent.value.$refs.orderItemList && contactsComponent.value.$refs.orderItemList.scrollToTop) {
      contactsComponent.value.$refs.orderItemList.scrollToTop();
    }
  }, 100);
}

/**
 * 刷新历史工单列表
 */
const handleRefreshOrders = function() {
  if (contactsComponent.value && contactsComponent.value.handleRefreshOrders) {
    contactsComponent.value.handleRefreshOrders();
  }
};

/**
 * 检查应用版本更新
 * @param {Object} options - 检查选项
 */
const checkForAppUpdates = async (options = {}) => {
  try {
    const result = await updateService.checkForUpdates({
      silent: true, // 静默检查，不显示错误提示
      ...options
    })

    if (result.hasUpdate && result.updateInfo) {
      // 有新版本，显示更新对话框
      updateInfo.currentVersion = result.currentVersion
      updateInfo.latestVersion = result.latestVersion
      updateInfo.releaseNotes = result.updateInfo.releaseNotes || '修复了一些已知问题，优化了用户体验。'
      updateInfo.downloadUrl = result.updateInfo.downloadUrl
      updateInfo.fileSize = result.updateInfo.fileSize
      updateInfo.forceUpdate = result.updateInfo.forceUpdate
      showUpdateDialog.value = true
    }
  } catch (error) {
    // 静默处理错误，不影响用户正常使用
  }
}

/**
 * 处理更新确认
 * @param {Object} data - 更新数据
 */
const handleUpdateConfirm = async (data) => {
  // 调用更新服务执行下载并安装
  const result = await updateService.downloadAndInstall(data.downloadUrl, `opsmind-setup-${data.version}.exe`)
  if (result.success) {
    if (result.delayed) {
      // 用户选择稍后安装，可以显示一个提示
      console.log('用户选择稍后安装，安装包路径:', result.installerPath)
    }
  } else {
    // 如果下载失败，尝试用浏览器打开下载链接
    const fallbackResult = await updateService.openExternalLink(data.downloadUrl)
    console.log('备用下载方式结果:', fallbackResult.message)
  }
}

/**
 * 处理更新取消
 */
const handleUpdateCancel = () => {
  console.log('用户取消更新')
  // 可以记录用户选择，下次不再提示或延迟提示
}

// 监听消息变化，同步新会话状态
watch(messages, () => {
  isNewSession.value = messageService.getIsNewSession()
}, { deep: true })

// 生命周期钩子
onMounted(() => {
  // 初始化消息服务
  messageService.init(initialMessages)
  // 初始化当前聊天会话
  currentChatSession.value = 0
  selectedContact.value = 0
  // 同步新会话状态
  isNewSession.value = messageService.getIsNewSession()

  // 初始化 Socket 连接
  initSocketConnection()

  // 应用启动时检查版本更新（延迟执行，避免影响启动速度）
  // setTimeout(() => {
  //   checkForAppUpdates()
  // }, 1000)
})

onUnmounted(() => {
  // 断开 Socket 连接
  disconnectSocket()
})
</script>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  font-family: Arial, sans-serif;
  position: relative;
}
</style>
