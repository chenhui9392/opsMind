<!--
 * @Author: hui.chenn
 * @Description:
 * @Date: 2026-03-31 09:50:34
 * @LastEditTime: 2026-03-31 09:50:41
 * @LastEditors: hui.chenn
-->
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

<script>
export default {
  name: 'floatingBall',
  data() {
    return {
      isDragging: false,
      isMouseDown: false,
      hasDragged: false,
      startX: 0,
      startY: 0,
      windowX: 0,
      windowY: 0,
      lastX: 0,
      lastY: 0,
      lastMouseX: 0,
      lastMouseY: 0,
      mouseDownTime: 0,
      animationFrameId: null,
      DRAG_THRESHOLD: 5
    }
  },
  mounted() {
    // 初始化获取窗口位置
    this.getWindowPosition()
    // 添加全局鼠标移动和释放监听
    document.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('mouseup', this.stopDragging)
    document.addEventListener('mouseleave', this.stopDragging)
    document.addEventListener('click', this.handleDocumentClick, true)
  },
  beforeUnmount() {
    // 清理事件监听
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.stopDragging)
    document.removeEventListener('mouseleave', this.stopDragging)
    document.removeEventListener('click', this.handleDocumentClick, true)
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
  },
  methods: {
    /**
     * 获取窗口位置
     */
    async getWindowPosition() {
      try {
        const pos = await window.electronAPI.getWindowPosition()
        this.windowX = pos.x
        this.windowY = pos.y
        this.lastX = pos.x
        this.lastY = pos.y
      } catch (error) {
        console.error('Error getting window position:', error)
      }
    },
    /**
     * 鼠标按下 - 开始拖拽
     */
    handleMouseDown(e) {
      // 只处理左键
      if (e.button !== 0) return

      this.isDragging = true
      this.hasDragged = false
      this.isMouseDown = true
      this.mouseDownTime = Date.now()
      this.startX = e.screenX
      this.startY = e.screenY
      this.lastMouseX = e.screenX
      this.lastMouseY = e.screenY

      // 阻止默认行为
      e.preventDefault()
    },
    /**
     * 鼠标移动 - 拖拽中
     */
    handleMouseMove(e) {
      if (!this.isDragging) return

      const screenX = e.screenX
      const screenY = e.screenY

      // 计算从mousedown开始的总移动距离
      const totalDeltaX = Math.abs(screenX - this.startX)
      const totalDeltaY = Math.abs(screenY - this.startY)

      // 判断是否超过拖拽阈值
      if (totalDeltaX > this.DRAG_THRESHOLD || totalDeltaY > this.DRAG_THRESHOLD) {
        this.hasDragged = true
      }

      // 计算鼠标移动距离
      const mouseDeltaX = screenX - this.lastMouseX
      const mouseDeltaY = screenY - this.lastMouseY

      // 只有当鼠标移动超过阈值时才处理
      if (Math.abs(mouseDeltaX) < 2 && Math.abs(mouseDeltaY) < 2) {
        e.preventDefault()
        return
      }

      // 更新鼠标位置
      this.lastMouseX = screenX
      this.lastMouseY = screenY

      // 取消之前的动画帧
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
      }

      // 使用 requestAnimationFrame 进行位置更新
      this.animationFrameId = requestAnimationFrame(() => {
        this.updatePosition(screenX, screenY)
      })

      e.preventDefault()
    },
    /**
     * 更新位置
     */
    updatePosition(screenX, screenY) {
      if (!this.isDragging) return

      const deltaX = screenX - this.startX
      const deltaY = screenY - this.startY

      // 计算新位置
      let newX = this.windowX + deltaX
      let newY = this.windowY + deltaY

      // 边界检查
      const screenWidth = window.screen.width
      const screenHeight = window.screen.height
      newX = Math.max(0, Math.min(newX, screenWidth - 40))
      newY = Math.max(0, Math.min(newY, screenHeight - 40))

      // 避免微小的抖动
      if (Math.abs(newX - this.lastX) < 2 && Math.abs(newY - this.lastY) < 2) {
        return
      }

      // 更新窗口位置
      window.electronAPI.updateWindowPosition({
        x: Math.round(newX),
        y: Math.round(newY)
      })

      // 更新上次位置
      this.lastX = newX
      this.lastY = newY
    },
    /**
     * 结束拖拽
     */
    stopDragging() {
      if (!this.isDragging) return
      this.isDragging = false

      // 取消待处理的动画帧
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = null
      }

      // 更新窗口位置作为下一次拖拽的基准
      this.windowX = this.lastX
      this.windowY = this.lastY
    },
    /**
     * 鼠标释放 - 处理点击
     */
    handleMouseUp(e) {
      // 只处理左键点击
      if (e.button !== 0) return

      const mouseUpTime = Date.now()
      const clickDuration = mouseUpTime - this.mouseDownTime
      this.isMouseDown = false

      // 判断是否为有效的点击操作
      const isValidClick = !this.hasDragged &&
                           clickDuration < 300 &&
                           clickDuration > 50

      if (isValidClick) {
        e.stopPropagation()
        window.electronAPI.toggleMainWindow()
      }

      // 重置拖拽标记
      this.hasDragged = false
    },
    /**
     * 处理 document 点击事件 - 防止拖拽结束时触发点击
     */
    handleDocumentClick(e) {
      if (this.hasDragged) {
        e.preventDefault()
        e.stopPropagation()
        this.hasDragged = false
      }
    }
  }
}
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
