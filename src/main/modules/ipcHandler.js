const { ipcMain } = require('electron')
const os = require('os')
const floatingBallManager = require('./floatingBallManager')
const windowManager = require('./windowManager')

class IpcHandler {
  constructor() {
    this.setupHandlers()
  }

  /**
   * 设置所有IPC处理器
   */
  setupHandlers() {
    // 处理渲染进程的请求
    ipcMain.handle('getSystemUsername', () => {
      return this.getSystemUsername()
    })

    // 处理同步请求
    ipcMain.on('getSystemUsernameSync', (event) => {
      event.returnValue = this.getSystemUsername()
    })

    // 处理悬浮球相关IPC事件
    ipcMain.handle('getWindowPosition', (event) => {
      return floatingBallManager.getWindowPosition()
    })

    ipcMain.on('updateWindowPosition', (event, pos) => {
      floatingBallManager.updateWindowPosition(pos)
    })

    ipcMain.on('toggleMainWindow', () => {
      this.toggleMainWindow()
    })
  }

  /**
   * 获取系统用户名
   * @returns {string} - 系统用户名
   */
  getSystemUsername() {
    try {
      return os.userInfo().username
    } catch (error) {
      console.error('Error getting system username:', error)
      return 'unknown'
    }
  }

  /**
   * 切换主窗口显示/隐藏状态
   */
  toggleMainWindow() {
    const mainWindow = windowManager.getMainWindow()
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  }
}

module.exports = new IpcHandler()
