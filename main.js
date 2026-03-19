const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron')
const path = require('path')
const os = require('os')

// 确保只运行一个应用实例
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  console.log('Another instance is already running. Quitting...')
  app.quit()
  process.exit(0)
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    console.log('Second instance detected. Focusing existing window...')
    // 当第二个实例启动时，显示主窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// 构建正确的menu模块路径
const menuPath = path.join(__dirname, 'src', 'utils', 'menu.js')
const { createMenu } = require(menuPath)

// 获取系统用户名
const getSystemUsername = () => {
  try {
    return os.userInfo().username
  } catch (error) {
    console.error('Error getting system username:', error)
    return 'unknown'
  }
}

let mainWindow = null
let tray = null
let floatingBallWindow = null

function createWindow() {
  // 创建窗口
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      devTools: true
    },
    show: true,
    alwaysOnTop: true, // 确保窗口在最前面
    transparent: false, // 确保窗口不透明
    frame: true // 确保窗口有边框
  })

  // 检查是否为开发模式
  const isDev = !app.isPackaged
  console.log('Is dev mode:', isDev)
  
  if (isDev) {
    // 开发模式：加载Vite开发服务器
    console.log('Loading Vite dev server at http://localhost:5177')
    mainWindow.loadURL('http://localhost:5177')
  } else {
    // 生产模式：加载静态文件
    console.log('Loading static file at dist/index.html')
    mainWindow.loadFile('dist/index.html')
  }
  
  // 只在开发模式下打开开发者工具
  if (isDev) {
    // 打开开发者工具，方便调试，并调整位置
    const devTools = mainWindow.webContents.openDevTools({ mode: 'detach' })
  }
  
  // 监听页面加载事件
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully')
    console.log('Window visible:', mainWindow.isVisible())
    console.log('Window position:', mainWindow.getPosition())
    console.log('Window size:', mainWindow.getSize())
    
    // 确保窗口在最前面
    mainWindow.setAlwaysOnTop(true)
    mainWindow.focus()
    
    // 延迟取消alwaysOnTop，避免遮挡其他窗口
    setTimeout(() => {
      mainWindow.setAlwaysOnTop(false)
    }, 2000)
  })

  // 监听页面加载失败事件
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Page load failed:', errorCode, errorDescription)
  })

  // 关闭窗口时最小化到托盘
  mainWindow.on('close', (event) => {
    if (app.quitting) {
      mainWindow = null
    } else {
      event.preventDefault()
      mainWindow.hide()
    }
  })
  
  // 确保窗口可见
  setTimeout(() => {
    mainWindow.show()
    mainWindow.focus()
    console.log('Window forced to show after timeout')
  }, 1000)
}

function createTray() {
  try {
    // 创建托盘图标
    let iconPath
    const fs = require('fs')
    const { nativeImage } = require('electron')
    
    // 首先尝试使用app.png
    if (app.isPackaged) {
      // 生产环境：使用应用根目录下的public文件夹
      iconPath = path.join(process.resourcesPath, 'app.asar', 'public', 'app.png')
      // 如果上述路径不存在，尝试另一种可能的路径
      if (!fs.existsSync(iconPath)) {
        iconPath = path.join(process.resourcesPath, 'public', 'app.png')
      }
    } else {
      // 开发环境：使用项目根目录下的public文件夹
      iconPath = path.join(__dirname, 'public', 'app.png')
    }
    
    console.log('Trying tray icon path (PNG):', iconPath)
    
    // 尝试使用PNG文件
    try {
      if (fs.existsSync(iconPath)) {
        console.log('PNG tray icon file exists, trying to load...')
        // 尝试使用nativeImage.createFromPath()方法加载图标
        const icon = nativeImage.createFromPath(iconPath)
        if (!icon.isEmpty()) {
          tray = new Tray(icon)
          console.log('Tray icon loaded from PNG file using nativeImage')
        } else {
          console.error('Failed to load PNG tray icon: image is empty')
          // 尝试直接使用路径
          tray = new Tray(iconPath)
          console.log('Tray icon loaded from PNG file using direct path')
        }
      } else {
        console.error('PNG tray icon file not found:', iconPath)
        // 尝试使用app.ico
        if (app.isPackaged) {
          iconPath = path.join(process.resourcesPath, 'app.asar', 'public', 'app.ico')
          if (!fs.existsSync(iconPath)) {
            iconPath = path.join(process.resourcesPath, 'public', 'app.ico')
          }
        } else {
          iconPath = path.join(__dirname, 'public', 'app.ico')
        }
        
        console.log('Trying tray icon path (ICO):', iconPath)
        
        if (fs.existsSync(iconPath)) {
          console.log('ICO tray icon file exists, trying to load...')
          // 尝试使用nativeImage.createFromPath()方法加载图标
          const icon = nativeImage.createFromPath(iconPath)
          if (!icon.isEmpty()) {
            tray = new Tray(icon)
            console.log('Tray icon loaded from ICO file using nativeImage')
          } else {
            console.error('Failed to load ICO tray icon: image is empty')
            // 尝试直接使用路径
            tray = new Tray(iconPath)
            console.log('Tray icon loaded from ICO file using direct path')
          }
        } else {
          console.error('ICO tray icon file not found:', iconPath)
          // 在生产环境中，尝试使用应用可执行文件作为图标
          if (app.isPackaged) {
            try {
              const icon = nativeImage.createFromPath(process.execPath)
              if (!icon.isEmpty()) {
                tray = new Tray(icon)
                console.log('Using application executable as tray icon')
              } else {
                console.error('Failed to load application executable as icon')
                // 创建一个简单的图标
                const emptyIcon = nativeImage.createEmpty()
                tray = new Tray(emptyIcon)
                console.log('Using empty tray icon as last resort')
              }
            } catch (execError) {
              console.error('Error using application executable as tray icon:', execError)
              // 创建一个简单的图标
              const emptyIcon = nativeImage.createEmpty()
              tray = new Tray(emptyIcon)
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
                  tray = new Tray(icon)
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
              tray = new Tray(emptyIcon)
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
        tray = new Tray(emptyIcon)
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
        click: () => {
          mainWindow.show()
        }
      },
      {
        label: '退出',
        click: () => {
          app.quitting = true
          app.quit()
        }
      }
    ])

    // 设置托盘图标提示
    tray.setToolTip('运维智能助手')
    // 设置托盘菜单
    tray.setContextMenu(contextMenu)

    // 点击托盘图标显示/隐藏窗口
    tray.on('click', () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
      }
    })
    console.log('Tray created successfully')
  } catch (error) {
    console.error('Error creating tray:', error)
  }
}

function createFloatingBall() {
  try {
    // 创建悬浮球窗口
    floatingBallWindow = new BrowserWindow({
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
    floatingBallWindow.loadFile(path.join(__dirname, 'public', 'floating-ball.html'))

    // 隐藏默认菜单
    floatingBallWindow.setMenu(null)

    // 初始位置：屏幕右下角
    const { screen } = require('electron')
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    floatingBallWindow.setPosition(width - 100, height - 200)
  } catch (error) {
    console.error('Error creating floating ball:', error)
  }
}

// 处理渲染进程的请求
ipcMain.handle('getSystemUsername', () => {
  return getSystemUsername()
})

// 处理同步请求
ipcMain.on('getSystemUsernameSync', (event) => {
  event.returnValue = getSystemUsername()
})

// 处理悬浮球相关IPC事件
ipcMain.handle('getWindowPosition', (event) => {
  const position = floatingBallWindow.getPosition()
  return { x: position[0], y: position[1] }
})

ipcMain.on('updateWindowPosition', (event, pos) => {
  floatingBallWindow.setPosition(pos.x, pos.y)
})

ipcMain.on('toggleMainWindow', () => {
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
  }
})

app.whenReady().then(() => {
  console.log('System username:', getSystemUsername())
  createWindow()
  createMenu()
  createTray()
  createFloatingBall()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// 防止应用完全退出
app.on('before-quit', () => {
  app.quitting = true
  // 清理所有窗口
  if (floatingBallWindow) {
    floatingBallWindow.destroy()
    floatingBallWindow = null
  }
  if (mainWindow) {
    mainWindow.destroy()
    mainWindow = null
  }
  if (tray) {
    tray.destroy()
    tray = null
  }
})
