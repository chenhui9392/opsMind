/*
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-04-03 17:03:03
 * @LastEditTime: 2026-04-03 17:03:20
 * @LastEditors: hui.chenn
 */
/**
 * 悬浮球拖拽处理模块
 * 封装悬浮球所有拖拽相关功能，对外暴露简洁的回调接口
 */

// 默认配置
export const DEFAULT_CONFIG = {
  windowSize: 40,
  dragThreshold: 5,
  clickMaxDuration: 300,
  minClickDuration: 50,
  moveThrottle: 2
}

/**
 * 创建悬浮球拖拽控制器
 * @param {Object} callbacks - 回调函数集合
 * @param {Function} callbacks.onDragStart - 拖拽开始回调 (x, y) => {}
 * @param {Function} callbacks.onDragMove - 拖拽中回调 (x, y, deltaX, deltaY) => {}
 * @param {Function} callbacks.onDragEnd - 拖拽结束回调 (x, y, hasDragged) => {}
 * @param {Function} callbacks.onClick - 点击回调 (x, y) => {}
 * @param {Object} config - 配置选项
 * @returns {Object} 拖拽控制器
 */
export function createFloatingBallDrag(callbacks = {}, config = {}) {
  const { onDragStart, onDragMove, onDragEnd, onClick } = callbacks
  const options = { ...DEFAULT_CONFIG, ...config }

  // 内部状态（私有）
  const state = {
    isDragging: false,
    isMouseDown: false,
    hasDragged: false,
    startX: 0,
    startY: 0,
    lastMouseX: 0,
    lastMouseY: 0,
    mouseDownTime: 0,
    animationFrameId: null,
    windowX: 0,
    windowY: 0,
    lastX: 0,
    lastY: 0
  }

  /**
   * 设置窗口初始位置
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   */
  const setPosition = (x, y) => {
    state.windowX = x
    state.windowY = y
    state.lastX = x
    state.lastY = y
  }

  /**
   * 获取当前位置
   * @returns {Object} { x, y }
   */
  const getPosition = () => ({
    x: state.lastX,
    y: state.lastY
  })

  /**
   * 获取拖拽状态
   * @returns {Object} { isDragging, hasDragged }
   */
  const getDragState = () => ({
    isDragging: state.isDragging,
    hasDragged: state.hasDragged
  })

  /**
   * 边界限制
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @returns {Object} { x, y }
   */
  const clampToScreen = (x, y) => {
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height
    return {
      x: Math.max(0, Math.min(x, screenWidth - options.windowSize)),
      y: Math.max(0, Math.min(y, screenHeight - options.windowSize))
    }
  }

  /**
   * 更新窗口位置
   * @param {number} screenX - 当前鼠标 X
   * @param {number} screenY - 当前鼠标 Y
   */
  const updatePosition = (screenX, screenY) => {
    if (!state.isDragging) return

    const deltaX = screenX - state.startX
    const deltaY = screenY - state.startY

    // 计算新位置
    let newX = state.windowX + deltaX
    let newY = state.windowY + deltaY

    // 边界限制
    const clamped = clampToScreen(newX, newY)
    newX = clamped.x
    newY = clamped.y

    // 防抖处理：避免微小的抖动
    if (Math.abs(newX - state.lastX) < options.moveThrottle &&
        Math.abs(newY - state.lastY) < options.moveThrottle) {
      return
    }

    // 更新位置记录
    state.lastX = newX
    state.lastY = newY

    // 触发移动回调
    if (typeof onDragMove === 'function') {
      onDragMove(newX, newY, deltaX, deltaY)
    }
  }

  /**
   * 处理鼠标按下 - 开始拖拽
   * @param {MouseEvent} e - 鼠标事件
   */
  const handleMouseDown = (e) => {
    // 只处理左键
    if (e.button !== 0) return

    state.isDragging = true
    state.hasDragged = false
    state.isMouseDown = true
    state.mouseDownTime = Date.now()
    state.startX = e.screenX
    state.startY = e.screenY
    state.lastMouseX = e.screenX
    state.lastMouseY = e.screenY

    // 阻止默认行为
    e.preventDefault()

    // 触发开始回调
    if (typeof onDragStart === 'function') {
      onDragStart(state.startX, state.startY)
    }
  }

  /**
   * 处理鼠标移动 - 拖拽中
   * @param {MouseEvent} e - 鼠标事件
   */
  const handleMouseMove = (e) => {
    if (!state.isDragging) return

    const screenX = e.screenX
    const screenY = e.screenY

    // 计算从 mousedown 开始的总移动距离
    const totalDeltaX = Math.abs(screenX - state.startX)
    const totalDeltaY = Math.abs(screenY - state.startY)

    // 判断是否超过拖拽阈值
    if (totalDeltaX > options.dragThreshold || totalDeltaY > options.dragThreshold) {
      state.hasDragged = true
    }

    // 计算鼠标移动距离
    const mouseDeltaX = screenX - state.lastMouseX
    const mouseDeltaY = screenY - state.lastMouseY

    // 只有当鼠标移动超过阈值时才处理
    if (Math.abs(mouseDeltaX) < 2 && Math.abs(mouseDeltaY) < 2) {
      e.preventDefault()
      return
    }

    // 更新鼠标位置
    state.lastMouseX = screenX
    state.lastMouseY = screenY

    // 取消之前的动画帧
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId)
    }

    // 使用 requestAnimationFrame 进行位置更新
    state.animationFrameId = requestAnimationFrame(() => {
      updatePosition(screenX, screenY)
    })

    e.preventDefault()
  }

  /**
   * 停止拖拽
   */
  const stopDragging = () => {
    if (!state.isDragging) return

    // 取消待处理的动画帧
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId)
      state.animationFrameId = null
    }

    // 更新窗口位置作为下一次拖拽的基准
    state.windowX = state.lastX
    state.windowY = state.lastY
    state.isDragging = false

    // 触发结束回调
    if (typeof onDragEnd === 'function') {
      onDragEnd(state.lastX, state.lastY, state.hasDragged)
    }
  }

  /**
   * 处理鼠标释放
   * @param {MouseEvent} e - 鼠标事件
   */
  const handleMouseUp = (e) => {
    // 只处理左键
    if (e.button !== 0) return

    const mouseUpTime = Date.now()
    const clickDuration = mouseUpTime - state.mouseDownTime
    state.isMouseDown = false

    // 判断是否为有效的点击操作（非拖拽且时间符合要求）
    const isValidClick = !state.hasDragged &&
                         clickDuration < options.clickMaxDuration &&
                         clickDuration > options.minClickDuration

    if (isValidClick && typeof onClick === 'function') {
      e.stopPropagation()
      onClick(e.screenX, e.screenY)
    }

    // 停止拖拽
    stopDragging()

    // 重置拖拽标记
    state.hasDragged = false
  }

  /**
   * 处理文档点击（阻止拖拽结束时的点击冒泡）
   * @param {MouseEvent} e - 鼠标事件
   * @returns {boolean} 是否阻止了事件
   */
  const handleDocumentClick = (e) => {
    if (state.hasDragged) {
      e.preventDefault()
      e.stopPropagation()
      state.hasDragged = false
      return true
    }
    return false
  }

  /**
   * 清理资源
   */
  const destroy = () => {
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId)
      state.animationFrameId = null
    }
    state.isDragging = false
    state.isMouseDown = false
    state.hasDragged = false
  }

  // 返回公共接口
  return {
    // 核心方法
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDocumentClick,
    stopDragging,

    // 状态管理
    setPosition,
    getPosition,
    getDragState,

    // 工具方法
    clampToScreen,

    // 清理
    destroy
  }
}

/**
 * 快速初始化悬浮球拖拽（简化版）
 * @param {Object} options - 配置选项
 * @param {Function} options.onPositionChange - 位置变化回调 (x, y) => {}
 * @param {Function} options.onClick - 点击回调 () => {}
 * @param {number} options.initialX - 初始 X 坐标
 * @param {number} options.initialY - 初始 Y 坐标
 * @returns {Object} 拖拽控制器
 */
export function initFloatingBallDrag(options = {}) {
  const {
    onPositionChange,
    onClick,
    initialX = 0,
    initialY = 0
  } = options

  const controller = createFloatingBallDrag({
    onDragMove: (x, y) => {
      if (typeof onPositionChange === 'function') {
        onPositionChange(x, y)
      }
    },
    onClick: () => {
      if (typeof onClick === 'function') {
        onClick()
      }
    }
  })

  controller.setPosition(initialX, initialY)

  return controller
}

export default {
  createFloatingBallDrag,
  initFloatingBallDrag,
  DEFAULT_CONFIG
}
