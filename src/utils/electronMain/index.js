const { app, BrowserWindow, session } = require('electron')
const path = require('path')
const fs = require('fs')

// 导入模块
const windowManager = require('./modules/windowManager')
const trayManager = require('./modules/trayManager')
const floatingBallManager = require('./modules/floatingBallManager')
const ipcHandler = require('./modules/ipcHandler')

/**
 * 检查是否为 development 环境
 * 1. 未打包的应用是开发环境
 * 2. 已打包但存在 .env-mode 文件且内容为 development
 * @returns {boolean}
 */
const checkIsDevelopmentEnv = () => {
  // 未打包的应用
  if (!app.isPackaged) {
    return true
  }

  // 已打包的应用，检查标记文件
  try {
    const envModePath = path.join(process.resourcesPath, 'app.asar', 'dist', '.env-mode')
    if (fs.existsSync(envModePath)) {
      const mode = fs.readFileSync(envModePath, 'utf-8').trim()
      return mode === 'development'
    }
  } catch (error) {
    console.log('Error checking env mode file:', error)
  }

  return false
}

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
    const mainWindow = windowManager.getMainWindow()
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// 构建正确的menu模块路径
const menuPath = path.join(__dirname, '..', 'menu.js')
const { createMenu } = require(menuPath)

// 获取系统用户名
const getSystemUsername = () => {
  try {
    return require('os').userInfo().username
  } catch (error) {
    console.error('Error getting system username:', error)
    return 'unknown'
  }
}

// 应用准备就绪
app.whenReady().then(() => {
  console.log('System username:', getSystemUsername())
  
  // 禁用跨域限制 (CORS)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // 检查是否已存在Access-Control-Allow-Origin头
    const hasCorsHeader = Object.keys(details.responseHeaders).some(key => 
      key.toLowerCase() === 'access-control-allow-origin'
    )
    
    if (!hasCorsHeader) {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Access-Control-Allow-Origin': ['*']
        }
      })
    } else {
      // 保持原有的CORS头
      callback({ responseHeaders: details.responseHeaders })
    }
  })
  
  // 判断是否为开发环境
  const isDev = checkIsDevelopmentEnv()
  console.log('Is development environment:', isDev)

  // 创建窗口
  windowManager.createWindow()

  // 创建菜单（开发环境显示开发者工具和开发者模式标识）
  createMenu(isDev)

  // 创建托盘
  trayManager.createTray(
    () => windowManager.showMainWindow(),
    () => {
      app.quitting = true
      app.quit()
    }
  )

  // 创建悬浮球
  floatingBallManager.createFloatingBall(isDev)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      windowManager.createWindow()
    }
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// 防止应用完全退出
app.on('before-quit', () => {
  app.quitting = true
  // 清理所有窗口
  floatingBallManager.destroyFloatingBall()
  windowManager.destroyMainWindow()
  trayManager.destroyTray()
})

module.exports = {
  windowManager,
  trayManager,
  floatingBallManager,
  ipcHandler
}
