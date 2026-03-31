<template>
  <div class="contacts-container" :style="{ width: contactsWidth + 'px' }">
    <div class="contacts">
      <!-- 历史工单头部组件 -->
      <div class="order-header">
        <OrderHeader
          @refresh-orders="handleRefreshOrders"
        />
      </div>

      <!-- 搜索框 -->
      <SearchBox
        v-model="searchQuery"
        placeholder="搜索工单..."
        @search="handleSearch"
      />

    <BackToCurrent
      v-if="!isCurrentChatSelected"
      @click="handleBackToCurrent"
    />

    <!-- 历史工单列表组件 -->
    <div class="order-item-list" :class="{ 'disabled': isSending }">
      <OrderItemList
          ref="orderItemList"
        :selectedContact="selectedContact"
        :searchQuery="searchQuery"
        @select-order="handleSelectOrder"
      />
    </div>

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
import { ref, computed } from 'vue'
import SearchBox from '../common/SearchBox.vue'
import BackToCurrent from '../common/BackToCurrent.vue'
import OrderHeader from './OrderHeader.vue'
import OrderItemList from './OrderItemList.vue'
import messageService from '../../services/messageService'
import { updateMessageStatus } from '../../api/index'
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
  'back-to-current'
])

// 响应式数据
const searchQuery = ref('')
const contactsWidth = ref(300)
const isResizing = ref(false)
const resizeMethods = ref(null)

// 模板引用
const orderItemList = ref(null)

// 计算属性
const isCurrentChatSelected = computed(() => {
  return props.selectedContact === props.currentChatSession
})

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
 * 更新工单
 * @param {Object} id - 工单id
 */
const updateOrder = (id) => {
  try {
    updateMessageStatus(id, 'READ')
    console.log('工单消息状态更新成功:', id)
  } catch (error) {
    console.error('更新工单消息状态失败:', error)
  }
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
  if (orderItemList.value && orderItemList.value.fetchHistoryOrders) {
    orderItemList.value.fetchHistoryOrders()
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
</script>

<style scoped>
.contacts-container {
  position: relative;
  height: 100%;
  transition: width 0.2s ease;
  display: flex;
}

.contacts {
  flex: 1;
  border-right: 1px solid #e0e0e0;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  width: 100%;
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

/* 禁用状态 */
.order-item-list.disabled {
  opacity: 0.5;
  pointer-events: none;
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
  border-top-color: #673ab7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 14px;
  color: #673ab7;
  font-weight: 500;
}

/* 确保OrderHeader固定在顶部 */
.contacts > .order-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

/* 确保OrderItemList可以滚动 */
.contacts > .order-item-list {
  flex: 1;
  overflow-y: auto;
}

</style>
