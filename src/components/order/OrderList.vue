<template>
  <div class="contacts">
    <!-- 历史工单头部组件 -->
    <div class="order-header">
      <OrderHeader
        @search="handleSearch"
        @clear-search="clearSearch"
        @create-new-session="$emit('create-new-session')"
      />
    </div>

    <div class="back-to-current" v-if="!isCurrentChatSelected" @click="$emit('back-to-current')">
      <div class="back-to-current-text">回到当前聊天</div>
      <div class="back-to-current-icon">
        <SvgIcon name="arrow" width="16" height="16" />
      </div>
    </div>

    <!-- 历史工单列表组件 -->
    <div class="order-item-list">
      <OrderItemList
          ref="orderItemList"
        :selectedContact="selectedContact"
        @select-order="$emit('select-order', $event)"
      />
    </div>
  </div>
</template>

<script>
import SvgIcon from '../../assets/svg/SvgIcon.vue'
import OrderHeader from './OrderHeader.vue'
import OrderItemList from './OrderItemList.vue'

export default {
  name: 'OrderList',
  components: {
    SvgIcon,
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
    }
  },
  data() {
    return {
      searchQuery: ''
    }
  },
  computed: {
    isCurrentChatSelected() {
      return this.selectedContact === this.currentChatSession
    }
  },
  methods: {
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
    }
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
  position: relative;
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
</style>
