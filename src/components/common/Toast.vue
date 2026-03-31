<template>
  <transition name="toast-fade">
    <div v-if="visible" class="toast" :class="type">
      <div class="toast-content">
        <span class="toast-icon" v-if="type === 'success'">✓</span>
        <span class="toast-icon" v-else-if="type === 'error'">✗</span>
        <span class="toast-icon" v-else-if="type === 'warning'">!</span>
        <span class="toast-icon" v-else>ℹ</span>
        <span class="toast-message">{{ message }}</span>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue'

// 响应式数据
const visible = ref(false)
const message = ref('')
const type = ref('info')
const duration = ref(3000)
const timer = ref(null)

/**
 * 显示提示
 * @param {string} msg - 消息内容
 * @param {string} msgType - 消息类型
 * @param {number} msgDuration - 显示时长
 */
const show = (msg, msgType = 'info', msgDuration = 3000) => {
  message.value = msg
  type.value = msgType
  duration.value = msgDuration
  visible.value = true

  if (timer.value) {
    clearTimeout(timer.value)
  }

  timer.value = setTimeout(() => {
    hide()
  }, duration.value)
}

/**
 * 隐藏提示
 */
const hide = () => {
  visible.value = false
}

/**
 * 显示成功提示
 * @param {string} msg - 消息内容
 * @param {number} msgDuration - 显示时长
 */
const success = (msg, msgDuration) => {
  show(msg, 'success', msgDuration)
}

/**
 * 显示错误提示
 * @param {string} msg - 消息内容
 * @param {number} msgDuration - 显示时长
 */
const error = (msg, msgDuration) => {
  show(msg, 'error', msgDuration)
}

/**
 * 显示警告提示
 * @param {string} msg - 消息内容
 * @param {number} msgDuration - 显示时长
 */
const warning = (msg, msgDuration) => {
  show(msg, 'warning', msgDuration)
}

/**
 * 显示信息提示
 * @param {string} msg - 消息内容
 * @param {number} msgDuration - 显示时长
 */
const info = (msg, msgDuration) => {
  show(msg, 'info', msgDuration)
}

// 暴露方法给父组件
defineExpose({
  show,
  hide,
  success,
  error,
  warning,
  info
})
</script>

<style scoped>
.toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  padding: 12px 24px;
  border-radius: 8px;
  background-color: #333;
  color: #fff;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 80%;
  word-wrap: break-word;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toast-icon {
  font-size: 16px;
  font-weight: bold;
  flex-shrink: 0;
}

.toast-message {
  line-height: 1.4;
}

.toast.success {
  background-color: #4caf50;
}

.toast.error {
  background-color: #ff4757;
}

.toast.warning {
  background-color: #ff9800;
}

.toast.info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.toast-fade-enter-to,
.toast-fade-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
</style>
