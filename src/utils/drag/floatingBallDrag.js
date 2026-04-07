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
  moveThrottle: 2,
  edgeSnapThreshold: 30  // 贴边触发阈值（像素）
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
    lastY: 0,
    snappedEdge: null,  // 当前贴边状态: 'left', 'right', 或 null
    displays: []  // 缓存的显示器信息
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
   * @returns {Object} { isDragging, hasDragged, snappedEdge }
   */
  const getDragState = () => ({
    isDragging: state.isDragging,
    hasDragged: state.hasDragged,
    snappedEdge: state.snappedEdge
  })

  /**
   * 异步初始化显示器信息
   * @returns {Promise<void>}
   */
  const initDisplays = async () => {
    try {
      if (window.electronAPI && window.electronAPI.getAllDisplays) {
        const displays = await window.electronAPI.getAllDisplays()
        if (displays && displays.length > 0) {
          state.displays = displays
          console.log('[FloatingBallDrag] 显示器信息已更新:', displays.length, '个显示器')
        }
      }
    } catch (error) {
      console.error('[FloatingBallDrag] 获取显示器信息失败:', error)
    }
  }

  /**
   * 获取当前鼠标所在的显示器信息
   * @param {number} mouseX - 鼠标 X 坐标
   * @param {number} mouseY - 鼠标 Y 坐标
   * @returns {Object} 显示器信息 { x, y, width, height }
   */
  const getCurrentDisplay = (mouseX, mouseY) => {
    // 使用缓存的显示器信息
    const displays = state.displays
    if (displays && displays.length > 0) {
      // 查找鼠标所在的显示器
      for (const display of displays) {
        const { x, y, width, height } = display.workArea || display.bounds
        if (
          mouseX >= x &&
          mouseX < x + width &&
          mouseY >= y &&
          mouseY < y + height
        ) {
          return { x, y, width, height }
        }
      }
      // 如果没找到，返回主显示器
      return {
        x: displays[0].workArea?.x || 0,
        y: displays[0].workArea?.y || 0,
        width: displays[0].workArea?.width || displays[0].bounds?.width || window.screen.width,
        height: displays[0].workArea?.height || displays[0].bounds?.height || window.screen.height
      }
    }

    // 降级方案：使用浏览器 API（单显示器）
    return {
      x: window.screenLeft || window.screenX,
      y: window.screenTop || window.screenY,
      width: window.screen.width,
      height: window.screen.height
    }
  }

  /**
   * 边界限制（带贴边吸附，支持多显示器）
   * @param {number} x - X 坐标
   * @param {number} y - Y 坐标
   * @param {number} mouseX - 鼠标 X 坐标（用于判断所在显示器）
   * @param {number} mouseY - 鼠标 Y 坐标（用于判断所在显示器）
   * @returns {Object} { x, y, snapped } 返回坐标和是否贴边
   */
  const clampToScreen = (x, y, mouseX, mouseY) => {
    // 获取当前鼠标所在的显示器
    const display = getCurrentDisplay(mouseX, mouseY)
    const { x: displayX, y: displayY, width: displayWidth, height: displayHeight } = display
    
    const snapped = { left: false, right: false }
    
    let newX = x
    let newY = y
    
    // Y轴边界限制（相对于当前显示器）
    newY = Math.max(displayY, Math.min(y, displayY + displayHeight - options.windowSize))
    
    // 检查是否接近左边缘（相对于当前显示器）
    if (newX <= displayX + options.edgeSnapThreshold) {
      newX = displayX
      snapped.left = true
    }
    // 检查是否接近右边缘（相对于当前显示器）
    else if (newX >= displayX + displayWidth - options.windowSize - options.edgeSnapThreshold) {
      newX = displayX + displayWidth - options.windowSize
      snapped.right = true
    }
    // 正常边界限制（在当前显示器内）
    else {
      newX = Math.max(displayX, Math.min(newX, displayX + displayWidth - options.windowSize))
    }
    
    return { x: newX, y: newY, snapped }
  }

  /**
   * 更新窗口位置（带贴边处理，支持多显示器）
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

    // 边界限制（含贴边处理，传入鼠标位置用于多显示器判断）
    const clamped = clampToScreen(newX, newY, screenX, screenY)
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
    
    // 更新贴边状态
    if (clamped.snapped) {
      state.snappedEdge = clamped.snapped.left ? 'left' : (clamped.snapped.right ? 'right' : null)
    } else {
      state.snappedEdge = null
    }

    // 触发移动回调
    if (typeof onDragMove === 'function') {
      onDragMove(newX, newY, deltaX, deltaY, state.snappedEdge)
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
    state.snappedEdge = null
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

    // 多显示器支持
    initDisplays,

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
