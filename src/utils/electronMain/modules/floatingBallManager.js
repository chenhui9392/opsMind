const { BrowserWindow, screen, app } = require('electron')
const path = require('path')
const fs = require('fs')

class FloatingBallManager {
  constructor() {
    this.floatingBallWindow = null
  }

  /**
   * 获取 preload 脚本路径
   */
  getPreloadPath() {
    // 使用 app.getAppPath() 获取应用根目录
    const appPath = app.getAppPath()
    const preloadPath = path.join(appPath, 'preload.js')
    // 校验 preload 文件是否存在，避免窗口创建后 preload 加载失败导致白屏
    if (!fs.existsSync(preloadPath)) {
      console.error('[FloatingBallManager] preload.js 不存在:', preloadPath)
    }
    return preloadPath
  }

  /**
   * 获取开发服务器端口
   */
  getDevServerPort() {
    // 从环境变量读取端口，默认为 9090
    return process.env.VITE_DEV_SERVER_PORT || 9090
  }

  /**
   * 创建悬浮球窗口
   * @param {boolean} isDev - 是否为开发模式
   */
  createFloatingBall(isDev = false) {
    try {
      const preloadPath = this.getPreloadPath()
      const devPort = this.getDevServerPort()
      // 创建悬浮球窗口
      this.floatingBallWindow = new BrowserWindow({
        width: 40,
        height: 40,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        hasShadow: false,  // 禁用窗口阴影
        backgroundColor: '#00000000',  // 透明背景色
        webPreferences: {
          preload: preloadPath,
          nodeIntegration: false,
          contextIsolation: true,
          webSecurity: false
        }
      })
      this.floatingBallWindow.setShape([
        { x: 0, y: 0, width: 40, height: 40 }
      ])

      // 加载悬浮球页面（Vue路由）
      const floatingBallUrl = isDev
        ? `http://localhost:${devPort}/#/floating-ball`
        : 'app://./dist/index.html#/floating-ball'
      console.log('[FloatingBallManager] 加载悬浮球页面:', floatingBallUrl, 'isDev=', isDev)
      this.floatingBallWindow.loadURL(floatingBallUrl)

      // 监听页面加载完成事件
      this.floatingBallWindow.webContents.on('did-finish-load', () => {
        console.log('[FloatingBallManager] 悬浮球页面加载完成')
      })

      // 监听页面加载失败事件
      this.floatingBallWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('[FloatingBallManager] 悬浮球页面加载失败:', {
          errorCode,
          errorDescription,
          validatedURL
        })
      })

      // 隐藏默认菜单
      this.floatingBallWindow.setMenu(null)

      // 初始位置：屏幕右下角
      const { width, height } = screen.getPrimaryDisplay().workAreaSize
      this.floatingBallWindow.setPosition(width - 100, height - 200)
      console.log('[FloatingBallManager] 悬浮球窗口创建成功，位置:', width - 100, height - 200)

    } catch (error) {
      console.error('[FloatingBallManager] 创建悬浮球窗口失败:', error)
    }
  }

  /**
   *
   * 获取悬浮球窗口实例
   * @returns {BrowserWindow|null} - 悬浮球窗口实例
   */
  getFloatingBallWindow() {
    return this.floatingBallWindow
  }

  /**
   * 获取悬浮球窗口位置
   * @returns {Object|null} - 位置对象 {x, y}
   */
  getWindowPosition() {
    if (this.floatingBallWindow) {
      const position = this.floatingBallWindow.getPosition()
      return { x: position[0], y: position[1] }
    }
    return null
  }

  /**
   * 更新悬浮球窗口位置
   * @param {Object} pos - 位置对象 {x, y}
   */
  updateWindowPosition(pos) {
    if (this.floatingBallWindow) {
      this.floatingBallWindow.setPosition(pos.x, pos.y)
    }
  }

  /**
   * 销毁悬浮球窗口
   */
  destroyFloatingBall() {
    if (this.floatingBallWindow) {
      this.floatingBallWindow.destroy()
      this.floatingBallWindow = null
    }
  }
}

module.exports = new FloatingBallManager()
