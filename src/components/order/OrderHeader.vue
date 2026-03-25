<template>
  <div class="contacts-header">
    <div class="header-top">
      <h2>{{ title }}</h2>
      <button 
        class="refresh-button" 
        @click="refreshOrders"
        :class="{ 'refreshing': isRefreshing }"
        :disabled="isRefreshing"
        title="刷新工单列表"
      >
        <SvgIcon 
          name="refresh" 
          width="16" 
          height="16" 
          :class="{ 'spinning': isRefreshing }" 
        />
      </button>
    </div>
    <div class="search-container">
      <input
        type="text"
        v-model="searchQuery"
        class="search-input"
        :placeholder="placeholder"
      />
      <button
        v-if="searchQuery"
        class="search-clear-button"
        @click="clearSearch"
      >
        <SvgIcon name="clear" width="14" height="14" />
      </button>
    </div>
  </div>
</template>

<script>
import SvgIcon from '../../assets/svg/SvgIcon.vue'

export default {
  name: 'OrderHeader',
  components: {
    SvgIcon
  },
  props: {
    title: {
      type: String,
      default: '历史工单'
    },
    placeholder: {
      type: String,
      default: '搜索工单...'
    }
  },
  data() {
    return {
      searchQuery: '',
      isRefreshing: false
    }
  },
  methods: {
    clearSearch() {
      this.searchQuery = ''
      this.$emit('clear-search')
    },
    createNewSession() {
      this.$emit('create-new-session')
    },
    refreshOrders() {
      this.isRefreshing = true
      this.$emit('refresh-orders')
      // 模拟刷新完成，实际应该由父组件通过事件回调来重置此状态
      setTimeout(() => {
        this.isRefreshing = false
      }, 1000)
    }
  },
  watch: {
    searchQuery(newValue) {
      this.$emit('search', newValue)
    }
  }
}
</script>

<style scoped>
.contacts-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.contacts-header h2 {
  margin: 0;
  font-size: 18px;
  color: white;
  font-weight: 600;
}

.new-session-button {
  padding: 6px 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  background-color: transparent;
  color: white;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.new-session-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.refresh-button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.refresh-button:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.refresh-button:active {
  transform: scale(0.95);
}

.refresh-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 旋转动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

.search-container {
  width: 100%;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 16px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  transition: background-color 0.3s ease;
}

.search-input:focus {
  background-color: rgba(255, 255, 255, 0.3);
}

.search-clear-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.search-clear-button:hover {
  background-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-50%) scale(1.1);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}
</style>
