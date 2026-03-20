const { BrowserWindow, screen } = require('electron')
const path = require('path')

class FloatingBallManager {
  constructor() {
    this.floatingBallWindow = null
  }

  /**
   * 创建悬浮球窗口
   */
  createFloatingBall() {
    try {
      // 创建悬浮球窗口
      this.floatingBallWindow = new BrowserWindow({
        width: 100,
        height: 100,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      })

      // 加载悬浮球HTML
      this.floatingBallWindow.loadFile(path.join(__dirname, '../../../public', 'floating-ball.html'))

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
