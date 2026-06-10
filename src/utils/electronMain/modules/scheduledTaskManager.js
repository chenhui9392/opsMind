/*
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-05-07 11:20:31
 * @LastEditTime: 2026-05-07 11:20:50
 * @LastEditors: hui.chenn
 */
/**
 * 定时任务管理模块
 * 管理 PowerShell 硬件信息收集命令的定时执行
 */

const { powerMonitor, app } = require('electron')
const powerShellExecutor = require('./powerShellExecutor')
const windowManager = require('./windowManager')

// 常量配置
const DEFAULT_INTERVAL_HOURS = 1 // 默认1小时
const RETRY_DELAY_MS = 5 * 60 * 1000 // 5分钟
const MAX_RETRIES = 3

class ScheduledTaskManager {
  constructor() {
    this.isRunning = false
    this.isExecuting = false
    this.timerId = null
    this.retryCount = 0
    this.isRetrying = false
    this.lastExecuteTime = null
    this.powerMonitorSetup = false
    this.intervalMs = DEFAULT_INTERVAL_HOURS * 60 * 60 * 1000
  }

  /**
   * 设置系统电源监听（休眠/唤醒）
   */
  setupPowerMonitor() {
    if (this.powerMonitorSetup) return

    if (!app.isReady()) {
      // 如果 app 还没 ready，延迟设置
      setTimeout(() => this.setupPowerMonitor(), 1000)
      return
    }

    try {
      powerMonitor.on('resume', () => {
        console.log('[ScheduledTask] 系统从休眠唤醒')
        if (this.isRunning && this.lastExecuteTime) {
          const elapsed = Date.now() - this.lastExecuteTime
          if (elapsed >= this.intervalMs) {
            console.log('[ScheduledTask] 唤醒后已超过执行间隔，立即执行')
            this.executeImmediately()
          }
        }
      })
      this.powerMonitorSetup = true
      console.log('[ScheduledTask] 电源监听已注册')
    } catch (error) {
      console.error('[ScheduledTask] 设置电源监听失败:', error)
    }
  }

  /**
   * 启动定时任务
   * 立即执行一次，然后按间隔周期执行
   * @param {number} intervalHours - 执行间隔（小时），默认1小时
   */
  start(intervalHours) {
    if (this.isRunning) {
      console.log('[ScheduledTask] 定时任务已在运行，跳过重复启动')
      return
    }

    // 解析并设置执行间隔
    const hours = parseFloat(intervalHours)
    this.intervalMs = (!isNaN(hours) && hours > 0 ? hours : DEFAULT_INTERVAL_HOURS) * 60 * 60 * 1000
    console.log(`[ScheduledTask] 启动定时任务，执行间隔: ${this.intervalMs / 1000}秒`)
    this.isRunning = true
    this.retryCount = 0
    this.isRetrying = false

    // 设置电源监听
    this.setupPowerMonitor()

    // 立即执行第一次
    this.executeTask()
  }

  /**
   * 停止定时任务
   */
  stop() {
    console.log('[ScheduledTask] 停止定时任务')
    this.isRunning = false
    this.retryCount = 0
    this.isRetrying = false
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  /**
   * 重启定时任务
   */
  restart() {
    console.log('[ScheduledTask] 重启定时任务')
    this.stop()
    this.start()
  }

  /**
   * 立即执行一次任务
   * 不影响正常的定时节奏
   */
  executeImmediately() {
    console.log('[ScheduledTask] 立即执行一次任务')
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
    this.executeTask()
  }

  /**
   * 通知渲染进程执行结果
   * @param {Object} data - 执行结果数据
   */
  notifyRenderProcess(data) {
    try {
      const mainWindow = windowManager.getMainWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('scheduled-task-result', data)
      }
    } catch (error) {
      console.error('[ScheduledTask] 通知渲染进程失败:', error)
    }
  }

  /**
   * 执行任务的核心逻辑
   */
  async executeTask() {
    if (!this.isRunning) {
      console.log('[ScheduledTask] 任务已停止，取消执行')
      return
    }

    if (this.isExecuting) {
      console.log('[ScheduledTask] 任务正在执行中，跳过本次执行')
      return
    }

    this.isExecuting = true
    console.log(`[ScheduledTask] 执行 PowerShell 命令 (run-client), 当前重试次数: ${this.retryCount}`)
    this.lastExecuteTime = Date.now()

    // 调试：检查 powerShellExecutor 可用性
    console.log('[ScheduledTask] powerShellExecutor 是否存在:', !!powerShellExecutor)
    console.log('[ScheduledTask] executePowerShell 类型:', typeof powerShellExecutor?.executePowerShell)

    try {
      if (!powerShellExecutor || typeof powerShellExecutor.executePowerShell !== 'function') {
        throw new Error('powerShellExecutor.executePowerShell 不可用')
      }

      console.log('[ScheduledTask] 即将调用 powerShellExecutor.executePowerShell("run-client")')
      const result = await powerShellExecutor.executePowerShell('run-client', { timeout: 120000 })
      console.log('[ScheduledTask] powerShellExecutor.executePowerShell 已返回:', result)

      if (result.success) {
        console.log('[ScheduledTask] 命令执行成功')
        this.notifyRenderProcess({
          type: 'success',
          actionKey: 'run-client',
          data: result.data,
          error: result.error,
          timestamp: new Date().toLocaleString('zh-CN')
        })
        this.retryCount = 0
        this.isRetrying = false
        this.scheduleNext()
      } else {
        console.error('[ScheduledTask] 命令执行失败:', result.error)
        this.notifyRenderProcess({
          type: 'failure',
          actionKey: 'run-client',
          error: result.error,
          timestamp: new Date().toLocaleString('zh-CN')
        })
        this.handleFailure()
      }
    } catch (error) {
      console.error('[ScheduledTask] 执行异常:', error)
      this.notifyRenderProcess({
        type: 'exception',
        actionKey: 'run-client',
        error: error.message,
        timestamp: new Date().toLocaleString('zh-CN')
      })
      this.handleFailure()
    } finally {
      this.isExecuting = false
    }
  }

  /**
   * 处理执行失败
   */
  handleFailure() {
    if (!this.isRunning) return

    if (this.retryCount < MAX_RETRIES) {
      this.retryCount++
      this.isRetrying = true
      console.log(`[ScheduledTask] ${RETRY_DELAY_MS / 1000}秒后进行第 ${this.retryCount} 次重试`)
      this.timerId = setTimeout(() => {
        this.executeTask()
      }, RETRY_DELAY_MS)
    } else {
      console.error(`[ScheduledTask] 已达到最大重试次数(${MAX_RETRIES})，等待下一个正常周期`)
      this.retryCount = 0
      this.isRetrying = false
      this.scheduleNext()
    }
  }

  /**
   * 安排下次执行
   */
  scheduleNext() {
    if (!this.isRunning) return

    console.log(`[ScheduledTask] 安排下次执行: ${this.intervalMs / 1000}秒后`)
    this.timerId = setTimeout(() => {
      this.executeTask()
    }, this.intervalMs)
  }
}

module.exports = new ScheduledTaskManager()
