/*
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-04-13 10:25:53
 * @LastEditTime: 2026-04-13 10:26:12
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
        username: username.trim(),
        password: password.trim()
      })

      // 检查登录结果
      if (response && response.code === 200 && response.data?.token) {
        // 保存认证信息
        token.value = response.data.token
        userInfo.value = response.data
        isAuthenticated.value = true

        // 保存到 localStorage
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('userInfo', JSON.stringify(response.data))

        return { success: true }
      } else {
        return {
          success: false,
          message: response?.message || '登录失败，请检查用户名和密码'
        }
      }
    } catch (error) {
      console.error('登录失败:', error)
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

    // 清除 localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('rememberedUsername')
    localStorage.removeItem('rememberedPassword')

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
          console.error('解析用户信息失败:', e)
        }
      }
      return true
    }
    return false
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
