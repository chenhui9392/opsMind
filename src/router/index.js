/*
 * @Author: hui.chenn
 * @Description:
 * @Date: 2026-03-31 09:36:12
 * @LastEditTime: 2026-03-31 09:36:22
 * @LastEditors: hui.chenn
 */
/*
 * @Author: hui.chenn
 * @Description: 路由配置
 * @Date: 2026-03-31 09:30:00
 * @LastEditTime: 2026-03-31 09:50:00
 * @LastEditors: hui.chenn
 */
import { createRouter, createWebHashHistory } from 'vue-router'
import chatView from '../page/ChatView.vue'
import floatingBall from '../page/floatingBall.vue'

const routes = [
  {
    path: '/',
    name: 'chatView',
    component: chatView
  },
  {
    path: '/floating-ball',
    name: 'floatingBall',
    component: floatingBall
  }

]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
