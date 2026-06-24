const { BrowserWindow, desktopCapturer, screen, ipcMain, app } = require('electron')
const path = require('path')
const fs = require('fs')

/**
 * 截图管理器
 * 负责截图流程：捕获所有显示器 -> 在每个显示器上显示选择遮罩 -> 裁剪并返回给渲染进程
 *
 * 设计要点：
 * 1. 截图时自动隐藏主窗口，截图完成或取消后自动恢复显示
 * 2. 多屏支持：为每个显示器创建一个覆盖窗口，并发送对应屏幕的截图
 * 3. 通过 displayId 区分各个覆盖窗口，任何一个完成选择都会关闭所有覆盖窗口
 */
class ScreenshotManager {
  constructor() {
    /** @type {BrowserWindow[]} */
    this.overlayWindows = []
    this.mainWindowRef = null
    this.isCapturing = false
    this._wasMainVisible = false
    this.setupIpc()
  }

  /**
   * 设置主窗口引用（用于截图完成后回传给主窗口的渲染进程）
   * @param {BrowserWindow} mainWindow
   */
  setMainWindow(mainWindow) {
    this.mainWindowRef = mainWindow
  }

  /**
   * 设置 IPC 监听
   */
  setupIpc() {
    // 截图完成（用户点击确定）
    ipcMain.on('screenshot-complete', (event, payload) => {
      this.handleComplete(payload)
    })

    // 截图取消
    ipcMain.on('screenshot-cancel', () => {
      this.handleCancel()
    })

    // 渲染进程主动触发截图
    ipcMain.handle('startScreenshot', async () => {
      try {
        await this.startCapture()
        return { success: true }
      } catch (error) {
        console.error('[ScreenshotManager] 启动截图失败:', error)
        this.isCapturing = false
        this.closeAllOverlays()
        this.restoreMainWindow()
        return { success: false, message: error.message }
      }
    })
  }

  /**
   * 获取覆盖窗口 HTML 文件路径
   * @returns {string}
   */
  getOverlayHtmlPath() {
    if (app.isPackaged) {
      const asarPath = path.join(process.resourcesPath, 'app.asar', 'public', 'screenshot-overlay.html')
      if (fs.existsSync(asarPath)) return asarPath
      const altPath = path.join(process.resourcesPath, 'public', 'screenshot-overlay.html')
      return altPath
    }
    return path.join(__dirname, '../../../../public/screenshot-overlay.html')
  }

  /**
   * 启动截图流程
   */
  async startCapture() {
    if (this.isCapturing) {
      return
    }
    this.isCapturing = true

    // 隐藏主窗口，避免主窗口出现在截图中
    this._wasMainVisible = !!(
      this.mainWindowRef &&
      !this.mainWindowRef.isDestroyed() &&
      this.mainWindowRef.isVisible()
    )
    if (this._wasMainVisible) {
      this.mainWindowRef.hide()
      // 等待短暂时间，确保窗口已从屏幕上消失再进行截屏
      await new Promise((resolve) => setTimeout(resolve, 250))
    }

    // 获取所有显示器
    const displays = screen.getAllDisplays()

    // 捕获所有屏幕源（按最大的显示器尺寸取缩略图）
    const maxWidth = Math.max(...displays.map((d) => Math.round(d.size.width * (d.scaleFactor || 1))))
    const maxHeight = Math.max(...displays.map((d) => Math.round(d.size.height * (d.scaleFactor || 1))))

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: maxWidth,
        height: maxHeight
      }
    })

    console.log(`[ScreenshotManager] 检测到 ${displays.length} 个显示器，${sources.length} 个屏幕源`)
    sources.forEach((s, i) => {
      console.log(`  source[${i}] id=${s.id} display_id=${s.display_id} name=${s.name}`)
    })
    displays.forEach((d, i) => {
      console.log(`  display[${i}] id=${d.id} bounds=`, d.bounds, 'scale=', d.scaleFactor)
    })

    if (!sources || sources.length === 0) {
      this.isCapturing = false
      throw new Error('未获取到屏幕源')
    }

    // 为每个显示器创建覆盖窗口
    displays.forEach((display, index) => {
      // 优先按 display_id 匹配，失败则回退到按索引匹配（多屏 source 顺序一般与 displays 一致）
      let source = sources.find(
        (s) => s.display_id && String(s.display_id) === String(display.id)
      )
      if (!source) {
        source = sources[index] || sources[0]
      }
      if (!source) {
        console.warn(`[ScreenshotManager] 显示器 ${display.id} 找不到对应屏幕源，跳过`)
        return
      }
      const dataUrl = source.thumbnail.toDataURL()
      const scaleFactor = display.scaleFactor || 1
      this.createOverlayWindow(display, dataUrl, scaleFactor)
    })
  }

  /**
   * 创建截图覆盖窗口（覆盖工作区，避开任务栏，避免重影）
   * @param {Object} display - 显示器对象
   * @param {string} dataUrl - 截图数据 URL
   * @param {number} scaleFactor - 缩放因子
   */
  createOverlayWindow(display, dataUrl, scaleFactor) {
    // 使用 workArea（工作区）而非 bounds（完整屏幕区），以避开 Windows 任务栏
    // 这样不会出现"截图中的假任务栏 + 真任务栏"两个任务栏并存的问题
    const { x, y, width, height } = display.workArea
    const fullBounds = display.bounds

    const overlayWindow = new BrowserWindow({
      x,
      y,
      width,
      height,
      frame: false,
      // 关键：不使用 transparent，让窗口背景为不透明，否则 Windows 任务栏会"穿透"显示在前面
      transparent: false,
      alwaysOnTop: true,
      resizable: false,
      movable: false,
      skipTaskbar: true,
      // 关键：fullscreenable 设为 false，避免 setFullScreen 把多屏窗口跳到主屏
      fullscreenable: false,
      hasShadow: false,
      autoHideMenuBar: true,
      backgroundColor: '#000000',
      focusable: true,
      show: false, // 先不显示，等加载完成后设置位置再 show，避免闪烁
      enableLargerThanScreen: true, // 允许窗口尺寸大于主屏（多屏定位必需）
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false
      }
    })

    overlayWindow.displayId = display.id
    overlayWindow.setMenu(null)

    // 关键：使用 screen-saver 级别置顶，是 Electron 中最高的 always-on-top 级别
    // 在 Windows 上可以覆盖任务栏；relativeLevel = 1 进一步提升优先级
    overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1)
    overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

    const htmlPath = this.getOverlayHtmlPath()
    overlayWindow.loadFile(htmlPath)

    overlayWindow.webContents.on('did-finish-load', () => {
      // workArea 相对于 bounds 的偏移（用于在 overlay 中正确显示背景截图）
      const offsetX = x - fullBounds.x
      const offsetY = y - fullBounds.y

      overlayWindow.webContents.send('screenshot-data', {
        dataUrl,
        scaleFactor,
        displayId: display.id,
        // 该 overlay 在屏幕上的逻辑像素尺寸（workArea）
        overlayWidth: width,
        overlayHeight: height,
        // 在原始截图里需要裁掉的偏移（如顶部状态栏或左侧 dock）
        offsetX,
        offsetY,
        // 全屏的尺寸（用于 dataUrl 上像素坐标换算）
        fullWidth: fullBounds.width,
        fullHeight: fullBounds.height
      })

      // 关键：通过 setBounds 强制定位到对应显示器（避免多屏时被移到主屏）
      overlayWindow.setBounds({ x, y, width, height })
      overlayWindow.show()
      overlayWindow.focus()
      overlayWindow.moveTop()
      // 再次确认位置（show 之后某些系统会重新计算位置）
      overlayWindow.setBounds({ x, y, width, height })
    })

    overlayWindow.on('closed', () => {
      this.overlayWindows = this.overlayWindows.filter((w) => w !== overlayWindow)
    })

    this.overlayWindows.push(overlayWindow)
  }

  /**
   * 处理截图完成
   * @param {Object} payload - { dataUrl }
   */
  handleComplete(payload) {
    if (this.mainWindowRef && !this.mainWindowRef.isDestroyed()) {
      this.mainWindowRef.webContents.send('screenshot-result', {
        success: true,
        dataUrl: payload.dataUrl
      })
    }
    this.closeAllOverlays()
    this.restoreMainWindow()
    this.isCapturing = false
  }

  /**
   * 处理截图取消
   */
  handleCancel() {
    if (this.mainWindowRef && !this.mainWindowRef.isDestroyed()) {
      this.mainWindowRef.webContents.send('screenshot-result', {
        success: false,
        cancelled: true
      })
    }
    this.closeAllOverlays()
    this.restoreMainWindow()
    this.isCapturing = false
  }

  /**
   * 恢复主窗口显示
   */
  restoreMainWindow() {
    if (
      this._wasMainVisible &&
      this.mainWindowRef &&
      !this.mainWindowRef.isDestroyed()
    ) {
      this.mainWindowRef.show()
      this.mainWindowRef.focus()
    }
    this._wasMainVisible = false
  }

  /**
   * 关闭所有覆盖窗口
   */
  closeAllOverlays() {
    const wins = [...this.overlayWindows]
    this.overlayWindows = []
    wins.forEach((w) => {
      if (w && !w.isDestroyed()) {
        try {
          w.close()
        } catch (err) {
          // ignore
        }
      }
    })
  }
}

module.exports = new ScreenshotManager()
