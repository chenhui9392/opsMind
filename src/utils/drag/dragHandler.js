/*
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-04-03 16:33:40
 * @LastEditTime: 2026-04-03 16:33:40
 * @LastEditors: hui.chenn
 */
/**
 * 拖拽处理工具函数
 * 用于处理悬浮球等元素的拖拽逻辑
 */

/**
 * 创建拖拽处理器
 * @param {Object} options - 配置选项
 * @param {Function} options.onDragStart - 拖拽开始回调
 * @param {Function} options.onDragMove - 拖拽中回调，接收 (deltaX, deltaY) 参数
 * @param {Function} options.onDragEnd - 拖拽结束回调
 * @param {Function} options.onClick - 点击回调（非拖拽时触发）
 * @param {number} options.dragThreshold - 拖拽阈值（像素），默认 5
 * @param {number} options.clickMaxDuration - 点击最大持续时间（毫秒），默认 300
 * @returns {Object} 拖拽处理器方法
 */
export function createDragHandler(options = {}) {
  const {
    onDragStart,
    onDragMove,
    onDragEnd,
    onClick,
    dragThreshold = 5,
    clickMaxDuration = 300
  } = options

  // 内部状态
  let isDragging = false
  let isMouseDown = false
  let hasDragged = false
  let startX = 0
  let startY = 0
  let lastMouseX = 0
  let lastMouseY = 0
  let mouseDownTime = 0
  let animationFrameId = null

  /**
   * 处理鼠标按下
   * @param {MouseEvent} e - 鼠标事件
   */
  const handleMouseDown = (e) => {
    // 只处理左键
    if (e.button !== 0) return

    isDragging = true
    hasDragged = false
    isMouseDown = true
    mouseDownTime = Date.now()
    startX = e.screenX
    startY = e.screenY
    lastMouseX = e.screenX
    lastMouseY = e.screenY

    // 阻止默认行为
    e.preventDefault()

    // 触发拖拽开始回调
    if (typeof onDragStart === 'function') {
      onDragStart({ x: startX, y: startY })
    }
  }

  /**
   * 处理鼠标移动
   * @param {MouseEvent} e - 鼠标事件
   */
  const handleMouseMove = (e) => {
    if (!isDragging) return

    const screenX = e.screenX
    const screenY = e.screenY

    // 计算从 mousedown 开始的总移动距离
    const totalDeltaX = Math.abs(screenX - startX)
    const totalDeltaY = Math.abs(screenY - startY)

    // 判断是否超过拖拽阈值
    if (totalDeltaX > dragThreshold || totalDeltaY > dragThreshold) {
      hasDragged = true
    }

    // 计算鼠标移动距离
    const mouseDeltaX = screenX - lastMouseX
    const mouseDeltaY = screenY - lastMouseY

    // 只有当鼠标移动超过阈值时才处理
    if (Math.abs(mouseDeltaX) < 2 && Math.abs(mouseDeltaY) < 2) {
      e.preventDefault()
      return
    }

    // 更新鼠标位置
    lastMouseX = screenX
    lastMouseY = screenY

    // 取消之前的动画帧
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }

    // 使用 requestAnimationFrame 进行位置更新
    animationFrameId = requestAnimationFrame(() => {
      if (typeof onDragMove === 'function') {
        onDragMove({
          deltaX: screenX - startX,
          deltaY: screenY - startY,
          screenX,
          screenY
        })
      }
    })

    e.preventDefault()
  }

  /**
   * 停止拖拽
   */
  const stopDragging = () => {
    if (!isDragging) return
    isDragging = false

    // 取消待处理的动画帧
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    // 触发拖拽结束回调
    if (typeof onDragEnd === 'function') {
      onDragEnd({ hasDragged })
    }
  }

  /**
   * 处理鼠标释放
   * @param {MouseEvent} e - 鼠标事件
   */
  const handleMouseUp = (e) => {
    // 只处理左键点击
    if (e.button !== 0) return

    const mouseUpTime = Date.now()
    const clickDuration = mouseUpTime - mouseDownTime
    isMouseDown = false

    // 判断是否为有效的点击操作
    const isValidClick = !hasDragged &&
                         clickDuration < clickMaxDuration &&
                         clickDuration > 50

    if (isValidClick && typeof onClick === 'function') {
      e.stopPropagation()
      onClick({ x: e.screenX, y: e.screenY })
    }

    // 重置拖拽标记
    const didDrag = hasDragged
    hasDragged = false

    // 停止拖拽
    stopDragging()

    return { isValidClick, didDrag }
  }

  /**
   * 处理文档点击（用于阻止拖拽结束时的点击冒泡）
   * @param {MouseEvent} e - 鼠标事件
   */
  const handleDocumentClick = (e) => {
    if (hasDragged) {
      e.preventDefault()
      e.stopPropagation()
      hasDragged = false
      return true
    }
    return false
  }

  /**
   * 获取当前拖拽状态
   */
  const getState = () => ({
    isDragging,
    isMouseDown,
    hasDragged
  })

  /**
   * 清理资源
   */
  const cleanup = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    isDragging = false
    isMouseDown = false
    hasDragged = false
  }

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDocumentClick,
    stopDragging,
    getState,
    cleanup
  }
}

/**
 * 边界限制工具函数
 * @param {number} x - X 坐标
 * @param {number} y - Y 坐标
 * @param {number} width - 元素宽度
 * @param {number} height - 元素高度
 * @param {number} screenWidth - 屏幕宽度
 * @param {number} screenHeight - 屏幕高度
 * @returns {Object} 限制后的坐标 { x, y }
 */
export function clampPosition(x, y, width, height, screenWidth, screenHeight) {
  return {
    x: Math.max(0, Math.min(x, screenWidth - width)),
    y: Math.max(0, Math.min(y, screenHeight - height))
  }
}

/**
 * 计算窗口新位置
 * @param {number} currentX - 当前 X 坐标
 * @param {number} currentY - 当前 Y 坐标
 * @param {number} deltaX - X 方向移动距离
 * @param {number} deltaY - Y 方向移动距离
 * @param {number} windowWidth - 窗口宽度
 * @param {number} windowHeight - 窗口高度
 * @returns {Object} 新位置 { x, y }
 */
export function calculateNewPosition(currentX, currentY, deltaX, deltaY, windowWidth, windowHeight) {
  const screenWidth = window.screen.width
  const screenHeight = window.screen.height

  let newX = currentX + deltaX
  let newY = currentY + deltaY

  return clampPosition(newX, newY, windowWidth, windowHeight, screenWidth, screenHeight)
}

export default {
  createDragHandler,
  clampPosition,
  calculateNewPosition
}
