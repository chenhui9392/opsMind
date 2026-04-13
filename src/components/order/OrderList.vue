<template>
  <div class="contacts-container" :style="{ width: contactsWidth + 'px' }">
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
        @refresh="handleRefreshOrders"
        @check-update="handleCheckUpdate"
        @logout="handleLogout"
      />

      <!-- 发送消息时的遮罩层 -->
      <div v-if="isSending" class="loading-overlay">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在发送消息...</div>
      </div>
    </div>
    <!-- 调整宽度手柄 -->
    <div class="resize-handle" @mousedown="resizeMethods.startResizing"></div>
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
  'logout'
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
 */
const fetchUserName = async () => {
  try {
    userName.value = await getSystemUsername()
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
  emit('update:showInput', false)
  emit('update:messages', messages)
  console.log('OrderList: 已从缓存获取工单消息', order.id)
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
  width: 0 !important;
  min-width: 0;
  overflow: hidden;
}

.contacts-container.sidebar-collapsed .contacts {
  opacity: 0;
}

.contacts-container.sidebar-collapsed .resize-handle {
  display: none;
}

.contacts {
  flex: 1;
  border-right: 1px solid #e8e8e8;
  background-color: #ffffff;
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

/* 加载遮罩层 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  cursor: not-allowed;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e0e0e0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-text {
  font-size: 14px;
  color: #6366f1;
  font-weight: 500;
}
</style>
