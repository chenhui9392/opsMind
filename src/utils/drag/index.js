/*
 * @Author: hui.chenn
 * @Description: 拖拽功能模块统一入口
 * @Date: 2026-04-03 17:20:00
 * @LastEditTime: 2026-04-03 17:20:00
 * @LastEditors: hui.chenn
 */

/**
 * 拖拽功能模块
 * 提供通用的拖拽功能和悬浮球专用拖拽功能
 */

// 导入通用拖拽处理器
export {
  createDragHandler,
  clampPosition,
  calculateNewPosition
} from './dragHandler.js'

// 导入悬浮球专用拖拽功能
export {
  createFloatingBallDrag,
  initFloatingBallDrag,
  DEFAULT_CONFIG as FLOATING_BALL_DEFAULT_CONFIG
} from './floatingBallDrag.js'

// 默认导出悬浮球拖拽功能（保持向后兼容）
export { createFloatingBallDrag as default } from './floatingBallDrag.js'
