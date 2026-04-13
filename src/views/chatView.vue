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
      :class="{ 'sidebar-collapsed': isSidebarCollapsed }"
      @back-to-current="backToCurrentChat"
      @new-order="handleNewOrder"
      @check-update="checkForAppUpdates({ force: true, showNoUpdate: true })"
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
      :isSidebarCollapsed="isSidebarCollapsed"
      @navigate-to-session="handleNavigateToSession"
      @update:isSending="isSending = $event"
      @refresh-orders="handleRefreshOrders"
      @toggle-sidebar="handleToggleSidebar"
      @download-session="handleDownloadSession"
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
const isSidebarCollapsed = ref(false)
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
 * 处理切换侧边栏收起/展开
 */
const handleToggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

/**
 * 处理下载会话
 * 将当前会话内容导出为文本文件
 */
const handleDownloadSession = () => {
  if (!messages.value || messages.value.length === 0) {
    ElMessage.warning('当前会话没有内容可下载')
    return
  }

  // 构建会话内容
  const sessionContent = messages.value.map(msg => {
    const sender = msg.sender === 'user' ? '用户' : '助手'
    const time = msg.time || ''
    const text = msg.text || ''
    return `[${time}] ${sender}:\n${text}\n`
  }).join('\n---\n\n')

  // 创建 Blob 对象
  const blob = new Blob([sessionContent], { type: 'text/plain;charset=utf-8' })

  // 创建下载链接
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url

  // 生成文件名（使用第一条用户消息或默认名称）
  const firstUserMsg = messages.value.find(msg => msg.sender === 'user')
  const fileName = firstUserMsg
    ? `会话_${firstUserMsg.text.substring(0, 20)}_${new Date().toLocaleDateString()}.txt`
    : `会话_${new Date().toLocaleDateString()}.txt`

  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  ElMessage.success('会话下载成功')
}

/**
 * 处理新建工单
 */
const handleNewOrder = () => {
  // 调用 messageService 创建新会话
  const result = messageService.backToCurrentChat(initialMessages)

  // 更新状态
  messages.value = result.messages
  selectedContact.value = result.selectedContact
  showInput.value = result.showInput
  isNewSession.value = result.isNewSession
  // 恢复系统/模块名称
  currentSystemName.value = result.systemName || ''
  currentModuleName.value = result.moduleName || ''

  console.log('创建新工单会话')
}

/**
 * 检查应用版本更新
 * @param {Object} options - 检查选项
 * @param {boolean} options.silent - 是否静默检查（不显示任何提示）
 * @param {boolean} options.force - 是否强制检查
 * @param {boolean} options.showNoUpdate - 无更新时是否显示提示（默认false）
 */
const checkForAppUpdates = async (options = {}) => {
  try {
    const { showNoUpdate = false, ...restOptions } = options

    const result = await updateService.checkForUpdates({
      silent: true, // 静默检查，不显示错误提示
      ...restOptions
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
    } else if (!result.hasUpdate && !result.error && showNoUpdate) {
      // 仅在showNoUpdate为true时显示"当前为最新版本"提示
      ElMessage.success(result.message || '当前已是最新版本')
    } else if (result.error && showNoUpdate) {
      // 检查出错，仅在showNoUpdate为true时显示错误提示
      ElMessage.error(result.error)
    }
  } catch (error) {
    // 静默处理错误，不影响用户正常使用
    console.error('检查更新失败:', error)
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
  // 初始化时不显示任何提示，仅在有更新时弹出对话框
  setTimeout(() => {
    checkForAppUpdates({ silent: true })
  }, 1000)
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
