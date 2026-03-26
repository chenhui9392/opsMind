const { BrowserWindow } = require('electron')
const path = require('path')

class WindowManager {
  constructor() {
    this.mainWindow = null
  }

  /**
   * 创建主窗口
   * @returns {BrowserWindow} - 主窗口实例
   */
  createWindow() {
    // 创建窗口
    this.mainWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      webPreferences: {
        preload: path.join(__dirname, '../../../preload.js'),
        devTools: true
      },
      show: true,
      alwaysOnTop: true, // 确保窗口在最前面
      transparent: false, // 确保窗口不透明
      frame: true // 确保窗口有边框
    })

    // 检查是否为开发模式
    const isDev = !require('electron').app.isPackaged
    console.log('Is dev mode:', isDev)

    if (isDev) {
      // 开发模式：加载Vite开发服务器
      console.log('Loading Vite dev server at http://localhost:9091')
      this.mainWindow.loadURL('http://localhost:9091')
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
