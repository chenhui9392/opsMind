const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron')
const path = require('path')
const os = require('os')

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
    console.log('Loading Vite dev server at http://localhost:5175')
    mainWindow.loadURL('http://localhost:5175')
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
    const iconPath = path.join(__dirname, 'public', 'app.ico')
    tray = new Tray(iconPath)

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
})
