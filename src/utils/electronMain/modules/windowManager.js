const { BrowserWindow, nativeImage, app } = require('electron')
const path = require('path')
const fs = require('fs')
const floatingBallManager = require('./floatingBallManager')

class WindowManager {
  constructor() {
    this.mainWindow = null
  }

  /**
   * 获取窗口图标路径
   * @returns {string|null} - 图标路径或null
   */
  getIconPath() {
    let iconPath
    const { app } = require('electron')

    if (app.isPackaged) {
      // 生产环境
      iconPath = path.join(process.resourcesPath, 'app.asar', 'public', 'app.png')
      if (!fs.existsSync(iconPath)) {
        iconPath = path.join(process.resourcesPath, 'public', 'app.png')
      }
    } else {
      // 开发环境
      iconPath = path.join(__dirname, '../../../public', 'app.png')
    }

    return fs.existsSync(iconPath) ? iconPath : null
  }

  /**
   * 创建主窗口
   * @returns {BrowserWindow} - 主窗口实例
   */
  createWindow() {
    // 获取图标路径
    const iconPath = this.getIconPath()
    const windowOptions = {
      width: 1000,
      height: 700,
      webPreferences: {
        preload: path.join(app.getAppPath(), 'preload.js'),
        devTools: true
      },
      show: true,
      alwaysOnTop: true, // 确保窗口在最前面
      transparent: false, // 确保窗口不透明
      frame: true // 确保窗口有边框
    }

    // 如果图标存在，设置窗口图标
    if (iconPath) {
      try {
        // Windows 上直接使用路径字符串更可靠
        windowOptions.icon = iconPath
        console.log('Window icon set to:', iconPath)
      } catch (error) {
        console.error('Error setting window icon:', error)
      }
    } else {
      console.log('Window icon path not found')
    }

    // 创建窗口
    this.mainWindow = new BrowserWindow(windowOptions)

    // 检查是否为开发模式
    const isDev = !require('electron').app.isPackaged
    console.log('Is dev mode:', isDev)

    if (isDev) {
      // 开发模式：加载Vite开发服务器
      const devPort = process.env.VITE_DEV_SERVER_PORT || 9090
      console.log(`Loading Vite dev server at http://localhost:${devPort}`)
      this.mainWindow.loadURL(`http://localhost:${devPort}`)
    } else {
      // 生产模式：加载静态文件
      console.log('Loading static file at dist/index.html')
      this.mainWindow.loadFile('dist/index.html')
    }

    // 只在开发模式下打开开发者工具
    if (isDev) {
      // 打开开发者工具，方便调试，并调整位置
      this.mainWindow.webContents.openDevTools({ mode: 'detach' })
    }

    // 监听页面加载事件
    this.mainWindow.webContents.on('did-finish-load', () => {
      console.log('Page loaded successfully')
      console.log('Window visible:', this.mainWindow.isVisible())
      console.log('Window position:', this.mainWindow.getPosition())
      console.log('Window size:', this.mainWindow.getSize())

      // 确保窗口在最前面
      this.mainWindow.setAlwaysOnTop(true)
      this.mainWindow.focus()

      // 延迟取消alwaysOnTop，避免遮挡其他窗口
      setTimeout(() => {
        this.mainWindow.setAlwaysOnTop(false)
      }, 2000)
    })

    // 监听页面加载失败事件
    this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Page load failed:', errorCode, errorDescription)
    })

    // 关闭窗口时最小化到托盘
    this.mainWindow.on('close', (event) => {
      if (require('electron').app.quitting) {
        this.mainWindow = null
      } else {
        event.preventDefault()
        this.mainWindow.hide()
      }
    })

    // 确保窗口可见
    setTimeout(() => {
      this.mainWindow.show()
      this.mainWindow.focus()
      console.log('Window forced to show after timeout')
    }, 1000)

    return this.mainWindow
  }

  /**
   * 获取主窗口实例
   * @returns {BrowserWindow|null} - 主窗口实例
   */
  getMainWindow() {
    return this.mainWindow
  }

  /**
   * 显示主窗口
   */
  showMainWindow() {
    if (this.mainWindow) {
      this.mainWindow.show()
      this.mainWindow.focus()

      // 通知悬浮球窗口主窗口已显示
      const floatingBallWindow = floatingBallManager.getFloatingBallWindow()
      if (floatingBallWindow && !floatingBallWindow.isDestroyed()) {
        console.log('[WindowManager] 通知悬浮球主窗口已显示')
        floatingBallWindow.webContents.send('main-window-shown', {})
      }
    }
  }

  /**
   * 隐藏主窗口
   */
  hideMainWindow() {
    if (this.mainWindow) {
      this.mainWindow.hide()
    }
  }

  /**
   * 销毁主窗口
   */
  destroyMainWindow() {
    if (this.mainWindow) {
      this.mainWindow.destroy()
      this.mainWindow = null
    }
  }
}

module.exports = new WindowManager()
