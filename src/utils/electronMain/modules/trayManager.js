const { Tray, Menu, nativeImage, app } = require('electron')
const path = require('path')
const fs = require('fs')
const windowManager = require('./windowManager')

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
    // 如果图标已经适合托盘尺寸，直接返回原图
    if (size.width <= traySize * 2 && size.height <= traySize * 2) {
      return icon
    }
    // 缩放到合适尺寸，避免系统强制缩放导致细节丢失
    return icon.resize({ width: traySize, height: traySize, quality: 'best' })
  }

  /**
   * 创建托盘图标
   * @param {Function} showWindowCallback - 显示窗口的回调函数
   * @param {Function} quitAppCallback - 退出应用的回调函数
   */
  createTray(showWindowCallback, quitAppCallback) {
    try {
      // 创建托盘图标
      let iconPath

      // 首先尝试使用app.png
      if (require('electron').app.isPackaged) {
        // 生产环境：使用应用根目录下的public文件夹
        iconPath = path.join(process.resourcesPath, 'app.asar', 'public', 'app.png')
        // 如果上述路径不存在，尝试另一种可能的路径
        if (!fs.existsSync(iconPath)) {
          iconPath = path.join(process.resourcesPath, 'public', 'app.png')
        }
      } else {
        // 开发环境：使用项目根目录下的public文件夹
        iconPath = path.join(app.getAppPath(), 'public', 'app.png')
      }

      // 尝试使用PNG文件
      try {
        if (fs.existsSync(iconPath)) {
          // 尝试使用nativeImage.createFromPath()方法加载图标
          const icon = nativeImage.createFromPath(iconPath)
          if (!icon.isEmpty()) {
            const trayIcon = this.createResizedTrayIcon(icon)
            this.tray = new Tray(trayIcon)
          } else {
            // 尝试直接使用路径
            this.tray = new Tray(iconPath)
          }
        } else {
          // 尝试使用app.ico
          if (require('electron').app.isPackaged) {
            iconPath = path.join(process.resourcesPath, 'app.asar', 'public', 'app.ico')
            if (!fs.existsSync(iconPath)) {
              iconPath = path.join(process.resourcesPath, 'public', 'app.ico')
            }
          } else {
            iconPath = path.join(app.getAppPath(), 'public', 'app.ico')
          }

          if (fs.existsSync(iconPath)) {
            // 尝试使用nativeImage.createFromPath()方法加载图标
            const icon = nativeImage.createFromPath(iconPath)
            if (!icon.isEmpty()) {
              const trayIcon = this.createResizedTrayIcon(icon)
              this.tray = new Tray(trayIcon)
            } else {
              // 尝试直接使用路径
              this.tray = new Tray(iconPath)
            }
          } else {
            // 在生产环境中，尝试使用应用可执行文件作为图标
            if (require('electron').app.isPackaged) {
              try {
                const icon = nativeImage.createFromPath(process.execPath)
                if (!icon.isEmpty()) {
                  this.tray = new Tray(icon)
                } else {
                  // 创建一个简单的图标
                  const emptyIcon = nativeImage.createEmpty()
                  this.tray = new Tray(emptyIcon)
                }
              } catch (execError) {
                // 创建一个简单的图标
                const emptyIcon = nativeImage.createEmpty()
                this.tray = new Tray(emptyIcon)
              }
            } else {
              // 开发环境：尝试使用其他可能的图标路径
              try {
                // 尝试使用Electron的默认图标
                const electronPath = require('electron')
                const defaultIconPath = path.join(electronPath.app.getAppPath(), 'node_modules', 'electron', 'dist', 'resources', 'electron.exe')
                if (fs.existsSync(defaultIconPath)) {
                  const icon = nativeImage.createFromPath(defaultIconPath)
                  if (!icon.isEmpty()) {
                    this.tray = new Tray(icon)
                  } else {
                    throw new Error('Default Electron icon is empty')
                  }
                } else {
                  throw new Error('Default Electron icon not found')
                }
              } catch (defaultError) {
                // 创建一个简单的图标
                const emptyIcon = nativeImage.createEmpty()
                this.tray = new Tray(emptyIcon)
              }
            }
          }
        }
      } catch (iconError) {
        // 备用方案：创建一个简单的图标
        try {
          const emptyIcon = nativeImage.createEmpty()
          this.tray = new Tray(emptyIcon)
        } catch (fallbackError) {
          throw fallbackError
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

      // 设置托盘图标提示
      this.tray.setToolTip('海豚')
      // 设置托盘菜单
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
