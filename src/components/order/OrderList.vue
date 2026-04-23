<template>
  <div
    class="contacts-container"
    :class="{ 'sidebar-collapsed': isCollapsed }"
    :style="{ width: isCollapsed ? '0px' : contactsWidth + 'px' }"
  >
    <div class="contacts">
      <!-- 用户信息区域 -->
      <div class="user-info-section">
        <div class="user-avatar">
          <SvgIcon name="user" width="20" height="20" />
        </div>
        <span class="user-name">{{ userName }}</span>
      </div>

      <!-- 新建工单按钮 -->
      <button class="new-order-button" @click="handleNewOrder">
        <SvgIcon name="plus" width="16" height="16" />
        <span>新建会话</span>
      </button>

      <!-- 历史会话标题 -->
      <div class="history-title">
        <span>历史会话</span>
      </div>

      <!-- 历史工单列表组件 -->
      <div class="order-item-list" :class="{ 'disabled': isSending }">
        <OrderItemList
          ref="orderItemList"
          :selectedContact="selectedContact"
          :searchQuery="searchQuery"
          @select-order="handleSelectOrder"
        />
      </div>

      <!-- 底部工具栏 -->
      <BottomToolbar
        :is-refreshing="isRefreshing"
        :has-socket-notification="hasSocketNotification"
        @refresh="handleRefreshOrdersWithNotification"
        @check-update="handleCheckUpdate"
        @logout="handleLogout"
      />

      <!-- 调整宽度手柄 -->
      <div
        v-if="!isCollapsed"
        class="resize-handle"
        @mousedown="resizeMethods.startResizing"
      ></div>
    </div>

    <!-- 侧边栏展开/收起按钮 -->
    <button
      class="sidebar-toggle-btn"
      :class="{ 'collapsed': isCollapsed, 'has-notification': hasSocketNotification && isCollapsed }"
      @click="handleToggleSidebarWithNotification"
      :title="isCollapsed ? '展开侧边栏' : '收起侧边栏'"
    >
      <SvgIcon
        :name="isCollapsed ? 'chevronRight' : 'chevronLeft'"
        width="18"
        height="18"
      />
      <!-- 红点通知 - 只在侧边栏收起时显示 -->
      <span v-if="hasSocketNotification && isCollapsed" class="notification-dot"></span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SvgIcon from '../../assets/svg/SvgIcon.vue'
import OrderItemList from './OrderItemList.vue'
import BottomToolbar from '../common/BottomToolbar.vue'
import messageService from '../../services/messageService'
import { useAuth } from '../../composables/useAuth'
import { getSystemUsername } from '../../utils/system'
import { createResizeMethods } from '../../utils/resizeHandler'

// Props
const props = defineProps({
  contacts: {
    type: Array,
    default: () => []
  },
  selectedContact: {
    type: String,
    default: ''
  },
  currentChatSession: {
    type: Number,
    default: 0
  },
  isSending: {
    type: Boolean,
    default: false
  },
  /**
   * 侧边栏是否收起
   */
  isCollapsed: {
    type: Boolean,
    default: false
  },
  /**
   * 是否有 Socket 通知（显示红点）
   */
  hasSocketNotification: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'update:selectedContact',
  'update:showInput',
  'update:messages',
  'back-to-current',
  'new-order',
  'check-update',
  'logout',
  'toggle-sidebar'
])

// 响应式数据
const searchQuery = ref('')
const contactsWidth = ref(300)
const isResizing = ref(false)
const resizeMethods = ref(null)
const userName = ref('')
const isRefreshing = ref(false)

// useAuth composable
const { logout } = useAuth()

// 模板引用
const orderItemList = ref(null)

// 计算属性
const isCurrentChatSelected = computed(() => {
  return props.selectedContact === props.currentChatSession
})

/**
 * 获取用户名
 * 优先从 localStorage 获取登录时的用户名
 */
const fetchUserName = () => {
  try {
    // 优先从 localStorage 获取登录时的用户名
    const storedUserName = localStorage.getItem('userName')
    if (storedUserName) {
      userName.value = storedUserName
    } else {
      // 如果没有登录用户名，则使用系统用户名
      userName.value = '未知用户'
    }
  } catch (error) {
    console.error('获取用户名失败:', error)
    userName.value = '未知用户'
  }
}

/**
 * 处理选择工单（禁用状态）
 * @param {Object} order - 工单对象
 */
const handleSelectOrder = async (order) => {
  if (props.isSending) {
    console.log('正在发送消息中，无法切换会话')
    return
  }
  await selectOrder(order)
}

/**
 * 处理回到当前聊天（禁用状态）
 */
const handleBackToCurrent = () => {
  if (props.isSending) {
    return
  }
  emit('back-to-current')
}

/**
 * 处理搜索
 * @param {string} query - 搜索关键词
 */
const handleSearch = (query) => {
  searchQuery.value = query
}

/**
 * 选择工单
 * @param {Object} order - 工单对象
 */
const selectOrder = async (order) => {
  console.log('OrderList: 选择工单', order)
  const messages = await messageService.selectOrder(order)
  emit('update:selectedContact', order.id)
  // 只有草稿状态(DRAFT)显示聊天框，其他状态不显示
  const shouldShowInput = order.orderStatus === 'DRAFT'
  emit('update:showInput', shouldShowInput)
  emit('update:messages', messages)
  console.log('OrderList: 已从缓存获取工单消息', order.id, '显示聊天框:', shouldShowInput)
}

/**
 * 回到当前聊天会话
 */
const backToCurrentChat = () => {
  emit('back-to-current')
}

/**
 * 处理刷新工单列表
 */
const handleRefreshOrders = () => {
  debugger
  if (isRefreshing.value) return
  isRefreshing.value = true
  if (orderItemList.value && orderItemList.value.fetchHistoryOrders) {
    orderItemList.value.fetchHistoryOrders()
  }
  setTimeout(() => {
    isRefreshing.value = false
  }, 1000)
}

/**
 * 处理带通知状态的刷新工单列表
 * 如果有 socket 通知，点击后通知父组件处理
 */
const handleRefreshOrdersWithNotification = () => {
  handleRefreshOrders()
  // 如果有 socket 通知，通知父组件处理（清除通知）
  if (props.hasSocketNotification) {
    emit('refresh-orders-with-notification')
  }
}

/**
 * 处理新建工单
 */
const handleNewOrder = () => {
  emit('new-order')
}

/**
 * 处理检查更新
 */
const handleCheckUpdate = () => {
  emit('check-update')
}

/**
 * 处理退出登录
 */
const handleLogout = () => {
  logout(true)
}

/**
 * 处理切换侧边栏展开/收起
 */
const handleToggleSidebar = () => {
  emit('toggle-sidebar')
}

/**
 * 处理带通知状态的切换侧边栏
 * 如果有 socket 通知，点击后通知父组件处理
 */
const handleToggleSidebarWithNotification = () => {
  emit('toggle-sidebar')
  // 如果有 socket 通知，通知父组件处理（清除通知并刷新列表）
  if (props.hasSocketNotification) {
    emit('refresh-orders-with-notification')
  }
}

// 初始化调整大小方法
resizeMethods.value = createResizeMethods({
  widthKey: 'contactsWidth',
  resizingKey: 'isResizing',
  minWidth: 200,
  maxWidth: 500
})

// 绑定方法到当前实例
if (resizeMethods.value) {
  resizeMethods.value.startResizing = resizeMethods.value.startResizing.bind({
    contactsWidth: contactsWidth.value,
    isResizing: isResizing.value
  })
  resizeMethods.value.onResizing = resizeMethods.value.onResizing.bind({
    contactsWidth: contactsWidth.value,
    isResizing: isResizing.value
  })
  resizeMethods.value.stopResizing = resizeMethods.value.stopResizing.bind({
    isResizing: isResizing.value
  })
}

// 生命周期钩子
onMounted(() => {
  fetchUserName()
})
defineExpose({
  handleRefreshOrders
})
</script>

<style scoped>
.contacts-container {
  position: relative;
  height: 100%;
  transition: width 0.3s ease, transform 0.3s ease;
  display: flex;
}

/* 侧边栏收起状态 */
.contacts-container.sidebar-collapsed {
  min-width: 0;
  overflow: visible;
}

.contacts-container.sidebar-collapsed .contacts {
  opacity: 0;
  pointer-events: none;
}

.contacts-container.sidebar-collapsed .resize-handle {
  display: none;
}

/* 侧边栏展开/收起按钮 */
.sidebar-toggle-btn {
  position: absolute;
  top: 50%;
  right: -24px;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border-radius: 10px;
  background-color: #ffffff;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  z-index: 100;
  border: 1px solid #e8e8e8;
}

.sidebar-toggle-btn:hover {
  background-color: #f5f5f5;
  color: #333;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.sidebar-toggle-btn.collapsed {
  right: -35px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 红点通知样式 */
.sidebar-toggle-btn.has-notification {
  position: relative;
}

.notification-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background-color: #ef4444;
  border-radius: 50%;
  border: 2px solid #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.contacts {
  flex: 1;
  border-right: 1px solid #e8e8e8;
  background-color: #F8FAFC;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  width: 100%;
}

/* 用户信息区域 */
.user-info-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

/* 新建工单按钮 */
.new-order-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 12px 16px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.2);
}

.new-order-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3);
}

.new-order-button:active {
  transform: translateY(0);
}

/* 历史会话标题 */
.history-title {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 历史工单列表 */
.order-item-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* 禁用状态 */
.order-item-list.disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* 调整宽度手柄 */
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
  background-color: rgba(99, 102, 241, 0.3);
}

.resize-handle:active {
  background-color: rgba(99, 102, 241, 0.5);
}
</style>
