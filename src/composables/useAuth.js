/*
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-04-13 10:25:53
 * @LastEditTime: 2026-04-15 15:52:08
 * @LastEditors: hui.chenn
 */
/*
 * @Author: hui.chenn
 * @Description: 认证相关 Composable - 提供登录、登出、token管理等功能
 * @Date: 2026-04-13
 * @LastEditTime: 2026-04-13
 * @LastEditors: hui.chenn
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login as loginApi } from '../api'
import { isDev } from '../config/env.js'

// 认证状态（全局共享）
const isAuthenticated = ref(false)
const userInfo = ref(null)
const token = ref('')

/**
 * useAuth Composable
 * 提供认证相关的功能，包括登录、登出、token管理等
 * @returns {Object} 认证功能对象
 */
export function useAuth() {
  const router = useRouter()

  /**
   * 用户登录
   * @param {string} username - 用户名
   * @param {string} password - 密码
   * @returns {Promise<{success: boolean, message?: string}>} 登录结果
   */
  const login = async (username, password) => {
    try {
      const response = await loginApi({
        appId:"PORTAL",
        clientId:"Tineco",
        code:true,
        uid: username.trim(),
        password: password.trim()
      })

      // 检查登录结果
      if (response && response.code === 200 && response.data?.access_token) {
        // 保存认证信息
        token.value = response.data.access_token
        userInfo.value = response.data
        isAuthenticated.value = true

        // 保存到 localStorage
        localStorage.setItem('token', response.data.access_token)
        localStorage.setItem('userName', username.trim())
        localStorage.setItem('userInfo', JSON.stringify(response.data))
        localStorage.setItem('app_environment', isDev ? 'development' : 'production')

        // 启动定时任务
        startScheduledTask()

        return { success: true }
      } else {
        return {
          success: false,
          message: response?.message || '登录失败，请检查用户名和密码'
        }
      }
    } catch (error) {
      return {
        success: false,
        message: '登录过程中出现错误，请稍后重试'
      }
    }
  }

  /**
   * 用户登出
   * @param {boolean} redirect - 是否重定向到登录页
   */
  const logout = (redirect = true) => {
    // 清除状态
    isAuthenticated.value = false
    userInfo.value = null
    token.value = ''

    // 清除 localStorage（保留 rememberedUsername / rememberedPassword，
    // 登出不应清除【记住我】的凭据，只有用户取消勾选时才清除）
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('userName')
    localStorage.removeItem('app_environment')

    // 停止定时任务
    stopScheduledTask()

    // 重定向到登录页
    if (redirect) {
      router.push('/login')
    }
  }

  /**
   * 检查认证状态
   * @returns {boolean} 是否已认证
   */
  const checkAuth = () => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      token.value = storedToken
      isAuthenticated.value = true

      const storedUserInfo = localStorage.getItem('userInfo')
      if (storedUserInfo) {
        try {
          userInfo.value = JSON.parse(storedUserInfo)
        } catch (e) {
        }
      }
      // 启动定时任务
      startScheduledTask()

      return true
    }
    return false
  }

  /**
   * 启动定时任务
   */
  const startScheduledTask = () => {
    if (typeof window !== 'undefined' && window.scheduledTaskAPI) {
      window.scheduledTaskAPI.start().catch((error) => {
      })
    }
  }

  /**
   * 停止定时任务
   */
  const stopScheduledTask = () => {
    if (typeof window !== 'undefined' && window.scheduledTaskAPI) {
      window.scheduledTaskAPI.stop().catch((error) => {
      })
    }
  }

  /**
   * 获取存储的记住的用户信息
   * @returns {{username: string, password: string} | null}
   */
  const getRememberedCredentials = () => {
    const rememberedUsername = localStorage.getItem('rememberedUsername')
    const rememberedPassword = localStorage.getItem('rememberedPassword')
    if (rememberedUsername && rememberedPassword) {
      return {
        username: rememberedUsername,
        password: rememberedPassword
      }
    }
    return null
  }

  /**
   * 保存记住的用户信息
   * @param {string} username - 用户名
   * @param {string} password - 密码
   */
  const saveRememberedCredentials = (username, password) => {
    localStorage.setItem('rememberedUsername', username)
    localStorage.setItem('rememberedPassword', password)
  }

  /**
   * 清除记住的用户信息
   */
  const clearRememberedCredentials = () => {
    localStorage.removeItem('rememberedUsername')
    localStorage.removeItem('rememberedPassword')
  }

  /**
   * 获取Token
   * @returns {string} token
   */
  const getToken = () => {
    return token.value || localStorage.getItem('token') || ''
  }

  return {
    isAuthenticated,
    userInfo,
    token,
    login,
    logout,
    checkAuth,
    getRememberedCredentials,
    saveRememberedCredentials,
    clearRememberedCredentials,
    getToken
  }
}

/**
 * 检查应用环境是否发生变更
 * 用于检测安装包切换（测试版/正式版）时环境是否一致
 * @returns {boolean} 环境是否一致（true=一致或首次登录，false=不一致）
 */
export function checkEnvironmentChange() {
  const storedEnv = localStorage.getItem('app_environment')
  const currentEnv = isDev ? 'development' : 'production'

  // 没有存储的环境信息，可能是首次使用或旧版本
  if (!storedEnv) {
    // 如果已有登录状态，记录当前环境
    if (localStorage.getItem('token')) {
      localStorage.setItem('app_environment', currentEnv)
    }
    return true
  }

  return storedEnv === currentEnv
}

/**
 * 强制清除所有认证相关状态（不依赖 Vue Router）
 * 用于应用启动时环境不一致的场景
 */
export function clearAllAuthState() {
  isAuthenticated.value = false
  userInfo.value = null
  token.value = ''

  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  localStorage.removeItem('userName')
  localStorage.removeItem('app_environment')
  // 注意：不清除 rememberedUsername / rememberedPassword，
  // 【记住我】的凭据不应随认证状态一起被清除
}
