const { contextBridge, ipcRenderer } = require('electron')

// 暴露系统信息给渲染进程
contextBridge.exposeInMainWorld('systemInfo', {
  // 获取系统用户名
  getUserName: async () => {
    try {
      const username = await ipcRenderer.invoke('getSystemUsername')
      console.log('Got username from main process:', username)
      return username
    } catch (error) {
      console.error('Error getting username via IPC:', error)
      return 'unknown'
    }
  },
  // 同步获取系统用户名
  getUserNameSync: () => {
    try {
      // 使用同步 IPC 调用
      const username = ipcRenderer.sendSync('getSystemUsernameSync')
      console.log('Got username sync from main process:', username)
      return username
    } catch (error) {
      console.error('Error getting username sync via IPC:', error)
      return 'unknown'
    }
  }
})

console.log('preload.js loaded and systemInfo exposed')

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
})
