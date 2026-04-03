const { ipcMain, shell, dialog } = require('electron')
const os = require('os')
const https = require('https')
const fs = require('fs')
const path = require('path')
const floatingBallManager = require('./floatingBallManager')
const windowManager = require('./windowManager')

class IpcHandler {
  constructor() {
    this.setupHandlers()
    this.setupMessageForwarders()
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

    // 处理下载并安装更新
    ipcMain.handle('downloadAndInstallUpdate', async (event, downloadUrl, fileName) => {
      return await this.downloadAndInstallUpdate(downloadUrl, fileName)
    })

    // 处理打开外部链接（下载更新）
    ipcMain.handle('openExternalLink', async (event, url) => {
      return await this.openExternalLink(url)
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

        // 通知悬浮球窗口主窗口已显示
        const floatingBallWindow = floatingBallManager.getFloatingBallWindow()
        if (floatingBallWindow && !floatingBallWindow.isDestroyed()) {
          console.log('[IPC] 通知悬浮球主窗口已显示')
          floatingBallWindow.webContents.send('main-window-shown', {})
        }
      }
    }
  }

  /**
   * 打开外部链接（用于下载更新）
   * @param {string} url - 下载链接
   * @returns {Promise<boolean>} 是否成功打开
   */
  async openExternalLink(url) {
    try {
      console.log('Opening external link:', url)
      await shell.openExternal(url)
      return { success: true, message: '已在浏览器中打开下载链接' }
    } catch (error) {
      console.error('Failed to open external link:', error)
      return { success: false, message: error.message }
    }
  }

  /**
   * 下载并安装更新
   * @param {string} downloadUrl - 下载链接
   * @param {string} fileName - 文件名（可选）
   * @returns {Promise<Object>} 下载安装结果
   */
  async downloadAndInstallUpdate(downloadUrl, fileName) {
    const mainWindow = windowManager.getMainWindow()
    
    try {
      console.log('Starting download and install update:', downloadUrl)
      
      // 获取下载目录
      const downloadsPath = path.join(os.homedir(), 'Downloads')
      const installerName = fileName || `update-${Date.now()}.exe`
      const installerPath = path.join(downloadsPath, installerName)
      
      console.log('Download path:', installerPath)
      
      // 下载文件
      await this.downloadFile(downloadUrl, installerPath)
      
      console.log('Download completed:', installerPath)
      
      // 显示提示对话框
      const result = await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: '下载完成',
        message: '新版本安装包已下载完成，是否立即安装？',
        detail: `安装包位置：${installerPath}`,
        buttons: ['立即安装', '稍后安装'],
        defaultId: 0,
        cancelId: 1
      })
      
      if (result.response === 0) {
        // 用户选择立即安装
        console.log('User chose to install now')
        
        // 关闭当前应用
        mainWindow.close()
        
        // 启动安装程序
        shell.openPath(installerPath)
        
        return { success: true, message: '正在启动安装程序...', installerPath }
      } else {
        // 用户选择稍后安装
        console.log('User chose to install later')
        return { success: true, message: '安装包已保存到下载目录', installerPath, delayed: true }
      }
      
    } catch (error) {
      console.error('Download and install failed:', error)
      
      // 下载失败，尝试用浏览器打开下载链接
      try {
        await shell.openExternal(downloadUrl)
        return { 
          success: true, 
          message: '已在浏览器中打开下载链接，请手动下载安装',
          fallback: true 
        }
      } catch (fallbackError) {
        return { 
          success: false, 
          message: `下载失败：${error.message}` 
        }
      }
    }
  }

  /**
   * 设置消息转发器
   * 用于在主窗口和悬浮球窗口之间转发消息
   */
  setupMessageForwarders() {
    // 监听来自主窗口的未读消息通知
    ipcMain.on('notify-unread-message', (event, data) => {
      console.log('[IPC] 转发未读消息到悬浮球:', data)
      const floatingBallWindow = floatingBallManager.getFloatingBallWindow()
      if (floatingBallWindow && !floatingBallWindow.isDestroyed()) {
        floatingBallWindow.webContents.send('unread-message', data)
      }
    })

    // 监听主窗口显示事件，通知悬浮球清空未读
    ipcMain.on('main-window-shown', () => {
      console.log('[IPC] 主窗口显示，通知悬浮球清空未读')
      const floatingBallWindow = floatingBallManager.getFloatingBallWindow()
      if (floatingBallWindow && !floatingBallWindow.isDestroyed()) {
        floatingBallWindow.webContents.send('main-window-shown', {})
      }
    })
  }

  /**
   * 下载文件
   * @param {string} url - 下载URL
   * @param {string} destPath - 目标路径
   * @returns {Promise<void>}
   */
  downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(destPath)
      
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`下载失败，状态码：${response.statusCode}`))
          return
        }
        
        response.pipe(file)
        
        file.on('finish', () => {
          file.close()
          resolve()
        })
        
        file.on('error', (err) => {
          fs.unlink(destPath, () => {})
          reject(err)
        })
      }).on('error', (err) => {
        fs.unlink(destPath, () => {})
        reject(err)
      })
    })
  }
}

module.exports = new IpcHandler()
