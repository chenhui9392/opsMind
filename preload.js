const { contextBridge, ipcRenderer } = require('electron')

// 暴露应用环境信息给渲染进程
contextBridge.exposeInMainWorld('appEnvInfo', {
  // 获取应用环境模式
  getEnvMode: async () => {
    try {
      const mode = await ipcRenderer.invoke('getAppEnvMode')
      return mode
    } catch (error) {
      return 'production'
    }
  },
  // 同步获取应用环境模式
  getEnvModeSync: () => {
    try {
      const mode = ipcRenderer.sendSync('getAppEnvModeSync')
      return mode
    } catch (error) {
      return 'production'
    }
  },
  // 获取应用名称
  getAppName: async () => {
    try {
      const name = await ipcRenderer.invoke('getAppName')
      return name
    } catch (error) {
      return '海豚'
    }
  },
  // 同步获取应用名称
  getAppNameSync: () => {
    try {
      const name = ipcRenderer.sendSync('getAppNameSync')
      return name
    } catch (error) {
      return '海豚'
    }
  }
})

// 暴露系统信息给渲染进程
contextBridge.exposeInMainWorld('systemInfo', {
  // 获取系统用户名
  getUserName: async () => {
    try {
      const username = await ipcRenderer.invoke('getSystemUsername')
      return username
    } catch (error) {
      return 'unknown'
    }
  },
  // 同步获取系统用户名
  getUserNameSync: () => {
    try {
      // 使用同步 IPC 调用
      const username = ipcRenderer.sendSync('getSystemUsernameSync')
      return username
    } catch (error) {
      return 'unknown'
    }
  }
})

// 暴露应用更新接口给渲染进程
contextBridge.exposeInMainWorld('appUpdater', {
  // 下载并安装更新
  downloadAndInstall: async (downloadUrl, fileName) => {
    try {
      const result = await ipcRenderer.invoke('downloadAndInstallUpdate', downloadUrl, fileName)
      return result
    } catch (error) {
      return { success: false, message: error.message }
    }
  },
  
  // 打开外部链接（浏览器下载）
  openExternalLink: async (url) => {
    try {
      const result = await ipcRenderer.invoke('openExternalLink', url)
      return result
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
})

// 暴露悬浮球相关接口给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取窗口位置
  getWindowPosition: async () => {
    try {
      const pos = await ipcRenderer.invoke('getWindowPosition')
      return pos
    } catch (error) {
      return { x: 0, y: 0 }
    }
  },
  // 更新窗口位置
  updateWindowPosition: (pos) => {
    ipcRenderer.send('updateWindowPosition', pos)
  },
  // 获取所有显示器信息（用于多屏幕拖拽）
  getAllDisplays: async () => {
    try {
      const displays = await ipcRenderer.invoke('getAllDisplays')
      return displays
    } catch (error) {
      return []
    }
  },
  // 切换主窗口显示/隐藏
  toggleMainWindow: () => {
    ipcRenderer.send('toggleMainWindow')
  },
  // 监听未读消息通知（悬浮球窗口使用）
  onUnreadMessage: (callback) => {
    ipcRenderer.on('unread-message', (event, data) => {
      callback(data)
    })
  },
  // 移除未读消息监听（悬浮球窗口使用）
  offUnreadMessage: (callback) => {
    ipcRenderer.removeListener('unread-message', callback)
  },
  // 监听主窗口显示事件（悬浮球窗口使用）
  onMainWindowShown: (callback) => {
    ipcRenderer.on('main-window-shown', (event, data) => {
      callback(data)
    })
  },
  // 移除主窗口显示监听（悬浮球窗口使用）
  offMainWindowShown: (callback) => {
    ipcRenderer.removeListener('main-window-shown', callback)
  },
  // 监听未读消息计数同步（悬浮球窗口使用）
  onSyncUnreadCount: (callback) => {
    ipcRenderer.on('sync-unread-count', (event, data) => {
      callback(data)
    })
  },
  // 移除未读消息计数同步监听（悬浮球窗口使用）
  offSyncUnreadCount: (callback) => {
    ipcRenderer.removeListener('sync-unread-count', callback)
  }
})

// 暴露主窗口通知接口给渲染进程（主窗口使用）
contextBridge.exposeInMainWorld('mainWindowAPI', {
  // 发送未读消息通知到悬浮球
  notifyUnreadMessage: (data) => {
    ipcRenderer.send('notify-unread-message', data)
  },
  // 通知悬浮球主窗口已显示
  notifyMainWindowShown: () => {
    ipcRenderer.send('main-window-shown')
  },
  // 同步未读消息计数到悬浮球（点击消息时调用）
  syncUnreadCount: (count) => {
    ipcRenderer.send('sync-unread-count', { count })
  },
  // 同步未读消息总数到悬浮球（初始加载时调用）
  syncTotalUnreadCount: (count) => {
    ipcRenderer.send('sync-total-unread-count', { count })
  }
})

// 暴露定时任务控制接口给渲染进程
contextBridge.exposeInMainWorld('scheduledTaskAPI', {
  /**
   * 启动定时任务
   * @param {number} intervalHours - 执行间隔（小时）
   * @returns {Promise<Object>} - { success: boolean, message: string }
   */
  start: async (intervalHours) => {
    try {
      const result = await ipcRenderer.invoke('startScheduledTask', intervalHours)
      console.log('[ScheduledTask API] 启动结果:', result)
      return result
    } catch (error) {
      console.error('[ScheduledTask API] 启动异常:', error)
      return { success: false, message: error.message }
    }
  },

  /**
   * 停止定时任务
   * @returns {Promise<Object>} - { success: boolean, message: string }
   */
  stop: async () => {
    try {
      const result = await ipcRenderer.invoke('stopScheduledTask')
      console.log('[ScheduledTask API] 停止结果:', result)
      return result
    } catch (error) {
      console.error('[ScheduledTask API] 停止异常:', error)
      return { success: false, message: error.message }
    }
  },

  /**
   * 立即执行一次定时任务
   * @returns {Promise<Object>} - { success: boolean, message: string }
   */
  executeNow: async () => {
    try {
      const result = await ipcRenderer.invoke('executeScheduledTaskNow')
      console.log('[ScheduledTask API] 立即执行结果:', result)
      return result
    } catch (error) {
      console.error('[ScheduledTask API] 立即执行异常:', error)
      return { success: false, message: error.message }
    }
  },

  /**
   * 监听定时任务执行结果（主进程推送）
   * @param {Function} callback - 回调函数 (data) => void
   */
  onScheduledTaskResult: (callback) => {
    ipcRenderer.on('scheduled-task-result', (event, data) => {
      callback(data)
    })
  },

  /**
   * 移除定时任务执行结果监听
   * @param {Function} callback - 回调函数
   */
  offScheduledTaskResult: (callback) => {
    ipcRenderer.removeListener('scheduled-task-result', callback)
  }
})

// 暴露 PowerShell 执行接口给渲染进程（安全执行）
contextBridge.exposeInMainWorld('powerShellAPI', {
  /**
   * 执行白名单中的 PowerShell 命令
   * @param {string} actionKey - 命令标识（如 'run-client'）
   * @param {Object} options - 执行选项（如超时 timeout）
   * @returns {Promise<Object>} - { success: boolean, data: string, error: string }
   */
  execute: async (actionKey, options = {}) => {
    try {
      const result = await ipcRenderer.invoke('executePowerShell', actionKey, options)
      console.log(`[PowerShell API] 执行结果:`, result)
      return result
    } catch (error) {
      console.error(`[PowerShell API] 执行异常:`, error)
      return {
        success: false,
        data: '',
        error: error.message
      }
    }
  },

  /**
   * 解析聊天返回的 JSON 并执行对应命令
   * @param {Object} jsonData - 聊天接口返回的 JSON { action/command: string }
   * @returns {Promise<Object>} - { success: boolean, data: string, error: string }
   */
  parseAndExecute: async (jsonData) => {
    try {
      const result = await ipcRenderer.invoke('parseAndExecutePowerShell', jsonData)
      console.log(`[PowerShell API] 解析执行结果:`, result)
      return result
    } catch (error) {
      console.error(`[PowerShell API] 解析执行异常:`, error)
      return {
        success: false,
        data: '',
        error: error.message
      }
    }
  },

  /**
   * 流式执行 PowerShell 命令（支持进度回调）
   * @param {string} actionKey - 命令标识
   * @param {Object} options - 执行选项
   * @param {Function} onProgress - 进度回调 (progress) => void
   * @param {Function} onComplete - 完成回调 (result) => void
   */
  executeStream: (actionKey, options = {}, onProgress, onComplete) => {
    // 监听进度事件
    const progressListener = (event, data) => {
      if (data.actionKey === actionKey && onProgress) {
        onProgress(data)
      }
    }
    ipcRenderer.on('powershell-progress', progressListener)

    // 监听完成事件
    const completeListener = (event, result) => {
      if (result.actionKey === actionKey) {
        // 清理监听器
        ipcRenderer.removeListener('powershell-progress', progressListener)
        ipcRenderer.removeListener('powershell-complete', completeListener)

        if (onComplete) {
          onComplete(result)
        }
      }
    }
    ipcRenderer.on('powershell-complete', completeListener)

    // 发送执行请求
    ipcRenderer.send('executePowerShellStream', actionKey, options)
  }
})

// 暴露开发者工具控制接口给渲染进程
contextBridge.exposeInMainWorld('devToolsAPI', {
  toggleDevTools: () => {
    ipcRenderer.send('toggleDevTools')
  }
})

// 暴露截图接口给渲染进程
contextBridge.exposeInMainWorld('screenshotAPI', {
  /**
   * 启动截图流程
   * @returns {Promise<Object>} - { success: boolean, message?: string }
   */
  start: async () => {
    try {
      const result = await ipcRenderer.invoke('startScreenshot')
      return result
    } catch (error) {
      return { success: false, message: error.message }
    }
  },

  /**
   * 监听截图结果
   * @param {Function} callback - 回调函数 (data) => void，data: { success, dataUrl?, cancelled? }
   */
  onScreenshotResult: (callback) => {
    ipcRenderer.on('screenshot-result', (event, data) => {
      callback(data)
    })
  },

  /**
   * 移除截图结果监听
   * @param {Function} callback - 回调函数
   */
  offScreenshotResult: (callback) => {
    ipcRenderer.removeListener('screenshot-result', callback)
  }
})

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
})
