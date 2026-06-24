const { app, BrowserWindow, session, protocol, net, globalShortcut } = require('electron')
const path = require('path')
const fs = require('fs')

// 注册 app:// 自定义协议（必须在 app.ready 之前）
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
])

/**
 * 获取应用环境模式
 * @returns {'development'|'beta'|'production'} 环境模式
 */
const getAppEnvMode = () => {
  // 未打包的应用返回 development
  if (!app.isPackaged) {
    return 'development'
  }

  // 已打包的应用，检查标记文件
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
 * 检查是否为开发/测试环境（用于菜单栏显示开发者工具）
 * @returns {boolean}
 */
const checkIsDevelopmentEnv = () => {
  const envMode = getAppEnvMode()
  return envMode === 'development' || envMode === 'beta'
}

/**
 * 获取应用名称（根据环境不同）
 * @returns {string} 应用名称
 */
const getAppName = () => {
  const envMode = getAppEnvMode()
  if (envMode === 'development') {
    return '海豚Dev'
  } else if (envMode === 'beta') {
    return '海豚Beta'
  }
  return '海豚'
}

/**
 * 设置应用用户数据目录（根据环境不同）
 * Dev 和 Beta 版本使用独立的数据目录，避免与正式版冲突
 */
const setupUserDataDir = () => {
  const envMode = getAppEnvMode()

  if (envMode === 'development') {
    // Dev 版本使用独立的数据目录
    const userDataPath = path.join(app.getPath('appData'), '海豚Dev')
    app.setPath('userData', userDataPath)
    console.log('[Dev] 用户数据目录设置为:', userDataPath)
  } else if (envMode === 'beta') {
    // Beta 版本使用独立的数据目录
    const userDataPath = path.join(app.getPath('appData'), '海豚Beta')
    app.setPath('userData', userDataPath)
    console.log('[Beta] 用户数据目录设置为:', userDataPath)
  }

  return envMode
}

// 在 app.ready 之前设置用户数据目录
const appEnvMode = setupUserDataDir()

// 确保只运行同一环境的单个应用实例（Dev、Beta 和正式版可以同时运行）
const appIdMap = {
  development: 'com.opsmin.dev',
  beta: 'com.opsmin.beta',
  production: 'com.opsmin.app'
}
const appId = appIdMap[appEnvMode]
const gotTheLock = app.requestSingleInstanceLock({ key: appId })

if (!gotTheLock) {
  app.quit()
  process.exit(0)
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // 当同一个环境的第二个实例启动时，显示/恢复主窗口
    const mainWindow = windowManager.getMainWindow()
    if (mainWindow) {
      if (!mainWindow.isVisible()) {
        mainWindow.show()
      }
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
    }
  })
}

// 导入模块
const windowManager = require('./modules/windowManager')
const trayManager = require('./modules/trayManager')
const floatingBallManager = require('./modules/floatingBallManager')
const ipcHandler = require('./modules/ipcHandler')
const scheduledTaskManager = require('./modules/scheduledTaskManager')
const screenshotManager = require('./modules/screenshotManager')

// 构建正确的menu模块路径
const menuPath = path.join(__dirname, '..', 'menu.js')
const { createMenu } = require(menuPath)

// 获取系统用户名
const getSystemUsername = () => {
  try {
    return require('os').userInfo().username
  } catch (error) {
    return 'unknown'
  }
}

// 应用准备就绪
app.whenReady().then(() => {
  // 注册 app:// 协议处理器
  protocol.handle('app', (request) => {
    const { pathname } = new URL(request.url)
    let filePath = path.join(app.getAppPath(), pathname)

    // public 目录资源构建后位于 dist/ 下，对根路径做 fallback
    if (!fs.existsSync(filePath) && !pathname.startsWith('/dist/')) {
      const distPath = path.join(app.getAppPath(), 'dist', pathname)
      if (fs.existsSync(distPath)) {
        filePath = distPath
      }
    }

    try {
      const data = fs.readFileSync(filePath)
      const ext = path.extname(filePath).toLowerCase()
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'font/otf'
      }
      const contentType = mimeTypes[ext] || 'application/octet-stream'
      return new Response(data, {
        headers: { 'Content-Type': contentType }
      })
    } catch (error) {
      console.error('[Protocol] 读取文件失败:', filePath, error.message)
      return new Response('Not Found', { status: 404 })
    }
  })


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

  // 判断是否为开发/测试环境（显示开发者工具）
  const isDev = checkIsDevelopmentEnv()

  // 获取应用名称（根据环境不同）
  const appName = getAppName()

  // 创建窗口（传入应用名称作为窗口标题）
  windowManager.createWindow(appName)

  // 创建菜单（开发/测试环境显示开发者工具和环境标识）
  createMenu(isDev, appEnvMode)

  // 创建托盘（传入应用名称）
  trayManager.createTray(
    () => windowManager.showMainWindow(),
    () => {
      app.quitting = true
      app.quit()
    },
    appName
  )

  // 创建悬浮球（使用 app.isPackaged 判断是否为开发模式，避免 beta 环境误用 localhost）
  floatingBallManager.createFloatingBall(!app.isPackaged)

  // 将主窗口引用传递给截图管理器
  screenshotManager.setMainWindow(windowManager.getMainWindow())

  // 注册全局快捷键 Alt+A 触发截图（应用未聚焦时也能触发）
  try {
    const registered = globalShortcut.register('Alt+A', () => {
      console.log('[GlobalShortcut] Alt+A 触发截图')
      screenshotManager.startCapture().catch((err) => {
        console.error('[GlobalShortcut] 截图失败:', err)
      })
    })
    if (!registered) {
      console.warn('[GlobalShortcut] Alt+A 注册失败，可能被其他应用占用')
    } else {
      console.log('[GlobalShortcut] Alt+A 已注册')
    }
  } catch (err) {
    console.error('[GlobalShortcut] 注册异常:', err)
  }

  // 在主窗口内监听键盘事件作为备选（防止 globalShortcut 注册失败或被屏蔽时无法使用）
  const mainWindow = windowManager.getMainWindow()
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // input.type === 'keyDown'，alt 按下且键为 a
      if (input.type === 'keyDown' && input.alt && !input.control && !input.shift && !input.meta) {
        const key = (input.key || '').toLowerCase()
        if (key === 'a') {
          event.preventDefault()
          console.log('[BeforeInputEvent] Alt+A 触发截图')
          screenshotManager.startCapture().catch((err) => {
            console.error('[BeforeInputEvent] 截图失败:', err)
          })
        }
      }
    })
  }

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
  // 注销全局快捷键
  try {
    globalShortcut.unregisterAll()
  } catch (err) {
    // ignore
  }
  // 关闭开发者工具
  windowManager.closeDevTools()
  // 停止定时任务
  scheduledTaskManager.stop()
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
