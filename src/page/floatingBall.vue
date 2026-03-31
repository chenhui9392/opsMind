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
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
    >
      <img src="/app.png" alt="AIT Claw" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

// 响应式数据
const isDragging = ref(false)
const isMouseDown = ref(false)
const hasDragged = ref(false)
const startX = ref(0)
const startY = ref(0)
const windowX = ref(0)
const windowY = ref(0)
const lastX = ref(0)
const lastY = ref(0)
const lastMouseX = ref(0)
const lastMouseY = ref(0)
const mouseDownTime = ref(0)
const animationFrameId = ref(null)

// 常量
const DRAG_THRESHOLD = 5

/**
 * 获取窗口位置
 */
const getWindowPosition = async () => {
  try {
    const pos = await window.electronAPI.getWindowPosition()
    windowX.value = pos.x
    windowY.value = pos.y
    lastX.value = pos.x
    lastY.value = pos.y
  } catch (error) {
    console.error('Error getting window position:', error)
  }
}

/**
 * 鼠标按下 - 开始拖拽
 */
const handleMouseDown = (e) => {
  // 只处理左键
  if (e.button !== 0) return

  isDragging.value = true
  hasDragged.value = false
  isMouseDown.value = true
  mouseDownTime.value = Date.now()
  startX.value = e.screenX
  startY.value = e.screenY
  lastMouseX.value = e.screenX
  lastMouseY.value = e.screenY

  // 阻止默认行为
  e.preventDefault()
}

/**
 * 鼠标移动 - 拖拽中
 */
const handleMouseMove = (e) => {
  if (!isDragging.value) return

  const screenX = e.screenX
  const screenY = e.screenY

  // 计算从mousedown开始的总移动距离
  const totalDeltaX = Math.abs(screenX - startX.value)
  const totalDeltaY = Math.abs(screenY - startY.value)

  // 判断是否超过拖拽阈值
  if (totalDeltaX > DRAG_THRESHOLD || totalDeltaY > DRAG_THRESHOLD) {
    hasDragged.value = true
  }

  // 计算鼠标移动距离
  const mouseDeltaX = screenX - lastMouseX.value
  const mouseDeltaY = screenY - lastMouseY.value

  // 只有当鼠标移动超过阈值时才处理
  if (Math.abs(mouseDeltaX) < 2 && Math.abs(mouseDeltaY) < 2) {
    e.preventDefault()
    return
  }

  // 更新鼠标位置
  lastMouseX.value = screenX
  lastMouseY.value = screenY

  // 取消之前的动画帧
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
  }

  // 使用 requestAnimationFrame 进行位置更新
  animationFrameId.value = requestAnimationFrame(() => {
    updatePosition(screenX, screenY)
  })

  e.preventDefault()
}

/**
 * 更新位置
 */
const updatePosition = (screenX, screenY) => {
  if (!isDragging.value) return

  const deltaX = screenX - startX.value
  const deltaY = screenY - startY.value

  // 计算新位置
  let newX = windowX.value + deltaX
  let newY = windowY.value + deltaY

  // 边界检查
  const screenWidth = window.screen.width
  const screenHeight = window.screen.height
  newX = Math.max(0, Math.min(newX, screenWidth - 40))
  newY = Math.max(0, Math.min(newY, screenHeight - 40))

  // 避免微小的抖动
  if (Math.abs(newX - lastX.value) < 2 && Math.abs(newY - lastY.value) < 2) {
    return
  }

  // 更新窗口位置
  window.electronAPI.updateWindowPosition({
    x: Math.round(newX),
    y: Math.round(newY)
  })

  // 更新上次位置
  lastX.value = newX
  lastY.value = newY
}

/**
 * 结束拖拽
 */
const stopDragging = () => {
  if (!isDragging.value) return
  isDragging.value = false

  // 取消待处理的动画帧
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
    animationFrameId.value = null
  }

  // 更新窗口位置作为下一次拖拽的基准
  windowX.value = lastX.value
  windowY.value = lastY.value
}

/**
 * 鼠标释放 - 处理点击
 */
const handleMouseUp = (e) => {
  // 只处理左键点击
  if (e.button !== 0) return

  const mouseUpTime = Date.now()
  const clickDuration = mouseUpTime - mouseDownTime.value
  isMouseDown.value = false

  // 判断是否为有效的点击操作
  const isValidClick = !hasDragged.value &&
                       clickDuration < 300 &&
                       clickDuration > 50

  if (isValidClick) {
    e.stopPropagation()
    window.electronAPI.toggleMainWindow()
  }

  // 重置拖拽标记
  hasDragged.value = false
}

/**
 * 处理 document 点击事件 - 防止拖拽结束时触发点击
 */
const handleDocumentClick = (e) => {
  if (hasDragged.value) {
    e.preventDefault()
    e.stopPropagation()
    hasDragged.value = false
  }
}

// 生命周期钩子
onMounted(() => {
  // 初始化获取窗口位置
  getWindowPosition()
  // 添加全局鼠标移动和释放监听
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopDragging)
  document.addEventListener('mouseleave', stopDragging)
  document.addEventListener('click', handleDocumentClick, true)
})

onBeforeUnmount(() => {
  // 清理事件监听
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopDragging)
  document.removeEventListener('mouseleave', stopDragging)
  document.removeEventListener('click', handleDocumentClick, true)
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  overflow: hidden;
}

.floating-ball {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  cursor: move;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: box-shadow 0.2s;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
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
</style>
