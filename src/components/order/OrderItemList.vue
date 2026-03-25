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

<script>
import SvgIcon from '../../assets/svg/SvgIcon.vue'
import { getHistoryOrders } from '../../api/index'

const ORDER_TYPE_MAP = {
  CONSULTATION: '咨询',
  REQUIREMENT: '需求',
  BUG: 'BUG',
  DATA_CHANGE: '数据变更',
}
export default {
  name: 'OrderItemList',
  components: {
    SvgIcon
  },
  props: {
    selectedContact: {
      type: String,
      default: ''
    },
    searchQuery: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      historyOrders: [], // 历史工单列表
      isLoading: false, // 加载状态
      isLoadingMore: false, // 加载更多状态
      fetchAttempted: false, // 是否已尝试获取数据
      currentPage: 1, // 当前页码
      pageSize: 10, // 每页大小
      hasMoreData: true, // 是否有更多数据
      error: null, // 错误信息
      scrollListenerAdded: false // 滚动事件监听器是否已添加
    }
  },
  computed: {
    /**
     * 过滤后的工单列表
     */
    filteredOrders() {
      if (!this.searchQuery) {
        return this.historyOrders
      }
      const query = this.searchQuery.toLowerCase()
      return this.historyOrders.filter(order => {
        return (
          (order.orderTitle && order.orderTitle.toLowerCase().includes(query)) ||
          (order.userMessage && order.userMessage.toLowerCase().includes(query)) ||
          (order.orderType && order.orderType.toLowerCase().includes(query))
        )
      })
    }
  },
  methods: {
    /**
     * 选择工单
     * @param {Object} order - 工单对象
     */
    async selectOrder(order) {
      // 触发自定义事件，将工单信息传递给父组件
      this.$emit('select-order', order)
    },
    /**
     * 滚动到底部
     */
    scrollToBottom() {
      setTimeout(() => {
        const contactsList = this.$refs.contactsList
        if (contactsList) {
          contactsList.scrollTop = contactsList.scrollHeight
        }
      }, 100)
    },
    /**
     * 滚动到顶部
     */
    scrollToTop() {
      setTimeout(() => {
        const contactsList = this.$refs.contactsList
        if (contactsList) {
          contactsList.scrollTop = 0
        }
      }, 100)
    },
    /**
     * 获取历史工单列表
     */
    async fetchHistoryOrders(isLoadMore = false) {
      if (isLoadMore) {
        this.isLoadingMore = true
      } else {
        // 刷新时暂时移除滚动事件监听器，防止触发加载更多
        this.removeScrollListener()

        this.isLoading = true // 开始加载
        this.fetchAttempted = true
        this.currentPage = 1
        this.historyOrders = []
        this.hasMoreData = true
        this.error = null
        // 刷新时滚动到顶部
        this.scrollToTop()
      }

      try {
        const response = await getHistoryOrders({
          pageNo: isLoadMore ? this.currentPage + 1 : 1,
          pageSize: this.pageSize
        })

        if (response && response.data) {
          // 尝试多种可能的数据结构
          const newOrders = response.data.records || response.data.list || response.data.data || []

          if (isLoadMore) {
            this.historyOrders = [...this.historyOrders, ...newOrders]
            this.currentPage++
          } else {
            this.historyOrders = newOrders
          }

          // 判断是否还有更多数据
          this.hasMoreData = newOrders.length === this.pageSize
        } else {
          if (!isLoadMore) {
            this.historyOrders = []
          }
          this.hasMoreData = false
        }
      } catch (error) {
        console.error('获取历史工单失败:', error)
        this.error = '加载失败，请稍后重试'
        if (!isLoadMore) {
          this.historyOrders = []
        }
      } finally {
        this.isLoading = false // 加载完成
        this.isLoadingMore = false

        // 刷新完成后重新添加滚动事件监听器
        if (!isLoadMore) {
          setTimeout(() => {
            this.addScrollListener()
          }, 500)
        }
      }
    },
    /**
     * 添加滚动事件监听器
     */
    addScrollListener() {
      const contactsList = this.$refs.contactsList
      if (contactsList && !this.scrollListenerAdded) {
        contactsList.addEventListener('scroll', this.handleScroll)
        this.scrollListenerAdded = true
      }
    },
    /**
     * 移除滚动事件监听器
     */
    removeScrollListener() {
      const contactsList = this.$refs.contactsList
      if (contactsList && this.scrollListenerAdded) {
        contactsList.removeEventListener('scroll', this.handleScroll)
        this.scrollListenerAdded = false
      }
    },
    /**
     * 格式化日期
     * @param {string} dateStr - 日期字符串
     * @returns {string} - 格式化后的日期
     */
    formatDate(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const seconds = date.getSeconds().toString().padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    orderTypeText(orderType) {
      return ORDER_TYPE_MAP[orderType] || ''
    },
    /**
     * 处理滚动事件
     */
    handleScroll() {
      const contactsList = this.$refs.contactsList
      if (!contactsList) return

      const { scrollTop, scrollHeight, clientHeight } = contactsList
      const distanceToBottom = scrollHeight - scrollTop - clientHeight

      // 当距离底部300px且不是正在加载，且有更多数据时，加载更多
      if (distanceToBottom < 300 && !this.isLoadingMore && this.hasMoreData) {
        console.log('触发加载更多数据')
        this.fetchHistoryOrders(true)
      }
    }
  },
  mounted() {
    // 组件挂载时加载历史工单
    this.fetchHistoryOrders()

    // 使用nextTick确保DOM已经更新
    this.$nextTick(() => {
      // 添加滚动事件监听器
      this.addScrollListener()
    })
  },
  beforeUnmount() {
    // 使用nextTick确保DOM仍然存在
    this.$nextTick(() => {
      // 移除滚动事件监听器
      this.removeScrollListener()
    })
  },
}
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
  white-space: nowrap; /* 防止文本换行 */
  overflow: hidden; /* 隐藏溢出的内容 */
  text-overflow: ellipsis; /* 溢出内容显示为省略号 */
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
