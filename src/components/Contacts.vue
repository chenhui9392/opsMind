<template>
  <div class="contacts">
    <ContactsHeader
    @search="handleSearch"
    @clear-search="clearSearch"
    @create-new-session="$emit('create-new-session')"
  />
    <div class="back-to-current" v-if="!isCurrentChatSelected" @click="$emit('back-to-current')">
      <div class="back-to-current-text">回到当前聊天</div>
      <div class="back-to-current-icon">
        <SvgIcon name="arrow" width="16" height="16" />
      </div>
    </div>


    <div class="contacts-list" ref="contactsList">
      <!-- 加载中状态 -->
      <div class="loading-state" v-if="isLoading">
        <div class="loading-spinner"></div>
        <div class="loading-text">正在加载历史工单...</div>
      </div>

      <!-- 历史工单列表 -->
      <div class="history-orders-section" v-else-if="historyOrders.length > 0">
        <div
          v-for="order in historyOrders"
          :key="order.id"
          class="contact-item order-item"
          @click="selectOrder(order)"
        >
          <div class="contact-content">
            <div class="contact-info">
              <div class="order-name">{{ order.orderTitle }}</div>
              <div class="order-type" v-if="order.orderType">{{ order.orderType }}</div>
            </div>
            <div class="order-user-message">
              {{ order.userMessage }}
            </div>
            <div class="order-time">
              {{ formatDate(order.createTime) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 无数据提示 -->
      <div class="empty-state" v-else>
        <div class="empty-icon">
          <SvgIcon name="inbox" width="64" height="64" />
        </div>
        <div class="empty-text">暂无历史工单</div>
        <div class="empty-subtext">工单数据将在这里展示</div>
      </div>
    </div>

  </div>
</template>

<script>
import SvgIcon from '../assets/svg/SvgIcon.vue'
import ContactsHeader from './ContactsHeader.vue'
import { getHistoryOrders } from '../api/index'

// 工单类型映射
const ORDER_TYPE_MAP = {
  CONSULTATION: '咨询',
  REQUIREMENT: '需求',
  BUG: 'BUG',
  DATA_CHANGE: '数据变更',
}

export default {
  name: 'Contacts',
  components: {
    SvgIcon,
    ContactsHeader
  },
  props: {
    contacts: {
      type: Array,
      default: () => []
    },
    selectedContact: {
      type: Number,
      default: 1
    },
    currentChatSession: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      searchQuery: '',
      historyOrders: [], // 历史工单列表
      isLoading: false, // 加载状态
      fetchAttempted: false // 是否已尝试获取数据
    }
  },
  computed: {
    isCurrentChatSelected() {
      return this.selectedContact === this.currentChatSession
    }
  },
  methods: {
    /**
     * 选择联系人
     * @param {number} contactId - 联系人 ID
     */
    selectContact(contactId) {
      this.$emit('select', contactId)
    },
    /**
     * 选择工单
     * @param {Object} order - 工单对象
     */
    selectOrder(order) {
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
     * 清除搜索
     */
    clearSearch() {
      this.searchQuery = ''
    },
    /**
     * 处理搜索
     * @param {string} query - 搜索关键词
     */
    handleSearch(query) {
      this.searchQuery = query
    },
    /**
     * 获取历史工单列表
     */
    async fetchHistoryOrders() {
      this.isLoading = true // 开始加载
      this.fetchAttempted = true
      try {
        const response = await getHistoryOrders()

        if (response && response.data) {
          // 尝试多种可能的数据结构
          this.historyOrders = response.data.records || response.data.list || response.data.data || []
        } else {
          this.historyOrders = []
        }
      } catch (error) {
        console.error('获取历史工单失败:', error)
        this.historyOrders = []
      } finally {
        this.isLoading = false // 加载完成
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
      return `${year}-${month}-${day}`
    }
  },
  mounted() {
    // 组件挂载时加载历史工单
    this.fetchHistoryOrders()
  }
}
</script>

<style scoped>
.contacts {
  width: 100%;
  border-right: 1px solid #e0e0e0;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  height: 100%;
}



.back-to-current {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.back-to-current:hover {
  background: linear-gradient(135deg, #e1bee7 0%, #ce93d8 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.back-to-current-icon {
  font-size: 16px;
  color: #673ab7;
}

.back-to-current-text {
  font-size: 14px;
  color: #673ab7;
  font-weight: 600;
  flex: 1;
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.refresh-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;
}

.refresh-text {
  font-size: 14px;
  color: #999;
}

.refresh-btn {
  padding: 8px 24px;
  background: linear-gradient(135deg, #673ab7 0%, #5e35b1 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(103, 58, 183, 0.3);
}

.refresh-btn:hover {
  background: linear-gradient(135deg, #5e35b1 0%, #512da8 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(103, 58, 183, 0.4);
}

.history-orders-section {
  margin-bottom: 16px;
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

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #673ab7;
  padding: 8px 16px;
  background-color: #f3e5f5;
  border-radius: 8px;
  margin: 8px 8px 12px;
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
  font-size: 13px;
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

.contact-avatar {
  flex-shrink: 0;
}

.avatar-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.contact-name {
  font-weight: 600;
  color: #333;
  margin-right: 8px;
  font-size: 15px;
}

.contact-time {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

.contact-message {
  font-size: 14px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  white-space: normal;
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
