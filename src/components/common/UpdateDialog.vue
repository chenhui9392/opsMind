<!--
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-03-30 09:03:05
 * @LastEditTime: 2026-03-30 09:03:12
 * @LastEditors: hui.chenn
-->
<!--
 * @Author: hui.chenn
 * @Description: 应用更新对话框组件
 * @Date: 2026-03-27 17:15:00
 * @LastEditTime: 2026-03-27 17:15:00
 * @LastEditors: hui.chenn
-->
<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="visible" class="update-dialog-overlay" @click="handleOverlayClick">
        <div class="update-dialog" @click.stop>
          <!-- 对话框头部 -->
          <div class="dialog-header">
            <div class="header-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
              </svg>
            </div>
            <h3 class="header-title">发现新版本</h3>
            <button v-if="!forceUpdate" class="close-btn" @click="handleCancel">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
              </svg>
            </button>
          </div>

          <!-- 对话框内容 -->
          <div class="dialog-content">
            <div class="version-info">
              <div class="version-row">
                <span class="version-label">当前版本：</span>
                <span class="version-value current">{{ currentVersion }}</span>
              </div>
              <div class="version-row">
                <span class="version-label">最新版本：</span>
                <span class="version-value latest">{{ latestVersion }}</span>
              </div>
            </div>

            <!-- 更新说明 -->
            <div v-if="releaseNotes" class="release-notes">
              <div class="notes-title">更新内容：</div>
              <div class="notes-content">{{ releaseNotes }}</div>
            </div>

            <!-- 文件大小信息 -->
            <div v-if="fileSize" class="file-size-info">
              <span>文件大小：{{ formatFileSize(fileSize) }}</span>
            </div>

            <!-- 强制更新提示 -->
            <div v-if="forceUpdate" class="force-update-tip">
              <span class="tip-icon">!</span>
              <span>此版本为重要更新，建议立即升级</span>
            </div>
          </div>

          <!-- 对话框底部 -->
          <div class="dialog-footer">
            <button 
              v-if="!forceUpdate" 
              class="btn btn-cancel" 
              @click="handleCancel"
              :disabled="downloading"
            >
              取消
            </button>
            <button 
              class="btn btn-confirm" 
              @click="handleConfirm"
              :disabled="downloading"
            >
              <span v-if="!downloading">立即更新</span>
              <span v-else class="btn-loading">
                <span class="loading-spinner"></span>
                下载中...
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
export default {
  name: 'UpdateDialog',
  props: {
    // 是否显示对话框
    visible: {
      type: Boolean,
      default: false
    },
    // 当前版本号
    currentVersion: {
      type: String,
      default: ''
    },
    // 最新版本号
    latestVersion: {
      type: String,
      default: ''
    },
    // 更新说明
    releaseNotes: {
      type: String,
      default: ''
    },
    // 下载链接
    downloadUrl: {
      type: String,
      default: ''
    },
    // 文件大小（字节）
    fileSize: {
      type: Number,
      default: 0
    },
    // 是否强制更新
    forceUpdate: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      downloading: false
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.downloading = false
        // 禁止背景滚动
        document.body.style.overflow = 'hidden'
      } else {
        // 恢复背景滚动
        document.body.style.overflow = ''
      }
    }
  },
  beforeUnmount() {
    // 组件卸载时恢复背景滚动
    document.body.style.overflow = ''
  },
  methods: {
    /**
     * 处理确认更新
     */
    handleConfirm() {
      if (!this.downloadUrl) {
        console.error('下载链接为空')
        this.$emit('error', '下载链接为空')
        return
      }

      this.downloading = true
      this.$emit('confirm', {
        downloadUrl: this.downloadUrl,
        version: this.latestVersion
      })

      // 延迟关闭对话框，给用户反馈时间
      setTimeout(() => {
        this.downloading = false
        this.$emit('update:visible', false)
      }, 500)
    },

    /**
     * 处理取消/关闭
     */
    handleCancel() {
      if (this.forceUpdate) {
        // 强制更新模式下不允许取消
        return
      }
      this.$emit('cancel')
      this.$emit('update:visible', false)
    },

    /**
     * 处理遮罩层点击
     */
    handleOverlayClick() {
      if (!this.forceUpdate) {
        this.handleCancel()
      }
    },

    /**
     * 格式化文件大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的文件大小
     */
    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '未知'
      
      const units = ['B', 'KB', 'MB', 'GB']
      let size = bytes
      let unitIndex = 0
      
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024
        unitIndex++
      }
      
      return `${size.toFixed(2)} ${units[unitIndex]}`
    }
  }
}
</script>

<style scoped>
/* 遮罩层 */
.update-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(2px);
}

/* 对话框主体 */
.update-dialog {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: dialog-slide-in 0.3s ease;
}

@keyframes dialog-slide-in {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 对话框头部 */
.dialog-header {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  position: relative;
}

.header-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.header-icon svg {
  width: 24px;
  height: 24px;
}

.header-title {
  flex: 1;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.close-btn svg {
  width: 18px;
  height: 18px;
  color: #fff;
}

/* 对话框内容 */
.dialog-content {
  padding: 24px;
}

.version-info {
  margin-bottom: 20px;
}

.version-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.version-label {
  color: #666;
  font-size: 14px;
  width: 80px;
}

.version-value {
  font-size: 14px;
  font-weight: 500;
}

.version-value.current {
  color: #999;
}

.version-value.latest {
  color: #667eea;
  font-weight: 600;
}

/* 更新说明 */
.release-notes {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.notes-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.notes-content {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* 文件大小信息 */
.file-size-info {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}

/* 强制更新提示 */
.force-update-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 13px;
  color: #856404;
}

.tip-icon {
  width: 18px;
  height: 18px;
  background: #f39c12;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

/* 按钮样式 */
.btn {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  outline: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #e9ecef;
  color: #666;
}

.btn-cancel:hover:not(:disabled) {
  background: #dee2e6;
}

.btn-confirm {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.btn-confirm:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 加载动画 */
.btn-loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 过渡动画 */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-active .update-dialog,
.dialog-fade-leave-active .update-dialog {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.dialog-fade-enter-from .update-dialog,
.dialog-fade-leave-to .update-dialog {
  opacity: 0;
  transform: translateY(-30px) scale(0.95);
}
</style>
