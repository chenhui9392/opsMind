<!--
 * @Author: hui.chenn
 * @Description: 悬浮球页面 - 可拖拽悬浮窗
 * @Date: 2026-03-31 09:50:00
 * @LastEditTime: 2026-03-31 09:50:00
 * @LastEditors: hui.chenn
-->
<template>
  <div class="floating-ball-box">
    <div
      class="floating-ball"
      :class="{ dragging: isDragging }"
      @mousedown="dragController.handleMouseDown"
      @mouseup="dragController.handleMouseUp"
    >
      <img src="/app.png" alt="AIT Claw" />
      <!-- 未读消息红点 -->
      <div v-if="unreadCount > 0" class="notification-badge">
        <span class="notification-count">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { createFloatingBallDrag } from '../utils/drag'

// 响应式数据
const isDragging = ref(false)
const unreadCount = ref(0)

// 拖拽控制器
let dragController = null

/**
 * 获取窗口位置并初始化拖拽
 */
const initWindowPosition = async () => {
  try {
    const pos = await window.electronAPI.getWindowPosition()

    // 创建拖拽控制器
    dragController = createFloatingBallDrag({
      // 拖拽开始
      onDragStart: () => {
        isDragging.value = true
      },

      // 拖拽中 - 更新窗口位置
      onDragMove: (x, y) => {
        window.electronAPI.updateWindowPosition({
          x: Math.round(x),
          y: Math.round(y)
        })
      },

      // 拖拽结束
      onDragEnd: () => {
        isDragging.value = false
      },

      // 点击 - 打开主窗口并清空未读
      onClick: () => {
        unreadCount.value = 0
        window.electronAPI.toggleMainWindow()
      }
    })

    // 设置初始位置
    dragController.setPosition(pos.x, pos.y)

    // 绑定全局事件
    document.addEventListener('mousemove', dragController.handleMouseMove)
    document.addEventListener('mouseup', dragController.stopDragging)
    document.addEventListener('mouseleave', dragController.stopDragging)
    document.addEventListener('click', dragController.handleDocumentClick, true)

  } catch (error) {
    console.error('[FloatingBall] 初始化窗口位置失败:', error)
  }
}

/**
 * 处理未读消息通知
 * @param {Object} data - 消息数据
 */
const handleUnreadMessage = (data) => {
  console.log('[FloatingBall] 收到未读消息通知:', data)

  // 只对 broadcast 类型的消息进行计数
  if (data.type === 'broadcast' && data.message) {
    unreadCount.value++
    console.log('[FloatingBall] 当前未读消息数:', unreadCount.value)
  }
}

/**
 * 处理主窗口显示事件 - 清空未读计数
 */
const handleMainWindowShown = () => {
  console.log('[FloatingBall] 主窗口已显示，清空未读消息')
  unreadCount.value = 0
}

// 生命周期钩子
onMounted(() => {
  console.log('[FloatingBall] 组件挂载开始')

  // 初始化窗口位置和拖拽
  initWindowPosition()

  // 注册 IPC 消息监听（从主窗口接收未读消息通知）
  console.log('[FloatingBall] 注册 IPC 未读消息监听')
  if (window.electronAPI && window.electronAPI.onUnreadMessage) {
    window.electronAPI.onUnreadMessage(handleUnreadMessage)
  }

  // 监听主窗口显示事件
  if (window.electronAPI && window.electronAPI.onMainWindowShown) {
    window.electronAPI.onMainWindowShown(handleMainWindowShown)
  }

  console.log('[FloatingBall] 组件挂载完成')
})

onBeforeUnmount(() => {
  // 移除全局事件监听
  if (dragController) {
    document.removeEventListener('mousemove', dragController.handleMouseMove)
    document.removeEventListener('mouseup', dragController.stopDragging)
    document.removeEventListener('mouseleave', dragController.stopDragging)
    document.removeEventListener('click', dragController.handleDocumentClick, true)

    // 清理拖拽控制器
    dragController.destroy()
    dragController = null
  }

  // 移除 IPC 消息监听
  if (window.electronAPI && window.electronAPI.offUnreadMessage) {
    window.electronAPI.offUnreadMessage(handleUnreadMessage)
  }

  // 移除主窗口显示监听
  if (window.electronAPI && window.electronAPI.offMainWindowShown) {
    window.electronAPI.offMainWindowShown(handleMainWindowShown)
  }
})
</script>

<style>
/* 全局样式 - 覆盖默认背景 */
html, body {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  height: 100% !important;
  overflow: hidden !important;
  background: transparent !important;
}

#app {
  width: 100% !important;
  height: 100% !important;
  background: transparent !important;
}
</style>

<style scoped>
.floating-ball-box {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  overflow: visible;
}

.floating-ball {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: move;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: box-shadow 0.2s;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  position: relative;
}

.floating-ball:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

.floating-ball.dragging {
  cursor: grabbing;
}

.floating-ball img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  background: transparent;
}

/* 通知红点样式 - 定位在图片右上角 */
.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: linear-gradient(135deg, #ff4757 0%, #ff3838 100%);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(255, 71, 87, 0.4);
  border: 2px solid #fff;
  animation: badgePulse 2s infinite;
  z-index: 10;
}

.notification-count {
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  line-height: 1;
}

@keyframes badgePulse {
  0% {
    transform: scale(1);
    box-shadow: 0 2px 4px rgba(255, 71, 87, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(255, 71, 87, 0.6);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 2px 4px rgba(255, 71, 87, 0.4);
  }
}
</style>
