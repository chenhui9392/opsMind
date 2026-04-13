<!--
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-04-13 13:40:30
 * @LastEditTime: 2026-04-13 13:40:46
 * @LastEditors: hui.chenn
-->
<template>
  <div class="bottom-toolbar">
    <!-- 刷新按钮 -->
    <button
      class="toolbar-btn"
      :class="{ 'refresh-btn': isRefreshing }"
      @click="handleRefresh"
      title="刷新列表"
      :disabled="isRefreshing"
    >
      <SvgIcon name="refresh" width="18" height="18" :class="{ 'spinning': isRefreshing }" />
    </button>

    <!-- 检查更新按钮 -->
    <button
      class="toolbar-btn"
      @click="handleCheckUpdate"
      title="检查更新"
    >
      <SvgIcon name="update" width="18" height="18" />
    </button>

    <!-- 退出登录按钮 -->
    <button
      class="toolbar-btn logout-btn"
      @click="handleLogout"
      title="退出登录"
    >
      <SvgIcon name="logout" width="18" height="18" />
    </button>
  </div>
</template>

<script setup>
import SvgIcon from '../../assets/svg/SvgIcon.vue'

/**
 * BottomToolbar 组件
 * 底部工具栏，包含刷新、检查更新、退出登录三个功能按钮
 */

// Props
const props = defineProps({
  /**
   * 是否正在刷新中
   */
  isRefreshing: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'refresh',
  'check-update',
  'logout'
])

/**
 * 处理刷新
 */
const handleRefresh = () => {
  if (props.isRefreshing) return
  emit('refresh')
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
  emit('logout')
}
</script>

<style scoped>
/* 底部工具栏 */
.bottom-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background-color: transparent;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-btn:hover:not(:disabled) {
  background-color: #f0f0f0;
  color: #333;
}

.toolbar-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.toolbar-btn.logout-btn:hover {
  background-color: #fee2e2;
  color: #ef4444;
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
