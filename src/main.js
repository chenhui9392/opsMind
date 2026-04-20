import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import 'element-plus/dist/index.css'
import A2UIPlugin from 'a2ui-vue-engine'
import 'a2ui-vue-engine/style.css'
import './style.css'

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(A2UIPlugin)
app.mount('#app')
