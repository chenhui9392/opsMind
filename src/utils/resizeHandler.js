/**
 * 创建宽度调整处理器
 * @param {Object} options - 配置选项
 * @param {Ref|Object} options.widthRef - 宽度响应式数据引用
 * @param {Ref|Object} options.resizingRef - 调整状态响应式数据引用
 * @param {number} options.minWidth - 最小宽度，默认200
 * @param {number} options.maxWidth - 最大宽度，默认500
 * @returns {Object} 调整宽度相关方法
 */
export function createResizeHandler(options) {
  const { widthRef, resizingRef, minWidth = 200, maxWidth = 500 } = options

  /**
   * 开始调整宽度
   * @param {Event} event - 鼠标事件
   * @param {Function} onResizing - 调整中的回调
   * @param {Function} onStop - 停止调整的回调
   */
  function startResizing(event, onResizing, onStop) {
    resizingRef.value = true
    const handleMouseMove = (e) => onResizing(e)
    const handleMouseUp = () => {
      onStop()
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  /**
   * 计算新宽度
   * @param {number} clientX - 鼠标X坐标
   * @param {DOMRect} containerRect - 容器矩形区域
   * @returns {number} 计算后的宽度
   */
  function calculateWidth(clientX, containerRect) {
    const newWidth = clientX - containerRect.left
    return Math.max(minWidth, Math.min(maxWidth, newWidth))
  }

  return {
    startResizing,
    calculateWidth
  }
}

/**
 * 传统的调整宽度方法（适用于 Options API）
 * @param {Object} componentInstance - Vue 组件实例
 * @param {Object} config - 配置
 * @returns {Object} 方法集合
 */
export function createResizeMethods(componentInstance, config = {}) {
  const minWidth = config.minWidth || 200
  const maxWidth = config.maxWidth || 500
  const widthKey = config.widthKey || 'contactsWidth'
  const resizingKey = config.resizingKey || 'isResizing'

  return {
    /**
     * 开始调整宽度
     * @param {Event} event - 鼠标事件
     */
    startResizing(event) {
      componentInstance[resizingKey] = true
      document.addEventListener('mousemove', this.onResizing)
      document.addEventListener('mouseup', this.stopResizing)
    },

    /**
     * 调整宽度中
     * @param {Event} event - 鼠标事件
     */
    onResizing(event) {
      if (!componentInstance[resizingKey]) return
      const containerRect = this.$el.parentElement.getBoundingClientRect()
      const newWidth = event.clientX - containerRect.left
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        componentInstance[widthKey] = newWidth
      }
    },

    /**
     * 停止调整宽度
     */
    stopResizing() {
      componentInstance[resizingKey] = false
      document.removeEventListener('mousemove', this.onResizing)
      document.removeEventListener('mouseup', this.stopResizing)
    }
  }
}
