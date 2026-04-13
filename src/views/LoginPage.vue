<!--
 * @Author: hui.chenn
 * @Description:
 * @Date: 2026-04-13 10:27:53
 * @LastEditTime: 2026-04-13 10:28:11
 * @LastEditors: hui.chenn
-->
<!--
 * @Author: hui.chenn
 * @Description: 登录页面
 * @Date: 2026-04-13
 * @LastEditTime: 2026-04-13
 * @LastEditors: hui.chenn
-->
<template>
  <div class="login-container">
    <!-- 装饰性背景元素 - 右上角 -->
    <div class="bg-decoration bg-decoration-top"></div>
    <!-- 装饰性背景元素 - 左下角 -->
    <div class="bg-decoration bg-decoration-bottom"></div>

    <!-- 登录卡片 -->
    <div class="login-wrapper">
      <div class="login-card">
        <!-- 品牌区域 -->
        <div class="brand-section">
          <!-- Logo 图标 -->
          <div class="logo-container">
            <span class="logo-icon">🐬</span>
          </div>
          <!-- 品牌名称 -->
          <h1 class="brand-title">AIT Claw</h1>
          <!-- 副标题 -->
          <p class="brand-subtitle">欢迎回来，请登录您的账号</p>
        </div>

        <!-- 登录表单 -->
        <form @submit.prevent="handleLogin" class="login-form">
          <!-- 用户名输入框 -->
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input
              v-model="form.username"
              type="text"
              autocomplete="username"
              placeholder="请输入用户名"
              class="form-input"
              :class="{ 'input-error': errors.username }"
            />
          </div>

          <!-- 密码输入框 -->
          <div class="form-group">
            <label class="form-label">密码</label>
            <div class="password-wrapper">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="请输入密码"
                class="form-input password-input"
                :class="{ 'input-error': errors.password }"
              />
              <!-- 密码显示/隐藏切换按钮 -->
              <button
                type="button"
                class="password-toggle"
                @click="showPassword = !showPassword"
              >
                <!-- 眼睛图标（显示密码时） -->
                <SvgIcon
                  v-if="showPassword"
                  name="eye"
                  :width="20"
                  :height="20"
                  color="#94a3b8"
                  className="eye-icon"
                />
                <!-- 眼睛关闭图标（隐藏密码时） -->
                <SvgIcon
                  v-else
                  name="eyeOff"
                  :width="20"
                  :height="20"
                  color="#94a3b8"
                  className="eye-icon"
                />
              </button>
            </div>
          </div>

          <!-- 记住我复选框 -->
          <div class="remember-section">
            <label class="checkbox-wrapper">
              <input
                v-model="form.rememberMe"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-custom">
                <SvgIcon
                  v-if="form.rememberMe"
                  name="check"
                  :width="12"
                  :height="12"
                  color="#ffffff"
                  className="check-icon"
                />
              </span>
              <span class="checkbox-label">记住我</span>
            </label>
          </div>

          <!-- 登录按钮 -->
          <button
            type="submit"
            class="login-button"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="loading-wrapper">
              <SvgIcon
                name="spinner"
                :width="20"
                :height="20"
                color="#ffffff"
                className="loading-spinner"
              />
              登录中...
            </span>
            <span v-else>登录</span>
          </button>
        </form>
      </div>
    </div>

    <!-- Toast 提示组件 -->
    <Toast ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import Toast from '../components/common/Toast.vue'
import SvgIcon from '../assets/svg/SvgIcon.vue'

// 路由
const router = useRouter()

// useAuth composable
const { login, getRememberedCredentials, saveRememberedCredentials, clearRememberedCredentials } = useAuth()

// Toast 引用
const toastRef = ref(null)

// 表单数据
const form = reactive({
  username: '',
  password: '',
  rememberMe: false
})

// 错误信息
const errors = reactive({
  username: false,
  password: false
})

// 状态
const showPassword = ref(false)
const isLoading = ref(false)

/**
 * 显示错误提示
 * @param {string} message - 错误消息
 */
const showError = (message) => {
  if (toastRef.value) {
    toastRef.value.error(message)
  }
}

/**
 * 验证表单
 * @returns {boolean} 验证是否通过
 */
const validateForm = () => {
  // 重置错误状态
  errors.username = false
  errors.password = false

  let isValid = true

  // 验证用户名
  if (!form.username.trim()) {
    errors.username = true
    showError('请输入用户名')
    isValid = false
  }

  // 验证密码
  if (!form.password.trim()) {
    errors.password = true
    if (isValid) {
      showError('请输入密码')
    }
    isValid = false
  }

  return isValid
}

/**
 * 处理登录
 */
const handleLogin = async () => {
  // 表单验证
  if (!validateForm()) {
    return
  }

  // 设置加载状态
  isLoading.value = true

  try {
    // 调用登录方法
    const result = await login(form.username, form.password)

    if (result.success) {
      // 处理"记住我"逻辑
      if (form.rememberMe) {
        saveRememberedCredentials(form.username, form.password)
      } else {
        clearRememberedCredentials()
      }

      // 登录成功，跳转到首页
      router.push('/')
    } else {
      // 登录失败，显示错误提示
      showError(result.message || '登录失败，请检查用户名和密码')
    }
  } catch (err) {
    console.error('登录错误:', err)
    showError('登录过程中出现错误，请稍后重试')
  } finally {
    // 重置加载状态
    isLoading.value = false
  }
}

/**
 * 初始化 - 加载记住的用户信息
 */
onMounted(() => {
  const credentials = getRememberedCredentials()
  if (credentials) {
    form.username = credentials.username
    form.password = credentials.password
    form.rememberMe = true
  }
})
</script>

<style scoped>
/* 登录容器 */
.login-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, #f8fafc, #ffffff, #f1f5f9);
  position: relative;
  overflow: hidden;
}

/* 装饰性背景元素 */
.bg-decoration {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
}

.bg-decoration-top {
  top: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
}

.bg-decoration-bottom {
  bottom: -80px;
  left: -80px;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, transparent 70%);
}

/* 登录包装器 */
.login-wrapper {
  width: 100%;
  max-width: 420px;
  padding: 0 24px;
  position: relative;
  z-index: 10;
}

/* 登录卡片 */
.login-card {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(226, 232, 240, 0.6);
  padding: 40px 32px;
}

/* 品牌区域 */
.brand-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-container {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
}

.logo-icon {
  font-size: 32px;
  line-height: 1;
}

.brand-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}

.brand-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

/* 登录表单 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 表单组 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
  color: #1e293b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input::placeholder {
  color: #94a3b8;
}

.form-input:focus {
  background: #ffffff;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input.input-error {
  border-color: #fca5a5;
  background: #fef2f2;
}

.form-input.input-error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* 密码输入框包装器 */
.password-wrapper {
  position: relative;
}

.password-input {
  padding-right: 44px;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #94a3b8;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-toggle:hover {
  color: #64748b;
}

.eye-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* SvgIcon 悬停效果 */
.password-toggle:hover .eye-icon {
  color: #64748b;
}

/* 记住我区域 */
.remember-section {
  display: flex;
  align-items: center;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: #ffffff;
}

.checkbox-wrapper:hover .checkbox-custom {
  border-color: #9ca3af;
}

.checkbox-input:checked + .checkbox-custom {
  background: #6366f1;
  border-color: #6366f1;
}

.check-icon {
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-label {
  font-size: 14px;
  color: #4b5563;
  user-select: none;
}

.checkbox-wrapper:hover .checkbox-label {
  color: #374151;
}

/* 登录按钮 */
.login-button {
  width: 100%;
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  background: #6366f1;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2), 0 2px 4px -1px rgba(99, 102, 241, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-button:hover:not(:disabled) {
  background: #4f46e5;
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3), 0 4px 6px -2px rgba(99, 102, 241, 0.15);
  transform: translateY(-1px);
}

.login-button:active:not(:disabled) {
  background: #4338ca;
  transform: translateY(0);
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* 加载动画 */
.loading-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

.spinner-circle {
  opacity: 0.25;
}

.spinner-path {
  opacity: 0.75;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 响应式适配 */
@media (max-width: 640px) {
  .login-wrapper {
    padding: 0 16px;
  }

  .login-card {
    padding: 32px 24px;
  }

  .brand-title {
    font-size: 22px;
  }
}
</style>
