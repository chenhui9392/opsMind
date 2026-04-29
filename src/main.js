import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
// Element Plus 按需导入样式通过 unplugin-vue-components 自动处理
// A2UI 引擎内部基于 Element Plus 封装，引入完整样式确保组件渲染一致
import 'element-plus/dist/index.css'
import A2UIPlugin from 'a2ui-vue-engine'
import 'a2ui-vue-engine/style.css'
import './style.css'

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(A2UIPlugin)
app.mount('#app')
