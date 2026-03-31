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

<script>
import OrderList from '../components/order/OrderList.vue'
import Chat from '../components/chat/Chat.vue'
import UpdateDialog from '../components/common/UpdateDialog.vue'
import {initialMessages} from '../mock/data'
import messageService from '../services/messageService'
import updateService from '../services/updateService'

export default {
  name: 'chatView',
  components: {
    OrderList,
    Chat,
    UpdateDialog
  },
  data() {
    return {
      contacts: [],
      selectedContact: 0,
      currentChatSession: null, // 当前正在进行的聊天会话
      messages: initialMessages,
      showInput: true, // 是否显示聊天输入框
      isLoading: false, // 发送消息加载状态
      loadingMessageId: null, // 加载消息的 ID
      isSending: false, // 全局发送中状态
      isNewSession: true, // 是否为新会话
      currentSystemName: '', // 当前系统名称
      currentModuleName: '', // 当前模块名称
      // 版本更新相关
      showUpdateDialog: false,
      updateInfo: {
        currentVersion: '',
        latestVersion: '',
        releaseNotes: '',
        downloadUrl: '',
        fileSize: 0,
        forceUpdate: false
      }
    }
  },
  methods: {
    /**
     * 回到当前聊天会话
     */
    backToCurrentChat() {
      // 如果正在发送消息，不允许切换会话
      if (this.isSending) {
        return
      }

      // 调用 messageService 的 backToCurrentChat 方法从缓存获取数据
      const result = messageService.backToCurrentChat(initialMessages)

      // 更新状态
      this.messages = result.messages
      this.selectedContact = result.selectedContact
      this.showInput = result.showInput
      this.isNewSession = result.isNewSession
      // 恢复系统/模块名称
      this.currentSystemName = result.systemName || ''
      this.currentModuleName = result.moduleName || ''

    },
    /**
     * 处理导航到会话
     * @param {number} sessionId - 会话 ID
     */
    async handleNavigateToSession(sessionId) {
      // 如果正在发送消息，不允许切换会话
      if (this.isSending) {
        return
      }

      // 从 Contacts 组件获取历史工单列表
      const historyOrders = this.$refs.contactsComponent.$refs.orderItemList.historyOrders
      // 更新状态
      this.messages = await messageService.handleNavigateToSession(sessionId, historyOrders)
      // 调用消息服务处理导航
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
    /**
     * 刷新历史工单列表
     */
    handleRefreshOrders() {
      if (this.$refs.contactsComponent) {
        this.$refs.contactsComponent.handleRefreshOrders()
      }
    },

    /**
     * 检查应用版本更新
     * @param {Object} options - 检查选项
     */
    async checkForAppUpdates(options = {}) {
      try {
        const result = await updateService.checkForUpdates({
          silent: true, // 静默检查，不显示错误提示
          ...options
        })

        if (result.hasUpdate && result.updateInfo) {
          // 有新版本，显示更新对话框
          this.updateInfo = {
            currentVersion: result.currentVersion,
            latestVersion: result.latestVersion,
            releaseNotes: result.updateInfo.releaseNotes || '修复了一些已知问题，优化了用户体验。',
            downloadUrl: result.updateInfo.downloadUrl,
            fileSize: result.updateInfo.fileSize,
            forceUpdate: result.updateInfo.forceUpdate
          }
          this.showUpdateDialog = true
        }
      } catch (error) {
        // 静默处理错误，不影响用户正常使用
      }
    },

    /**
     * 处理更新确认
     * @param {Object} data - 更新数据
     */
    async handleUpdateConfirm(data) {
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
    },

    /**
     * 处理更新取消
     */
    handleUpdateCancel() {
      console.log('用户取消更新')
      // 可以记录用户选择，下次不再提示或延迟提示
    },
  },
  mounted() {
    // 初始化消息服务
    messageService.init(initialMessages)
    // 初始化当前聊天会话
    this.currentChatSession = 0
    this.selectedContact = 0
    // 同步新会话状态
    this.isNewSession = messageService.getIsNewSession()

    // 应用启动时检查版本更新（延迟执行，避免影响启动速度）
    // setTimeout(() => {
    //   this.checkForAppUpdates()
    // }, 1000)
  },
  watch: {
    // 监听消息变化，同步新会话状态
    messages: {
      handler() {
        this.isNewSession = messageService.getIsNewSession()
      },
      deep: true
    }
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
</style>
