const { app, BrowserWindow, ipcMain } = require('electron')
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

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      devTools: true
    }
  })

  mainWindow.loadFile('dist/index.html')
  mainWindow.webContents.openDevTools() // 自动打开开发者工具
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

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
