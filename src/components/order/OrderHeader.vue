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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SvgIcon from '../../assets/svg/SvgIcon.vue'

// Props
const props = defineProps({
  title: {
    type: String,
    default: '历史工单'
  },
  placeholder: {
    type: String,
    default: '搜索工单...'
  }
})

// Emits
const emit = defineEmits(['refresh-orders'])

// 响应式数据
const isRefreshing = ref(false)

// 方法
const refreshOrders = () => {
  isRefreshing.value = true
  emit('refresh-orders')
  setTimeout(() => {
    isRefreshing.value = false
  }, 1000)
}
</script>

<style scoped>
.contacts-header {
  padding: 0 16px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  height: 72px;
  box-sizing: border-box;
  justify-content: center;
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
</style>
