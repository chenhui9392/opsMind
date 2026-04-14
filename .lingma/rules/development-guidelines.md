---
trigger: always_on
---
# AIT Claw 开发规范文档

本文档定义了 AIT Claw 项目的开发规范和最佳实践。

---

## 1. 项目结构规范

### 1.1 目录结构

```
src/
├── api/                    # API 接口定义
├── assets/                 # 静态资源
│   └── svg/               # SVG 图标
├── components/             # Vue 组件
│   ├── chat/              # 聊天组件
│   ├── common/            # 通用组件
│   └── order/             # 工单组件
├── composables/            # 组合式函数
├── config/                 # 配置文件
├── mock/                   # Mock 数据
├── router/                 # 路由配置
├── services/               # 业务服务层
├── stores/                 # Pinia 状态管理
├── utils/                  # 工具函数
├── views/                  # 页面级组件
├── App.vue
├── main.js
└── style.css
```

### 1.2 目录用途

| 目录 | 用途 | 示例 |
|------|------|------|
| `api/` | 后端 API 接口封装 | `login()`, `sendChatMessage()` |
| `assets/` | 静态资源 | SVG 图标 |
| `components/` | 可复用组件 | `Chat.vue`, `OrderList.vue` |
| `composables/` | 组合式函数 | `useAuth.js` |
| `config/` | 配置文件 | `env.js` |
| `router/` | 路由配置 | `index.js` |
| `services/` | 业务逻辑层 | `messageService.js` |
| `stores/` | 状态管理 | `index.js` |
| `utils/` | 工具函数 | `request.js` |
| `views/` | 页面组件 | `LoginPage.vue` |

---

## 2. 组件使用与引用规则

### 2.1 组件使用优先级

在开发过程中，组件的选择应遵循以下优先级：

1. **第一优先级：Element Plus 标准组件**
   - 优先使用 Element Plus 组件库提供的标准组件
   - 确保功能一致性的同时提升维护性
   - 示例：`el-button`、`el-input`、`el-dialog`、`el-upload`、`el-image-viewer` 等

2. **第二优先级：项目自定义组件**
   - 当 Element Plus 无法满足特定业务需求时，使用 `src/components/` 目录下的自定义组件
   - 复用已有的业务组件，避免重复开发
   - 示例：`OrderList.vue`、`ChatHeader.vue`、`BottomToolbar.vue` 等

3. **第三优先级：创建新自定义组件**
   - 当前两者均无法满足需求时，创建新的自定义组件
   - 新组件应遵循项目的组件开发规范，放置在合适的目录下
   - 组件创建后应在团队内共享，便于后续复用

### 2.2 命名规范

- **单文件组件**：PascalCase
  - `LoginPage.vue`, `ChatHeader.vue`
- **组件目录**：kebab-case
  - `chat/`, `common/`, `order/`

### 2.2 导入示例

```javascript
// 页面导入组件
import OrderList from '../components/order/OrderList.vue'
import Chat from '../components/chat/Chat.vue'

// 子组件导入同级组件
import ChatInput from './ChatInput.vue'

// 导入通用组件
import Toast from '../common/Toast.vue'
```

### 2.3 路径规范

| 场景 | 路径写法 |
|------|----------|
| 页面导入组件 | `../components/{模块}/{Component}.vue` |
| 组件导入同级 | `./{Component}.vue` |
| 导入其他模块 | `../{模块}/{Component}.vue` |
| 导入工具 | `../utils/{util}` |

---

## 3. SVG 图标管理规范

### 3.1 存放位置

```
src/assets/svg/
├── IconPaths.js      # 图标路径定义
├── SvgIcon.vue       # SVG 组件
└── index.js          # 导出文件
```

### 3.2 使用方式

```vue
<template>
  <SvgIcon name="send" />
  <SvgIcon name="upload" :width="24" :height="24" />
  <SvgIcon name="refresh" color="#1890ff" />
</template>

<script setup>
import SvgIcon from '../assets/svg/SvgIcon.vue'
</script>
```

### 3.3 注册新图标

在 `IconPaths.js` 中添加：

```javascript
export const IconPaths = {
  iconName: {
    paths: ['M12 2...', 'M2 17...'],
    viewBox: '0 0 24 24'
  }
}
```

---

## 4. 图片资源管理规范

| 目录 | 用途 | 引用方式 |
|------|------|----------|
| `public/` | 静态图片（图标、Logo） | `<img src="/app.png" />` |
| `src/assets/images/` | 组件内部图片 | `import img from '../assets/images/x.png'` |

---

## 5. 路由配置规范

### 5.1 路由定义

```javascript
// src/router/index.js
const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { public: true }
  },
  {
    path: '/',
    name: 'chatView',
    component: chatView,
    meta: { requiresAuth: true }
  }
]
```

### 5.2 路由守卫

```javascript
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }
  next()
})
```

---

## 6. API 调用规范

### 6.1 API 封装

```javascript
// src/api/index.js
export const login = (params) => {
  return post(`${API_BASE_URL}/api/auth/login`, params)
}

export const sendChatMessage = (params, signal) => {
  return post(`${API_BASE_URL}/api/chat`, params, signal)
}
```

### 6.2 使用方式

```javascript
import { login } from '../api'

const result = await login({ username, password })
```

---

## 7. Vue 3 开发规范

### 7.1 使用 Composition API

```vue
<script setup>
import { ref, reactive, computed, onMounted } from 'vue'

const count = ref(0)
const user = reactive({ name: '' })
const double = computed(() => count.value * 2)

const increment = () => count.value++

onMounted(() => {
  console.log('mounted')
})
</script>
```

### 7.2 组件命名

- 页面组件：`LoginPage.vue`, `chatView.vue`
- 功能组件：`ChatHeader.vue`, `OrderList.vue`
- 通用组件：`Toast.vue`, `SearchBox.vue`

### 7.3 Props 定义

```javascript
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  }
})
```

---

## 8. 代码风格规范

### 8.1 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `LoginPage.vue` |
| JS 文件 | camelCase | `useAuth.js` |
| 常量 | UPPER_SNAKE_CASE | `API_BASE_URL` |
| 变量/函数 | camelCase | `getUserInfo()` |
| 类 | PascalCase | `MessageService` |
| 组合式函数 | useXxx | `useAuth()` |

### 8.2 注释规范

**文件头注释：**
```javascript
/*
 * @Author: hui.chenn
 * @Description: 功能描述
 * @Date: 2026-04-13
 */
```

**函数注释：**
```javascript
/**
 * 功能描述
 * @param {Type} name - 说明
 * @returns {Type} - 说明
 */
```

---

## 9. 开发命令

```bash
npm run dev              # 开发模式
npm run build            # 生产构建
npm run electron:dev     # Electron 开发
npm run electron:build   # Electron 打包
```

---

## 附录：常用路径速查

| 目标 | 路径 |
|------|------|
| 组件 | `../components/{module}/{Component}.vue` |
| API | `../api` |
| 工具 | `../utils/{util}` |
| SVG 组件 | `../assets/svg/SvgIcon.vue` |
| Composable | `../composables/{name}` |
| Service | `../services/{service}` |
