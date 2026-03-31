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
        class="contact-item order-item"
        :class="{ active: selectedContact === order.id }"
        @click="selectOrder(order)"
      >
        <div class="contact-content">
          <div class="contact-info">
            <div class="order-name">{{ order.orderTitle }}</div>
            <div class="order-type" v-if="order.orderType">{{ orderTypeText(order.orderType) }}</div>
          </div>
          <div class="order-user-message" v-if="order.systemName && order.moduleName">
            {{ order.systemName }} <span v-if="order.moduleName">-</span> {{order.moduleName}}
          </div>
          <div class="order-time">
            {{ formatDate(order.createTime) }}
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
          <SvgIcon name="search" width="64" height="64" />
        </div>
        <div class="empty-text">未找到相关工单</div>
        <div class="empty-subtext">请尝试其他搜索关键词</div>
      </div>
    </div>

    <!-- 无数据提示 -->
    <div class="empty-state" v-else-if="fetchAttempted">
      <div class="empty-icon">
        <SvgIcon name="inbox" width="64" height="64" />
      </div>
      <div class="empty-text">暂无历史工单</div>
      <div class="empty-subtext">工单数据将在这里展示</div>
    </div>

    <!-- 错误提示 -->
    <div class="error-state full" v-else-if="error">
      <div class="error-icon">
        <SvgIcon name="error" width="64" height="64" />
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
import { getSystemUsername } from '../../utils/system'

const ORDER_TYPE_MAP = {
  CONSULTATION: '咨询',
  REQUIREMENT: '需求',
  BUG: 'BUG',
  DATA_CHANGE: '数据变更',
}

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
 */
const fetchHistoryOrders = async (isLoadMore = false) => {
  if (isLoadMore) {
    isLoadingMore.value = true
  } else {
    removeScrollListener()
    isLoading.value = true
    fetchAttempted.value = true
    currentPage.value = 1
    historyOrders.value = []
    hasMoreData.value = true
    error.value = null
    scrollToTop()
  }

  try {
    const userName = await getSystemUsername()
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
    isLoading.value = false
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

const orderTypeText = (orderType) => {
  return ORDER_TYPE_MAP[orderType] || ''
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
  padding: 8px 0;
  height: 100%;
  overflow-y: auto;
  position: relative;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3e5f5;
  border-top-color: #673ab7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 14px;
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.empty-icon {
  color: #d1c4e9;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: #999;
  font-weight: 500;
}

.empty-subtext {
  font-size: 13px;
  color: #bbb;
}

.history-orders-section {
  margin-bottom: 16px;
}

.order-item {
  background-color: #fff8e1;
  border-left: 3px solid #ff9800;
}

.order-item:hover {
  background-color: #ffecb3;
}

.order-name {
  font-weight: 600;
  color: #333;
  font-size: 15px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}


.order-type {
  font-size: 12px;
  color: #ff9800;
  background-color: rgba(255, 152, 0, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}

.order-user-message {
  font-size: 12px;
  color: #666;
  margin-top: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.order-time {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  text-align: right;
  flex-shrink: 0;
}

.contact-item {
  padding: 14px 16px;
  border: none;
  border-radius: 12px;
  margin: 0 8px 8px;
  cursor: pointer;
  background-color: #ffffff;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.contact-item:hover {
  background-color: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.contact-item.active {
  background-color: #ede7f6;
  border-left: 4px solid #673ab7;
}

.contact-content {
  flex: 1;
  min-width: 0;
}

.contact-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

/* 加载更多状态 */
.loading-more-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 8px;
}

.loading-spinner.small {
  width: 24px;
  height: 24px;
  border: 2px solid #f3e5f5;
  border-top-color: #673ab7;
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
  padding: 20px;
}

.end-text {
  font-size: 12px;
  color: #999;
}

/* 错误提示 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 12px;
}

.error-state.full {
  height: 100%;
  padding: 60px 20px;
}

.error-icon {
  color: #ff4757;
  opacity: 0.5;
}

.error-text {
  font-size: 14px;
  color: #ff4757;
  text-align: center;
}

.retry-button {
  padding: 6px 16px;
  border: 1px solid #673ab7;
  border-radius: 16px;
  background-color: white;
  color: #673ab7;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-button:hover {
  background-color: #673ab7;
  color: white;
}

/* 滚动条样式 */
.contacts-list::-webkit-scrollbar {
  width: 6px;
}

.contacts-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.contacts-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.contacts-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
