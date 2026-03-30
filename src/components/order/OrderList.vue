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

<script>
import SearchBox from '../common/SearchBox.vue'
import BackToCurrent from '../common/BackToCurrent.vue'
import OrderHeader from './OrderHeader.vue'
import OrderItemList from './OrderItemList.vue'
import messageService from '../../services/messageService'
import { updateMessageStatus } from '../../api/index'
import { createResizeMethods } from '../../utils/resizeHandler'

export default {
  name: 'OrderList',
  components: {
    SearchBox,
    BackToCurrent,
    OrderHeader,
    OrderItemList
  },
  props: {
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
  },
  data() {
    return {
      searchQuery: '',
      contactsWidth: 300, // 初始宽度
      isResizing: false,
      // 调整大小方法由 createResizeMethods 注入
      resizeMethods: null
    }
  },
  computed: {
    isCurrentChatSelected() {
      return this.selectedContact === this.currentChatSession
    }
  },
  methods: {
    /**
     * 处理选择工单（禁用状态）
     * @param {Object} order - 工单对象
     */
    async handleSelectOrder(order) {
      // 如果正在发送消息，不允许切换会话
      if (this.isSending) {
        console.log('正在发送消息中，无法切换会话')
        return
      }
      await this.selectOrder(order)
    },
    /**
     * 处理回到当前聊天（禁用状态）
     */
    handleBackToCurrent() {
      // 如果正在发送消息，不允许切换会话
      if (this.isSending) {
        return
      }
      this.$emit('back-to-current')
    },
    /**
     * 处理搜索
     * @param {string} query - 搜索关键词
     */
    handleSearch(query) {
      this.searchQuery = query
    },
    /**
     * 选择工单
     * @param {Object} order - 工单对象
     */
    async selectOrder(order) {
      console.log('OrderList: 选择工单', order)
      // 从消息服务获取工单消息（会自动保存到缓存）
      const messages = await messageService.selectOrder(order)
      // 通知父组件更新
      this.$emit('update:selectedContact', order.id)
      this.$emit('update:showInput', false)
      this.$emit('update:messages', messages)
      console.log('OrderList: 已从缓存获取工单消息', order.id)
    },
    /**
     * 更新工单
     * @param {Object} id - 工单id
     */
    updateOrder(id) {
      // 调用更新工单消息状态接口
      try {
        updateMessageStatus(id, 'READ')
        console.log('工单消息状态更新成功:', id)
      } catch (error) {
        console.error('更新工单消息状态失败:', error)
      }
    },
    /**
     * 回到当前聊天会话
     */
    backToCurrentChat() {
      this.$emit('back-to-current')
    },
    /**
     * 处理刷新工单列表
     */
    handleRefreshOrders() {
      if (this.$refs.orderItemList) {
        this.$refs.orderItemList.fetchHistoryOrders()
      }
    }
  },
  created() {
    // 初始化调整大小方法
    this.resizeMethods = createResizeMethods(this, {
      widthKey: 'contactsWidth',
      resizingKey: 'isResizing',
      minWidth: 200,
      maxWidth: 500
    })
    // 绑定方法到当前实例
    this.resizeMethods.startResizing = this.resizeMethods.startResizing.bind(this)
    this.resizeMethods.onResizing = this.resizeMethods.onResizing.bind(this)
    this.resizeMethods.stopResizing = this.resizeMethods.stopResizing.bind(this)
  }
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
