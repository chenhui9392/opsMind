const { contextBridge, ipcRenderer } = require('electron')

// 暴露系统信息给渲染进程
contextBridge.exposeInMainWorld('systemInfo', {
  // 获取系统用户名
  getUserName: async () => {
    try {
      const username = await ipcRenderer.invoke('getSystemUsername')
      console.log('Got username from main process:', username)
      return username
    } catch (error) {
      console.error('Error getting username via IPC:', error)
      return 'unknown'
    }
  },
  // 同步获取系统用户名
  getUserNameSync: () => {
    try {
      // 使用同步 IPC 调用
      const username = ipcRenderer.sendSync('getSystemUsernameSync')
      console.log('Got username sync from main process:', username)
      return username
    } catch (error) {
      console.error('Error getting username sync via IPC:', error)
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
      console.log('Download and install result:', result)
      return result
    } catch (error) {
      console.error('Error downloading and installing update:', error)
      return { success: false, message: error.message }
    }
  },
  
  // 打开外部链接（浏览器下载）
  openExternalLink: async (url) => {
    try {
      const result = await ipcRenderer.invoke('openExternalLink', url)
      console.log('Open external link result:', result)
      return result
    } catch (error) {
      console.error('Error opening external link:', error)
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
      console.error('Error getting window position:', error)
      return { x: 0, y: 0 }
    }
  },
  // 更新窗口位置
  updateWindowPosition: (pos) => {
    ipcRenderer.send('updateWindowPosition', pos)
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
  }
})

console.log('preload.js loaded and APIs exposed')

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
})
