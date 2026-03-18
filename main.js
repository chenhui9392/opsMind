const { app, BrowserWindow } = require('electron')
const path = require('path')
const { createMenu } = require('./src/utils/menu')

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadFile('dist/index.html')
}

app.whenReady().then(() => {
  createWindow()
  createMenu()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
