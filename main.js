const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron')
const path = require('path')
const os = require('os')
const { createMenu } = require('./src/utils/menu')

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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      devTools: true
    }
  })

  mainWindow.loadFile('dist/index.html')
  mainWindow.webContents.openDevTools() // 自动打开开发者工具

  // 关闭窗口时最小化到托盘
  mainWindow.on('close', (event) => {
    if (app.quitting) {
      mainWindow = null
    } else {
      event.preventDefault()
      mainWindow.hide()
    }
  })
}

function createTray() {
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
}

// 处理渲染进程的请求
ipcMain.handle('getSystemUsername', () => {
  return getSystemUsername()
})

// 处理同步请求
ipcMain.on('getSystemUsernameSync', (event) => {
  event.returnValue = getSystemUsername()
})

app.whenReady().then(() => {
  console.log('System username:', getSystemUsername())
  createWindow()
  createMenu()
  createTray()

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
