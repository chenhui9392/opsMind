<!--
 * @Author: hui.chenn
 * @Description: 应用入口 - 路由页面容器
 * @Date: 2026-03-17 18:17:55
 * @LastEditTime: 2026-03-31 09:30:00
 * @LastEditors: hui.chenn
-->
<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useAuth } from './composables/useAuth'

// App.vue - 应用入口组件
const { checkAuth } = useAuth()

/**
 * 处理定时任务执行结果
 * @param {Object} data - 执行结果
 */
const handleScheduledTaskResult = (data) => {
  console.log('[App] 收到定时任务执行结果:', data)
  if (data.type === 'success') {
    console.log(`[App] 定时任务执行成功 - ${data.timestamp}`)
  } else if (data.type === 'failure') {
    console.error(`[App] 定时任务执行失败 - ${data.timestamp}:`, data.error)
  } else if (data.type === 'exception') {
    console.error(`[App] 定时任务执行异常 - ${data.timestamp}:`, data.error)
  }
}

onMounted(() => {
  // 应用启动时检查认证状态，如果已登录则恢复定时任务
  checkAuth()

  // 监听定时任务执行结果（仅在 Electron 环境）
  if (typeof window !== 'undefined' && window.scheduledTaskAPI?.onScheduledTaskResult) {
    window.scheduledTaskAPI.onScheduledTaskResult(handleScheduledTaskResult)
  }
})

onUnmounted(() => {
  // 移除监听
  if (typeof window !== 'undefined' && window.scheduledTaskAPI?.offScheduledTaskResult) {
    window.scheduledTaskAPI.offScheduledTaskResult(handleScheduledTaskResult)
  }
})
</script>
