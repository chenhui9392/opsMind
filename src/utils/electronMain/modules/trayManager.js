const { Tray, Menu, nativeImage, app } = require('electron')
const path = require('path')
const fs = require('fs')
const windowManager = require('./windowManager')

class TrayManager {
  constructor() {
    this.tray = null
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

      console.log('Trying tray icon path (PNG):', iconPath)

      // 尝试使用PNG文件
      try {
        if (fs.existsSync(iconPath)) {
          console.log('PNG tray icon file exists, trying to load...')
          // 尝试使用nativeImage.createFromPath()方法加载图标
          const icon = nativeImage.createFromPath(iconPath)
          if (!icon.isEmpty()) {
            this.tray = new Tray(icon)
            console.log('Tray icon loaded from PNG file using nativeImage')
          } else {
            console.error('Failed to load PNG tray icon: image is empty')
            // 尝试直接使用路径
            this.tray = new Tray(iconPath)
            console.log('Tray icon loaded from PNG file using direct path')
          }
        } else {
          console.error('PNG tray icon file not found:', iconPath)
          // 尝试使用app.ico
          if (require('electron').app.isPackaged) {
            iconPath = path.join(process.resourcesPath, 'app.asar', 'public', 'app.ico')
            if (!fs.existsSync(iconPath)) {
              iconPath = path.join(process.resourcesPath, 'public', 'app.ico')
            }
          } else {
            iconPath = path.join(app.getAppPath(), 'public', 'app.ico')
          }

          console.log('Trying tray icon path (ICO):', iconPath)

          if (fs.existsSync(iconPath)) {
            console.log('ICO tray icon file exists, trying to load...')
            // 尝试使用nativeImage.createFromPath()方法加载图标
            const icon = nativeImage.createFromPath(iconPath)
            if (!icon.isEmpty()) {
              this.tray = new Tray(icon)
              console.log('Tray icon loaded from ICO file using nativeImage')
            } else {
              console.error('Failed to load ICO tray icon: image is empty')
              // 尝试直接使用路径
              this.tray = new Tray(iconPath)
              console.log('Tray icon loaded from ICO file using direct path')
            }
          } else {
            console.error('ICO tray icon file not found:', iconPath)
            // 在生产环境中，尝试使用应用可执行文件作为图标
            if (require('electron').app.isPackaged) {
              try {
                const icon = nativeImage.createFromPath(process.execPath)
                if (!icon.isEmpty()) {
                  this.tray = new Tray(icon)
                  console.log('Using application executable as tray icon')
                } else {
                  console.error('Failed to load application executable as icon')
                  // 创建一个简单的图标
                  const emptyIcon = nativeImage.createEmpty()
                  this.tray = new Tray(emptyIcon)
                  console.log('Using empty tray icon as last resort')
                }
              } catch (execError) {
                console.error('Error using application executable as tray icon:', execError)
                // 创建一个简单的图标
                const emptyIcon = nativeImage.createEmpty()
                this.tray = new Tray(emptyIcon)
                console.log('Using empty tray icon as last resort')
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
                    console.log('Using default Electron tray icon')
                  } else {
                    throw new Error('Default Electron icon is empty')
                  }
                } else {
                  throw new Error('Default Electron icon not found')
                }
              } catch (defaultError) {
                console.error('Error loading default tray icon:', defaultError)
                // 创建一个简单的图标
                const emptyIcon = nativeImage.createEmpty()
                this.tray = new Tray(emptyIcon)
                console.log('Using empty tray icon as last resort')
              }
            }
          }
        }
      } catch (iconError) {
        console.error('Error loading tray icon from file:', iconError)
        // 备用方案：创建一个简单的图标
        try {
          const emptyIcon = nativeImage.createEmpty()
          this.tray = new Tray(emptyIcon)
          console.log('Using empty tray icon as last resort')
        } catch (fallbackError) {
          console.error('Error creating empty tray icon:', fallbackError)
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
      console.log('Tray created successfully')
    } catch (error) {
      console.error('Error creating tray:', error)
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
