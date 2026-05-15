# 分环境打包说明

## 功能概述

本项目支持正式版（海豚）、测试版（海豚Beta）和开发版（海豚Dev）同时安装运行，三个版本完全隔离。

## 版本差异对比

| 配置项 | 正式版 | 测试版 (Beta) | 开发版 (Dev) |
|--------|--------|---------------|--------------|
| 应用名称 | 海豚 | 海豚Beta | 海豚Dev |
| AppId | com.opsmin.app | com.opsmin.beta | com.opsmin.dev |
| 安装目录 | D:\dolphinApp | D:\dolphinAppBeta | D:\dolphinAppDev |
| 用户数据目录 | %APPDATA%\海豚 | %APPDATA%\海豚Beta | %APPDATA%\海豚Dev |
| 桌面快捷方式 | 海豚 | 海豚Beta | 海豚Dev |
| 开始菜单 | 海豚 | 海豚Beta | 海豚Dev |
| 环境配置 | .env.production | .env.beta | .env.development |
| 输出目录 | release/ | release-beta/ | release-dev/ |
| 图标文件 | public/app.png | public/app-beta.png | public/app-dev.png |
| 菜单标识 | 无 | 【Beta版】 | 【DEV版】 |

## 图标文件说明

### 正式版图标
- 文件位置: `public/app.png`
- 格式: PNG (建议 256x256 或更大)
- 用途: Windows exe 图标、托盘图标、Mac 图标

### Beta 版图标
- 文件位置: `public/app-beta.png`
- 格式: PNG (建议 256x256 或更大)
- 用途: Windows exe 图标、托盘图标、Mac 图标
- 建议: 与正式版图标有所区别，例如添加 "Beta" 标签或使用不同颜色

### Dev 版图标
- 文件位置: `public/app-dev.png`
- 格式: PNG (建议 256x256 或更大)
- 用途: Windows exe 图标、托盘图标、Mac 图标
- 建议: 与正式版图标有所区别，例如添加 "Dev" 标签或使用不同颜色

### 图标制作建议
1. 使用相同的基础设计，保持品牌一致性
2. Dev 版本可在图标右下角添加 "Dev" 或开发标识
3. Beta 版本可在图标右下角添加 "β" 或 "Beta" 文字标识
4. 各版本可以使用不同的色调区分
5. 确保图标在各种尺寸下清晰可辨

### 临时解决方案
如果暂时没有特定版本的专用图标，系统会自动使用正式版图标作为备用。

## 构建命令

### Windows 平台

```bash
# 构建正式版
npm run electron:build:prod

# 构建 Beta 测试版
npm run electron:build:beta

# 构建 Dev 开发版
npm run electron:build:dev
```

### macOS 平台

```bash
# 构建正式版 (Mac)
npm run electron:build:mac:prod

# 构建 Beta 测试版 (Mac)
npm run electron:build:mac:beta

# 构建 Dev 开发版 (Mac)
npm run electron:build:mac:dev
```

### 开发调试

```bash
# 正式版开发模式
npm run dev

# Beta 版开发模式
npm run dev:beta

# 启动 Electron (开发环境)
npm run electron:dev
```

## 环境配置文件

项目支持三个环境配置文件：

- `.env.development` - Dev 开发调试环境
- `.env.beta` - Beta 测试环境
- `.env.production` - 生产正式环境

## 版本隔离原理

### 1. AppId 隔离
三个版本使用不同的 `appId`，Windows 注册表和 Mac 应用标识完全独立。

### 2. 用户数据目录隔离
Dev 版使用 `%APPDATA%\海豚Dev`，Beta 版使用 `%APPDATA%\海豚Beta`，都不会与正式版数据冲突。

### 3. 单实例锁隔离
应用启动时根据 `appId` 创建不同的单实例锁，三个版本可以同时运行。

### 4. 安装目录隔离
三个版本安装在不同目录，卸载时不会互相影响。

### 5. 协议注册隔离
- 正式版注册 `haitun://` 和 `opsmin://` 协议
- Beta 版注册 `haitun-beta://` 和 `opsmin-beta://` 协议
- Dev 版注册 `haitun-dev://` 和 `opsmin-dev://` 协议

## 渲染进程获取环境信息

在 Vue 组件中可以通过以下方式获取当前环境：

```javascript
// 异步获取
const envMode = await window.appEnvInfo.getEnvMode()
const appName = await window.appEnvInfo.getAppName()

// 同步获取
const envMode = window.appEnvInfo.getEnvModeSync()
const appName = window.appEnvInfo.getAppNameSync()
```

返回值：
- `envMode`: `'development'` | `'beta'` | `'production'`
- `appName`: `'海豚Dev'` | `'海豚Beta'` | `'海豚'`

## 注意事项

1. 确保在打包前准备好特定版本的图标文件
2. Dev 和 Beta 版本默认显示开发者工具菜单项
3. 自动更新功能需要分别配置不同的更新服务器地址
4. Mac 版需要使用不同的签名证书（可选）

## 文件结构

```
项目根目录/
├── public/
│   ├── app.png          # 正式版图标
│   ├── app-beta.png     # Beta 版图标 (需创建)
│   └── app-dev.png      # Dev 版图标 (需创建)
├── build/
│   ├── installer.nsh           # 正式版 NSIS 安装脚本
│   ├── installer-beta.nsh      # Beta 版 NSIS 安装脚本
│   ├── installer-dev.nsh       # Dev 版 NSIS 安装脚本
│   ├── build-env.js            # 分环境构建脚本
│   └── entitlements.mac.plist  # Mac 权限配置
├── .env.development    # Dev 环境配置
├── .env.beta           # Beta 环境配置
├── .env.production     # 正式版环境配置
├── electron-builder.prod.js   # 正式版打包配置
├── electron-builder.beta.js   # Beta 版打包配置
├── electron-builder.dev.js    # Dev 版打包配置
├── package.json        # 项目配置
├── vite.config.js      # Vite 配置
├── main.js             # Electron 主入口
└── preload.js          # 预加载脚本
```
