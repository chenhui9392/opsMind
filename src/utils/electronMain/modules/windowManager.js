const { BrowserWindow, nativeImage, app } = require('electron')
const path = require('path')
const fs = require('fs')
const floatingBallManager = require('./floatingBallManager')

/**
 * 获取应用环境模式
 * @returns {'development'|'beta'|'production'} 环境模式
 */
const getAppEnvMode = () => {
  if (!app.isPackaged) {
    return 'development'
  }

  try {
    const envModePath = path.join(process.resourcesPath, 'app.asar', 'dist', '.env-mode')
    if (fs.existsSync(envModePath)) {
      const mode = fs.readFileSync(envModePath, 'utf-8').trim()
      if (mode === 'development') {
        return 'development'
      } else if (mode === 'beta') {
        return 'beta'
      }
    }
  } catch (error) {
    // ignore error
  }

  return 'production'
}

/**
 * 获取图标名称（根据环境不同）
 * @returns {string} 图标文件名
 */
const getIconName = () => {
  const envMode = getAppEnvMode()
  if (envMode === 'development') {
    return 'app-dev.png'
  } else if (envMode === 'beta') {
    return 'app-beta.png'
  }
  return 'app.png'
}

class WindowManager {
  constructor() {
    this.mainWindow = null
  }

  /**
   * 获取窗口图标路径（根据环境不同）
   * @returns {string|null} - 图标路径或null
   */
  getIconPath() {
    const iconName = getIconName()
    let iconPath

    if (app.isPackaged) {
      // 生产环境
      iconPath = path.join(process.resourcesPath, 'app.asar', 'public', iconName)
      if (!fs.existsSync(iconPath)) {
        iconPath = path.join(process.resourcesPath, 'public', iconName)
      }
      // 如果环境图标不存在，使用默认图标
      if (!fs.existsSync(iconPath)) {
        iconPath = path.join(process.resourcesPath, 'app.asar', 'public', 'app.png')
        if (!fs.existsSync(iconPath)) {
          iconPath = path.join(process.resourcesPath, 'public', 'app.png')
        }
      }
    } else {
      // 开发环境
      iconPath = path.join(__dirname, '../../../../public', iconName)
      if (!fs.existsSync(iconPath)) {
        iconPath = path.join(__dirname, '../../../../public', 'app.png')
      }
    }

    return fs.existsSync(iconPath) ? iconPath : null
  }

  /**
   * 创建主窗口
   * @param {string} windowTitle - 窗口标题（根据环境不同）
   * @returns {BrowserWindow} - 主窗口实例
   */
  createWindow(windowTitle = '海豚') {
    // 获取图标路径
    const iconPath = this.getIconPath()
    const windowOptions = {
      width: 1000,
      height: 700,
      title: windowTitle,
      webPreferences: {
        preload: path.join(app.getAppPath(), 'preload.js'),
        devTools: true,
        webSecurity: false
      },
      show: true,
      alwaysOnTop: true,
      transparent: false,
      frame: true,
      autoHideMenuBar: true
    }

    // 如果图标存在，设置窗口图标
    if (iconPath) {
      try {
        windowOptions.icon = iconPath
      } catch (error) {
        // ignore error
      }
    }

    // 创建窗口
    this.mainWindow = new BrowserWindow(windowOptions)

    if (!app.isPackaged) {
      // 未打包：加载Vite开发服务器
      const devPort = process.env.VITE_DEV_SERVER_PORT || 9090
      this.mainWindow.loadURL(`http://localhost:${devPort}`)
    } else {
      // 已打包：使用 app:// 自定义协议加载，避免 file:// 的 CORS 问题
      const indexUrl = 'app://./dist/index.html'
      this.mainWindow.loadURL(indexUrl)
    }

    // 监听页面加载事件
    this.mainWindow.webContents.on('did-finish-load', () => {
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
   * 关闭开发者工具
   */
  closeDevTools() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.closeDevTools()
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
