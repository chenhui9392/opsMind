<template>
  <div class="contacts-list" ref="contactsList">
    <!-- 加载中状态 -->
    <div class="loading-state" v-if="isLoading">
      <div class="loading-spinner"></div>
      <div class="loading-text">正在加载历史工单...</div>
    </div>

    <!-- 历史工单列表 -->
    <div class="history-orders-section" v-else-if="filteredOrders.length > 0">
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="order-card"
        :class="{ active: selectedContact === order.id }"
        @click="selectOrder(order)"
      >
        <!-- 状态小圆点 -->
        <div class="status-dot" :class="{ 'active-dot': selectedContact === order.id }"></div>
        <div class="card-content">
          <div class="card-header">
            <div class="order-title">{{ order.orderTitle }}</div>
            <div class="order-status-tag" :class="getStatusClass(order.orderStatus)">{{ getStatusText(order.orderStatus) }}</div>
          </div>
          <div class="order-unread" v-if="order.unreadCount && order.unreadCount > 0">
            【{{ order.unreadCount }}】条未读消息
          </div>
          <div class="card-footer">
            <div class="order-datetime">{{ formatDate(order.createTime) }}</div>
          </div>
        </div>
      </div>

      <!-- 加载更多状态 -->
      <div class="loading-more-state" v-if="isLoadingMore && !searchQuery">
        <div class="loading-spinner small"></div>
        <div class="loading-text small">加载中...</div>
      </div>

      <!-- 已加载全部数据提示 -->
      <div class="end-state" v-else-if="!hasMoreData && historyOrders.length > 0 && !searchQuery">
        <div class="end-text">已加载全部数据</div>
      </div>

      <!-- 错误提示 -->
      <div class="error-state" v-if="error && historyOrders.length > 0 && !searchQuery">
        <div class="error-text">{{ error }}</div>
        <button class="retry-button" @click="fetchHistoryOrders(true)">重试</button>
      </div>

      <!-- 搜索结果为空提示 -->
      <div class="empty-state" v-else-if="searchQuery && filteredOrders.length === 0">
        <div class="empty-icon">
          <SvgIcon name="search" width="48" height="48" />
        </div>
        <div class="empty-text">未找到相关工单</div>
        <div class="empty-subtext">请尝试其他搜索关键词</div>
      </div>
    </div>

    <!-- 无数据提示 -->
    <div class="empty-state" v-else-if="fetchAttempted">
      <div class="empty-icon">
        <SvgIcon name="inbox" width="48" height="48" />
      </div>
      <div class="empty-text">暂无历史工单</div>
      <div class="empty-subtext">工单数据将在这里展示</div>
    </div>

    <!-- 错误提示 -->
    <div class="error-state full" v-else-if="error">
      <div class="error-icon">
        <SvgIcon name="error" width="48" height="48" />
      </div>
      <div class="error-text">{{ error }}</div>
      <button class="retry-button" @click="fetchHistoryOrders()">重试</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import SvgIcon from '../../assets/svg/SvgIcon.vue'
import { getHistoryOrders } from '../../api/index'



// Props
const props = defineProps({
  selectedContact: {
    type: String,
    default: ''
  },
  searchQuery: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['select-order'])

// 响应式数据
const historyOrders = ref([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const fetchAttempted = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const hasMoreData = ref(true)
const error = ref(null)
const scrollListenerAdded = ref(false)

// 模板引用
const contactsList = ref(null)

// 计算属性
const filteredOrders = computed(() => {
  if (!props.searchQuery) {
    return historyOrders.value
  }
  const query = props.searchQuery.toLowerCase()
  return historyOrders.value.filter(order => {
    return (
      (order.orderTitle && order.orderTitle.toLowerCase().includes(query)) ||
      (order.userMessage && order.userMessage.toLowerCase().includes(query)) ||
      (order.orderType && order.orderType.toLowerCase().includes(query))
    )
  })
})

/**
 * 选择工单
 * @param {Object} order - 工单对象
 */
const selectOrder = (order) => {
  emit('select-order', order)
}

/**
 * 滚动到底部
 */
const scrollToBottom = () => {
  setTimeout(() => {
    const list = contactsList.value
    if (list) {
      list.scrollTop = list.scrollHeight
    }
  }, 100)
}

/**
 * 滚动到顶部
 */
const scrollToTop = () => {
  setTimeout(() => {
    const list = contactsList.value
    if (list) {
      list.scrollTop = 0
    }
  }, 100)
}

/**
 * 获取历史工单列表
 * @param {boolean} isLoadMore - 是否加载更多
 * @param {boolean} silent - 是否静默刷新（不显示 loading）
 */
const fetchHistoryOrders = async (isLoadMore = false, silent = false) => {
  if (isLoadMore) {
    isLoadingMore.value = true
  } else {
    removeScrollListener()
    if (!silent) {
      isLoading.value = true
    }
    fetchAttempted.value = true
    currentPage.value = 1
    historyOrders.value = []
    hasMoreData.value = true
    error.value = null
    scrollToTop()
  }

  try {
    // 从 localStorage 获取登录时的用户名
    const userName = localStorage.getItem('userName') || ''
    const response = await getHistoryOrders({
      pageNo: isLoadMore ? currentPage.value + 1 : 1,
      pageSize: pageSize.value,
      userName: userName
    })

    if (response && response.data) {
      const newOrders = response.data.records || response.data.list || response.data.data || []

      if (isLoadMore) {
        historyOrders.value = [...historyOrders.value, ...newOrders]
        currentPage.value++
      } else {
        historyOrders.value = newOrders
      }

      hasMoreData.value = newOrders.length === pageSize.value
    } else {
      if (!isLoadMore) {
        historyOrders.value = []
      }
      hasMoreData.value = false
    }
  } catch (err) {
    console.error('获取历史工单失败:', err)
    error.value = '加载失败，请稍后重试'
    if (!isLoadMore) {
      historyOrders.value = []
    }
  } finally {
    if (!silent) {
      isLoading.value = false
    }
    isLoadingMore.value = false

    if (!isLoadMore) {
      setTimeout(() => {
        addScrollListener()
      }, 500)
    }
  }
}

/**
 * 添加滚动事件监听器
 */
const addScrollListener = () => {
  const list = contactsList.value
  if (list && !scrollListenerAdded.value) {
    list.addEventListener('scroll', handleScroll)
    scrollListenerAdded.value = true
  }
}

/**
 * 移除滚动事件监听器
 */
const removeScrollListener = () => {
  const list = contactsList.value
  if (list && scrollListenerAdded.value) {
    list.removeEventListener('scroll', handleScroll)
    scrollListenerAdded.value = false
  }
}

/**
 * 格式化日期
 * @param {string} dateStr - 日期字符串
 * @returns {string} - 格式化后的日期
 */
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 获取状态文本
 * @param {string} status - 状态值
 * @returns {string} - 状态文本
 */
const getStatusText = (status) => {
  if (status === 'DRAFT') {
    return '草稿'
  }
  return '已创建'
}

/**
 * 获取状态样式类名
 * @param {string} status - 状态值
 * @returns {string} - 样式类名
 */
const getStatusClass = (status) => {
  if (status === 'DRAFT') {
    return 'status-draft'
  }
  return 'status-created'
}

/**
 * 处理滚动事件
 */
const handleScroll = () => {
  const list = contactsList.value
  if (!list) return

  const { scrollTop, scrollHeight, clientHeight } = list
  const distanceToBottom = scrollHeight - scrollTop - clientHeight

  if (distanceToBottom < 300 && !isLoadingMore.value && hasMoreData.value) {
    console.log('触发加载更多数据')
    fetchHistoryOrders(true)
  }
}

// 生命周期钩子
onMounted(() => {
  fetchHistoryOrders()
  nextTick(() => {
    addScrollListener()
  })
})

onBeforeUnmount(() => {
  nextTick(() => {
    removeScrollListener()
  })
})

// 暴露方法给父组件
defineExpose({
  historyOrders,
  scrollToTop,
  fetchHistoryOrders
})
</script>

<style scoped>
.contacts-list {
  padding: 0;
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 13px;
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
}

.empty-icon {
  color: #d1d5db;
  opacity: 0.8;
}

.empty-text {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.empty-subtext {
  font-size: 12px;
  color: #999;
}

.history-orders-section {
  padding: 12px;
}

/* 小卡片样式 */
.order-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  margin-bottom: 10px;
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 1;
}

.order-card:hover {
  background-color: #f9fafb;
  border-color: #6366f1;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
  transform: translateY(-1px);
  z-index: 2;
}

.order-card.active {
  background-color: #eef2ff;
  border-color: #6366f1;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
}

/* 状态小圆点 */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #d1d5db;
  flex-shrink: 0;
  margin-top: 6px;
  transition: all 0.2s ease;
}

.status-dot.active-dot {
  background-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.order-card:hover .status-dot {
  background-color: #9ca3af;
}

.order-card.active:hover .status-dot {
  background-color: #6366f1;
}

/* 卡片内容 */
.card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.order-title {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.order-status-tag {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 12px;
  flex-shrink: 0;
  font-weight: 500;
}

.order-status-tag.status-draft {
  color: #f59e0b;
  background-color: rgba(245, 158, 11, 0.1);
}

.order-status-tag.status-created {
  color: #10b981;
  background-color: rgba(16, 185, 129, 0.1);
}

.order-unread {
  font-size: 12px;
  color: #ef4444;
  font-weight: 500;
  line-height: 1.4;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.order-datetime {
  font-size: 11px;
  color: #9ca3af;
}

/* 加载更多状态 */
.loading-more-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  gap: 8px;
}

.loading-spinner.small {
  width: 20px;
  height: 20px;
  border: 2px solid #f0f0f0;
  border-top-color: #6366f1;
}

.loading-text.small {
  font-size: 12px;
  color: #999;
}

/* 已加载全部数据提示 */
.end-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.end-text {
  font-size: 12px;
  color: #9ca3af;
}

/* 错误提示 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  gap: 8px;
}

.error-state.full {
  height: 100%;
  padding: 40px 20px;
}

.error-icon {
  color: #ef4444;
  opacity: 0.7;
}

.error-text {
  font-size: 13px;
  color: #ef4444;
  text-align: center;
}

.retry-button {
  padding: 6px 14px;
  border: 1px solid #6366f1;
  border-radius: 6px;
  background-color: white;
  color: #6366f1;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-button:hover {
  background-color: #6366f1;
  color: white;
}

/* 滚动条样式 */
.contacts-list::-webkit-scrollbar {
  width: 4px;
}

.contacts-list::-webkit-scrollbar-track {
  background: transparent;
}

.contacts-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.contacts-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
