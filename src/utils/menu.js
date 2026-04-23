const { Menu, app } = require('electron');

// 创建中文菜单栏
function createMenu(isDev = false) {
  // 视图菜单的子菜单
  const viewSubmenu = [
    {
      label: '刷新',
      accelerator: 'CmdOrCtrl+R',
      click: function(item, focusedWindow) {
        if (focusedWindow) {
          focusedWindow.reload();
        }
      }
    },
    {
      label: '切换全屏',
      accelerator: process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11',
      click: function(item, focusedWindow) {
        if (focusedWindow) {
          focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
        }
      }
    }
  ];

  // 开发环境显示开发者工具
  if (isDev) {
    viewSubmenu.push({
      label: '开发者工具',
      accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
      click: function(item, focusedWindow) {
        if (focusedWindow) {
          focusedWindow.webContents.toggleDevTools();
        }
      }
    });
  }

  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: function() {
            app.quit();
          }
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        {
          label: '撤销',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: '重做',
          accelerator: 'CmdOrCtrl+Y',
          role: 'redo'
        },
        { type: 'separator' },
        {
          label: '剪切',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: '复制',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: '粘贴',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: '全选',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectAll'
        }
      ]
    },
    {
      label: '视图',
      submenu: viewSubmenu
    },
    {
      label: '窗口',
      submenu: [
        {
          label: '最小化',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: '关闭',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: function() {
            // 可以添加关于对话框
          }
        }
      ].concat(isDev ? [
        { type: 'separator' },
        {
          label: '【开发者模式】',
          enabled: false
        }
      ] : [])
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = { createMenu };
