/*
 * @Author: hui.chenn
 * @Description: 路由配置
 * @Date: 2026-03-31 09:30:00
 * @LastEditTime: 2026-05-06 13:41:20
 * @LastEditors: hui.chenn
 */
import { createRouter, createWebHashHistory } from 'vue-router'
import chatView from '../views/chatView.vue'
import floatingBall from '../views/floatingBall.vue'
import LoginPage from '../views/LoginPage.vue'
import { checkEnvironmentChange, clearAllAuthState } from '../composables/useAuth'

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
  },
  {
    path: '/floating-ball',
    name: 'floatingBall',
    component: floatingBall,
    meta: { public: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

/**
 * 路由守卫 - 认证检查
 * 在应用启动时检查是否存在有效的身份验证token
 * 同时检测安装包环境是否变更，防止测试版/正式版切换后使用错误的认证状态
 */
router.beforeEach((to, from, next) => {
  // 优先检测环境一致性
  // 当安装包环境变更时，强制清除登录状态并跳转到登录页
  if (!checkEnvironmentChange()) {
    clearAllAuthState()
    if (to.path !== '/login') {
      next('/login')
      return
    }
    // 已在登录页，正常放行
  }

  // 检查是否需要认证
  const requiresAuth = to.meta?.requiresAuth

  // 检查是否是公开页面
  const isPublicPage = to.meta?.public

  // 从 localStorage 获取 token
  const token = localStorage.getItem('token')

  // 如果访问需要认证的页面但没有 token，重定向到登录页
  if (requiresAuth && !token) {
    next('/login')
    return
  }

  // 如果已登录但访问登录页，重定向到首页
  if (to.path === '/login' && token) {
    next('/')
    return
  }

  // 其他情况正常放行
  next()
})

export default router
