<!--
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-03-25 20:32:54
 * @LastEditTime: 2026-03-25 20:33:07
 * @LastEditors: hui.chenn
-->
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

<script>
export default {
  name: 'Toast',
  data() {
    return {
      visible: false,
      message: '',
      type: 'info',
      duration: 3000,
      timer: null
    }
  },
  methods: {
    show(message, type = 'info', duration = 3000) {
      this.message = message
      this.type = type
      this.duration = duration
      this.visible = true

      if (this.timer) {
        clearTimeout(this.timer)
      }

      this.timer = setTimeout(() => {
        this.hide()
      }, this.duration)
    },
    hide() {
      this.visible = false
    },
    success(message, duration) {
      this.show(message, 'success', duration)
    },
    error(message, duration) {
      this.show(message, 'error', duration)
    },
    warning(message, duration) {
      this.show(message, 'warning', duration)
    },
    info(message, duration) {
      this.show(message, 'info', duration)
    }
  }
}
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
