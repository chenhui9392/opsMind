const { Tray, Menu, nativeImage, app } = require('electron')
const path = require('path')
const fs = require('fs')
const windowManager = require('./windowManager')

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

class TrayManager {
  constructor() {
    this.tray = null
  }

  /**
   * 获取当前平台推荐的托盘图标尺寸
   * @returns {number} 图标边长（像素）
   */
  getTrayIconSize() {
    switch (process.platform) {
      case 'win32':
        return 16
      case 'darwin':
        return 18
      default:
        return 22
    }
  }

  /**
   * 将大图缩放为适合托盘显示的尺寸
   * @param {Electron.NativeImage} icon - 原始图标
   * @returns {Electron.NativeImage} - 缩放后的图标
   */
  createResizedTrayIcon(icon) {
    const size = icon.getSize()
    const traySize = this.getTrayIconSize()
    if (size.width <= traySize * 2 && size.height <= traySize * 2) {
      return icon
    }
    return icon.resize({ width: traySize, height: traySize, quality: 'best' })
  }

  /**
   * 获取托盘图标路径（根据环境不同）
   * @returns {string|null} 图标路径
   */
  getTrayIconPath() {
    const iconName = getIconName()
    let iconPath

    if (app.isPackaged) {
      iconPath = path.join(process.resourcesPath, 'app.asar', 'public', iconName)
      if (!fs.existsSync(iconPath)) {
        iconPath = path.join(process.resourcesPath, 'public', iconName)
      }
      // 环境图标不存在时使用默认图标
      if (!fs.existsSync(iconPath)) {
        iconPath = path.join(process.resourcesPath, 'app.asar', 'public', 'app.png')
        if (!fs.existsSync(iconPath)) {
          iconPath = path.join(process.resourcesPath, 'public', 'app.png')
        }
      }
    } else {
      iconPath = path.join(app.getAppPath(), 'public', iconName)
      if (!fs.existsSync(iconPath)) {
        iconPath = path.join(app.getAppPath(), 'public', 'app.png')
      }
    }

    return fs.existsSync(iconPath) ? iconPath : null
  }

  /**
   * 创建托盘图标
   * @param {Function} showWindowCallback - 显示窗口的回调函数
   * @param {Function} quitAppCallback - 退出应用的回调函数
   * @param {string} appName - 应用名称（根据环境不同）
   */
  createTray(showWindowCallback, quitAppCallback, appName = '海豚') {
    try {
      let iconPath = this.getTrayIconPath()

      // 如果找不到图标，尝试使用 ico 格式
      if (!iconPath) {
        const envMode = getAppEnvMode()
        let icoName
        if (envMode === 'development') {
          icoName = 'app-dev.ico'
        } else if (envMode === 'beta') {
          icoName = 'app-beta.ico'
        } else {
          icoName = 'app.ico'
        }

        if (app.isPackaged) {
          iconPath = path.join(process.resourcesPath, 'app.asar', 'public', icoName)
          if (!fs.existsSync(iconPath)) {
            iconPath = path.join(process.resourcesPath, 'public', icoName)
          }
          // 环境图标不存在时使用默认图标
          if (!fs.existsSync(iconPath)) {
            iconPath = path.join(process.resourcesPath, 'app.asar', 'public', 'app.ico')
            if (!fs.existsSync(iconPath)) {
              iconPath = path.join(process.resourcesPath, 'public', 'app.ico')
            }
          }
        } else {
          iconPath = path.join(app.getAppPath(), 'public', icoName)
          if (!fs.existsSync(iconPath)) {
            iconPath = path.join(app.getAppPath(), 'public', 'app.ico')
          }
        }

        if (!fs.existsSync(iconPath)) {
          iconPath = null
        }
      }

      if (iconPath) {
        const icon = nativeImage.createFromPath(iconPath)
        if (!icon.isEmpty()) {
          const trayIcon = this.createResizedTrayIcon(icon)
          this.tray = new Tray(trayIcon)
        } else {
          this.tray = new Tray(iconPath)
        }
      } else {
        // 使用可执行文件作为图标
        if (app.isPackaged) {
          const icon = nativeImage.createFromPath(process.execPath)
          if (!icon.isEmpty()) {
            this.tray = new Tray(icon)
          } else {
            this.tray = new Tray(nativeImage.createEmpty())
          }
        } else {
          this.tray = new Tray(nativeImage.createEmpty())
        }
      }

      // 托盘菜单
      const contextMenu = Menu.buildFromTemplate([
        {
          label: '显示窗口',
          click: showWindowCallback
        },
        {
          label: '退出',
          click: quitAppCallback
        }
      ])

      // 设置托盘图标提示（根据环境不同）
      this.tray.setToolTip(appName)
      this.tray.setContextMenu(contextMenu)

      // 点击托盘图标显示/隐藏窗口
      this.tray.on('click', () => {
        const mainWindow = windowManager.getMainWindow()
        if (mainWindow && !mainWindow.isDestroyed()) {
          if (mainWindow.isVisible()) {
            mainWindow.hide()
          } else {
            mainWindow.show()
            mainWindow.focus()
          }
        } else {
          showWindowCallback()
        }
      })
    } catch (error) {
      console.error('[TrayManager] 创建托盘失败:', error.message)
    }
  }

  /**
   * 获取托盘实例
   * @returns {Tray|null} - 托盘实例
   */
  getTray() {
    return this.tray
  }

  /**
   * 销毁托盘
   */
  destroyTray() {
    if (this.tray) {
      this.tray.destroy()
      this.tray = null
    }
  }
}

module.exports = new TrayManager()
