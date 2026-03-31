<!--
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-03-31 14:27:19
 * @LastEditTime: 2026-03-31 14:27:26
 * @LastEditors: hui.chenn
-->
---
name: vuejs-ai
description: 为 Vue 3 + Electron 项目提供智能开发辅助。用于生成 Vue 组件、处理响应式数据、管理状态、编写组合式函数、处理 IPC 通信等场景。当用户需要编写 Vue 代码、创建组件、处理 Electron 与 Vue 的交互时使用此技能。
---

# Vue.js AI Skill

## 项目技术栈

- **Vue 3**: 使用 Composition API (`<script setup>` 语法)
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **构建工具**: Vite
- **桌面端**: Electron 41
- **UI 风格**: 现代化简洁风格

## 组件开发规范

### 组件结构

```vue
<template>
  <!-- 模板内容 -->
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 1. Props 定义
const props = defineProps({
  title: {
    type: String,
    default: ''
  }
})

// 2. Emits 定义
const emit = defineEmits(['update', 'confirm'])

// 3. 响应式数据
const count = ref(0)
const message = computed(() => `Count: ${count.value}`)

// 4. 方法
const handleClick = () => {
  count.value++
  emit('update', count.value)
}

// 5. 生命周期
onMounted(() => {
  console.log('Component mounted')
})
</script>

<style scoped>
/* 组件样式 */
</style>
```

### 命名规范

- 组件文件名: PascalCase (如 `ChatMessage.vue`)
- 组合式函数: useXxx (如 `useSocket.js`)
- Props: camelCase
- 事件名: camelCase

## 状态管理 (Pinia)

### Store 结构

```javascript
// stores/userStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const userInfo = ref(null)
  const isLogin = computed(() => !!userInfo.value)

  // Actions
  const setUserInfo = (info) => {
    userInfo.value = info
  }

  return {
    userInfo,
    isLogin,
    setUserInfo
  }
})
```

## Electron IPC 通信

### 预加载脚本暴露的 API

```javascript
// preload.js 中暴露的 API
window.electronAPI = {
  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  
  // 悬浮球相关
  showFloatingBall: () => ipcRenderer.invoke('show-floating-ball'),
  hideFloatingBall: () => ipcRenderer.invoke('hide-floating-ball'),
  
  // 更新相关
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  onUpdateMessage: (callback) => ipcRenderer.on('update-message', callback)
}
```

### 在 Vue 中使用

```vue
<script setup>
const handleMinimize = async () => {
  await window.electronAPI?.minimizeWindow()
}
</script>
```

## 常用组合式函数

### 窗口大小响应

```javascript
// composables/useWindowSize.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useWindowSize() {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  const update = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  onMounted(() => window.addEventListener('resize', update))
  onUnmounted(() => window.removeEventListener('resize', update))

  return { width, height }
}
```

### 本地存储

```javascript
// composables/useLocalStorage.js
import { ref, watch } from 'vue'

export function useLocalStorage(key, defaultValue) {
  const stored = localStorage.getItem(key)
  const data = ref(stored ? JSON.parse(stored) : defaultValue)

  watch(data, (newVal) => {
    localStorage.setItem(key, JSON.stringify(newVal))
  }, { deep: true })

  return data
}
```

## 组件开发指南

### 表单组件

- 使用 `v-model` 进行双向绑定
- 提供清晰的验证错误提示
- 支持禁用状态

### 列表组件

- 支持空状态显示
- 支持加载状态
- 支持分页或无限滚动

### 弹窗组件

- 支持点击遮罩关闭（可配置）
- 支持 ESC 键关闭
- 提供打开/关闭动画

## 性能优化

1. **使用 `shallowRef` 替代 `ref`** 处理大型对象
2. **使用 `computed`** 缓存计算结果
3. **使用 `v-once`** 渲染静态内容
4. **组件懒加载**: `defineAsyncComponent`
5. **列表虚拟滚动**: 大量数据时使用

## 错误处理

```javascript
// 全局错误处理
import { onErrorCaptured } from 'vue'

onErrorCaptured((err, instance, info) => {
  console.error('组件错误:', err)
  console.error('组件实例:', instance)
  console.error('错误信息:', info)
  return false // 阻止错误继续传播
})
```

## 项目目录结构参考

```
src/
├── components/        # 公共组件
│   ├── chat/         # 聊天相关组件
│   ├── common/       # 通用组件
│   └── order/        # 工单相关组件
├── page/             # 页面组件
├── stores/           # Pinia stores
├── router/           # 路由配置
├── utils/            # 工具函数
├── api/              # API 接口
├── services/         # 业务逻辑服务
└── assets/           # 静态资源
```
