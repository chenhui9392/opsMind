const { BrowserWindow, screen, app } = require('electron')
const path = require('path')

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
    return path.join(appPath, 'preload.js')
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
      console.log('Floating ball preload path:', preloadPath)
      console.log('Dev server port:', devPort)

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
          contextIsolation: true
        }
      })

      // 加载悬浮球页面（Vue路由）
      if (isDev) {
        // 开发模式：加载Vite开发服务器的悬浮球路由
        this.floatingBallWindow.loadURL(`http://localhost:${devPort}/#/floating-ball`)
      } else {
        // 生产模式：加载打包后的静态文件
        this.floatingBallWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'), {
          hash: '/floating-ball'
        })
      }

      // 隐藏默认菜单
      this.floatingBallWindow.setMenu(null)

      // 初始位置：屏幕右下角
      const { width, height } = screen.getPrimaryDisplay().workAreaSize
      this.floatingBallWindow.setPosition(width - 100, height - 200)

      console.log('Floating ball created successfully')
    } catch (error) {
      console.error('Error creating floating ball:', error)
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
