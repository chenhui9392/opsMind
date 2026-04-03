<!--
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-03-31 14:37:29
 * @LastEditTime: 2026-03-31 14:37:35
 * @LastEditors: hui.chenn
-->
# AIT Claw - 运维智能助手

## 1. 项目概述

AIT Claw 是一款基于 Vue 3 和 Electron 开发的桌面端运维智能助手应用。它集成了智能聊天、工单管理、悬浮球快捷操作等功能，旨在提升运维人员的工作效率。

### 主要功能

- **智能聊天**: 与 AI 助手进行实时对话，获取运维相关的智能建议
- **工单管理**: 查看和处理运维工单，支持历史记录查询
- **悬浮球**: 桌面悬浮快捷入口，快速唤起应用
- **自动更新**: 支持应用自动检测和下载更新

---

## 2. 技术栈

### 核心技术

| 技术 | 版本 | 用途 |
|------|------|------|
| [Vue](https://vuejs.org/) | ^3.5.30 | 前端框架，使用 Composition API |
| [Electron](https://www.electronjs.org/) | ^41.0.2 | 桌面应用框架 |
| [Vite](https://vitejs.dev/) | ^6.4.1 | 构建工具，支持热更新 |
| [Pinia](https://pinia.vuejs.org/) | ^3.0.4 | 状态管理 |
| [Vue Router](https://router.vuejs.org/) | ^4.6.4 | 路由管理 |

### 其他依赖

- **marked** (^17.0.4) - Markdown 渲染
- **crypto-js** (^4.2.0) - 加密工具

### 开发工具

- **@vitejs/plugin-vue** (^5.2.4) - Vite Vue 插件
- **electron-builder** (^26.8.1) - Electron 打包工具
- **terser** (^5.46.1) - 代码压缩

---

## 3. 项目结构

```
opsmind/
├── .lingma/                    # Lingma AI 配置
│   ├── agents/                 # AI Agent 配置
│   ├── rules/                  # 规则配置
│   └── skills/                 # AI Skills
├── build/                      # 构建脚本
│   └── afterPack.js            # 打包后处理脚本
├── dist/                       # 构建输出目录 (Vite 生成)
├── public/                     # 静态资源
│   ├── app.png                 # 应用图标
│   ├── app-512.png             # 大尺寸图标
│   └── floating-ball.html      # 悬浮球页面
├── release/                    # Electron 打包输出
├── src/                        # 源代码
│   ├── api/                    # API 接口封装
│   │   └── index.js
│   ├── assets/                 # 资源文件
│   │   └── svg/                # SVG 图标组件
│   ├── components/             # Vue 组件
│   │   ├── chat/               # 聊天相关组件
│   │   ├── common/             # 通用组件
│   │   └── order/              # 工单相关组件
│   ├── config/                 # 配置文件
│   │   ├── env.js              # 环境配置
│   │   ├── systemModuleData.js # 系统模块数据
│   │   └── updateConfig.js     # 更新配置
│   ├── mock/                   # 模拟数据
│   ├── page/                   # 页面组件
│   │   ├── ChatView.vue        # 聊天主页面
│   │   └── FloatingBall.vue    # 悬浮球组件
│   ├── router/                 # 路由配置
│   │   └── index.js
│   ├── services/               # 业务逻辑服务
│   │   ├── chatMessageService.js
│   │   ├── messageService.js
│   │   └── updateService.js
│   ├── stores/                 # Pinia 状态管理
│   │   └── index.js
│   ├── utils/                  # 工具函数
│   │   ├── electronMain/       # Electron 主进程模块
│   │   │   ├── modules/
│   │   │   │   ├── floatingBallManager.js
│   │   │   │   ├── ipcHandler.js
│   │   │   │   ├── trayManager.js
│   │   │   │   └── windowManager.js
│   │   │   └── index.js
│   │   ├── md5.js
│   │   ├── menu.js
│   │   ├── messageUtils.js
│   │   ├── request.js          # HTTP 请求封装
│   │   ├── resizeHandler.js
│   │   ├── socketService.js    # WebSocket 服务
│   │   └── system.js
│   ├── App.vue                 # 根组件
│   ├── main.js                 # Vue 入口
│   └── style.css               # 全局样式
├── .env.development            # 开发环境变量
├── .env.production             # 生产环境变量
├── index.html                  # HTML 模板
├── main.js                     # Electron 主进程入口
├── package.json                # 项目配置
├── preload.js                  # Electron 预加载脚本
└── vite.config.js              # Vite 配置
```

### 关键文件说明

| 文件 | 说明 |
|------|------|
| `main.js` | Electron 主进程入口，负责窗口管理、系统托盘、IPC 通信等 |
| `preload.js` | 预加载脚本，安全地暴露 Electron API 给渲染进程 |
| `index.html` | 应用主页面模板 |
| `vite.config.js` | Vite 构建配置 |

---

## 4. 开发环境配置

### 系统要求

- **Node.js**: >= 18.0.0 (推荐 20.x LTS)
- **npm**: >= 9.0.0 或 **yarn**: >= 1.22.0
- **操作系统**: Windows 10/11, macOS, Linux

### 安装 Node.js

```bash
# 使用 nvm 安装 (推荐)
nvm install 20
nvm use 20

# 验证安装
node -v  # v20.x.x
npm -v   # 10.x.x
```

---

## 5. 安装和运行

### 5.1 安装依赖

```bash
# 克隆项目后，进入项目目录
cd opsmind

# 安装依赖
npm install

# 或使用 yarn
yarn install
```

### 5.2 开发模式运行

```bash
# 启动 Vite 开发服务器
npm run dev

# 或
yarn dev
```

应用将自动在默认浏览器中打开，地址为 `http://localhost:5173`

### 5.3 以 Electron 模式运行

```bash
# 先构建前端资源，然后启动 Electron
npm run build:dev
npm run electron:dev

# 或使用组合命令
npm run build:dev ; npm run electron:dev
```

### 5.4 生产模式预览

```bash
# 以生产模式构建并运行
npm run dev:prod
```

---

## 6. 构建和打包

### 6.1 前端构建

```bash
# 开发环境构建
npm run build:dev

# 生产环境构建
npm run build:prod

# 或简写
npm run build
```

构建输出位于 `dist/` 目录。

### 6.2 Electron 打包

```bash
# 完整打包流程（构建 + 打包）
npm run electron:build

# 开发环境打包
npm run electron:build:dev

# 生产环境打包
npm run electron:build:prod

npm run mac:build - 打包并签名
npm run mac:notarize - 公证已打包应用
npm run mac:all - 完整流程（打包+签名+公证）
```

打包输出位于 `release/` 目录：
- `AIT Claw Setup 0.0.1.exe` - Windows 安装包
- `win-unpacked/` - 未打包的可执行文件

### 6.3 打包配置

打包配置位于 `package.json` 的 `build` 字段：

```json
{
  "build": {
    "appId": "com.opsmin.app",
    "productName": "AIT Claw",
    "directories": {
      "output": "release"
    },
    "win": {
      "target": "nsis"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
}
```

---

## 7. 主要功能模块

### 7.1 聊天模块 (`src/components/chat/`)

| 组件 | 功能 |
|------|------|
| `Chat.vue` | 聊天主容器 |
| `ChatContent.vue` | 聊天内容区 |
| `ChatHeader.vue` | 聊天头部 |
| `ChatInput.vue` | 消息输入框 |
| `MessageItem.vue` | 单条消息 |
| `MessageList.vue` | 消息列表 |

### 7.2 工单模块 (`src/components/order/`)

| 组件 | 功能 |
|------|------|
| `OrderHeader.vue` | 工单头部 |
| `OrderItemList.vue` | 工单项列表 |
| `OrderList.vue` | 工单列表 |

### 7.3 通用组件 (`src/components/common/`)

| 组件 | 功能 |
|------|------|
| `FileUploader.vue` | 文件上传 |
| `ImagePreview.vue` | 图片预览 |
| `MessagePopup.vue` | 消息弹窗 |
| `SearchBox.vue` | 搜索框 |
| `Toast.vue` | 轻提示 |
| `UpdateDialog.vue` | 更新对话框 |

### 7.4 Electron 主进程模块

| 模块 | 功能 |
|------|------|
| `floatingBallManager.js` | 悬浮球窗口管理 |
| `ipcHandler.js` | IPC 通信处理 |
| `trayManager.js` | 系统托盘管理 |
| `windowManager.js` | 主窗口管理 |

---

## 8. API 接口说明

### 8.1 API 封装位置

API 接口统一封装在 `src/api/index.js` 和 `src/utils/request.js`。

### 8.2 请求方式

```javascript
// 使用封装的 request 方法
import request from '@/utils/request.js'

// GET 请求
request.get('/api/users', { params: { id: 1 } })

// POST 请求
request.post('/api/users', { name: '张三' })
```

### 8.3 WebSocket 通信

项目使用 `socketService.js` 封装 WebSocket 连接，用于实时消息推送：

```javascript
import socketService from '@/utils/socketService.js'

// 连接 WebSocket
socketService.connect(url)

// 发送消息
socketService.send(data)

// 监听消息
socketService.onMessage((data) => {
  console.log('收到消息:', data)
})
```

---

## 9. 配置文件说明

### 9.1 环境变量文件

| 文件 | 用途 |
|------|------|
| `.env.development` | 开发环境配置 |
| `.env.production` | 生产环境配置 |

### 9.2 环境变量示例

```bash
# .env.development
VITE_APP_TITLE=AIT Claw Dev
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
```

### 9.3 其他配置文件

| 文件 | 说明 |
|------|------|
| `src/config/env.js` | 运行时环境配置 |
| `src/config/updateConfig.js` | 自动更新配置 |
| `src/config/systemModuleData.js` | 系统模块静态数据 |

---

## 10. 部署说明

### 10.1 本地开发部署

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
```

### 10.2 生产环境构建

```bash
# 1. 构建生产版本
npm run build:prod

# 2. 打包 Electron 应用
npm run electron:build:prod
```

### 10.3 发布流程

1. **更新版本号**: 修改 `package.json` 中的 `version` 字段
2. **构建打包**: 执行 `npm run electron:build:prod`
3. **分发安装包**: 将 `release/AIT Claw Setup x.x.x.exe` 分发给用户
4. **配置自动更新**: 确保 `updateConfig.js` 中的更新服务器地址正确

### 10.4 自动更新配置

在 `src/config/updateConfig.js` 中配置更新服务器：

```javascript
export const updateConfig = {
  server: 'https://your-update-server.com',
  channel: 'latest',
  autoDownload: true,
  autoInstallOnAppQuit: true
}
```

---

## 11. 开发规范

### 11.1 代码风格

- 使用 Vue 3 Composition API (`<script setup>` 语法)
- 组件名使用 PascalCase
- 组合式函数使用 `useXxx` 命名
- Props 使用 camelCase

### 11.2 提交规范

```bash
feat: 新功能
fix: 修复问题
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

---

## 12. 常见问题

### Q: 安装依赖时 Electron 下载失败？

A: 配置 Electron 镜像源：

```bash
npm config set electron_mirror https://npmmirror.com/mirrors/electron/
```

### Q: 打包时提示缺少依赖？

A: 确保已安装所有依赖：

```bash
npm install
```

### Q: 开发模式下热更新不生效？

A: 检查 Vite 配置中的 `server.hmr` 设置，确保端口未被占用。

---

## 13. 许可证

[ISC](LICENSE)

---

## 14. 联系方式

如有问题或建议，请提交 Issue 或联系项目维护者。
