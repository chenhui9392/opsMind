<template>
  <div
    class="message"
    :class="{ 'message-user': message.sender === 'user', 'message-bot': message.sender === 'bot' || message.sender === 'resolve-status' }"
  >
    <!-- 机器人头像 -->
    <div class="message-avatar" v-if="message.sender === 'bot' || message.sender === 'resolve-status'">
      <div class="avatar-icon bot-avatar">
        <img :src="dolphinImg" alt="AI助手" class="bot-avatar-img" />
      </div>
    </div>
    <!-- 用户头像 -->
    <div class="message-avatar user-avatar-wrapper" v-if="message.sender === 'user'">
      <div class="avatar-icon user-avatar">
        <img :src="userAvatarImg" class="bot-avatar-img"/>
      </div>
    </div>
    <div class="message-wrapper">
      <!-- 表单信息渲染（当 hasFull=true 时） -->
      <A2UIForm
        v-if="message.hasFull && message.formInfo"
        :form-info="message.formInfo"
        :has-full="message.hasFull"
        :raw-content="message.rawContent"
        :order-status="message.orderStatus"
        :order-type-actual="message.orderTypeActual"
        :is-last-a2-u-i-form="isLastA2UIForm"
        @form-submit="handleFormSubmit"
        @submit-success="handleSubmitSuccess"
      />

      <!-- 消息内容 -->
      <div class="message-content" v-if="message.text">
        <!-- 文本 -->
        <div class="message-text">
          <MarkdownRenderer :content="message.text" />
        </div>
      </div>
      <!-- 图片 -->
      <div v-if="message.images && message.images.length > 0" class="message-images">
        <img
          v-for="(image, imgIndex) in message.images"
          :key="imgIndex"
          :src="image"
          class="message-image"
          @click="handleImageClick(image, imgIndex)"
        />
      </div>

      <!-- 文件 -->
      <div v-if="message.files && message.files.length > 0" class="message-files">
        <div
          v-for="(file, fileIndex) in message.files"
          :key="'file_' + fileIndex"
          class="file-item"
          @click="handleFileClick(file)"
        >
          <div class="file-icon" :class="getFileIconClass(file.name)">{{ getFileIcon(file.name) }}</div>
          <div class="file-name">{{ file.name }}</div>
          <div class="file-download-icon">⬇</div>
        </div>
      </div>

      <!-- 是否已解决卡片 -->
      <div v-if="message.sender === 'resolve-status'" class="resolve-status-wrapper">
        <ResolveStatusCard
          :disabled="message.resolved"
          :conversation-id="conversationId"
          :feedback-record="message.feedbackRecord"
          @resolved="handleResolved"
          @unresolved="handleUnresolved"
        />
      </div>

      <!-- 消息底部：时间和复制按钮 -->
      <div class="message-footer" v-if="message.sender !== 'resolve-status'">
        <span class="message-time">{{ formattedTime }}</span>
        <!-- 复制按钮 -->
        <button
          v-if="message.text && message.sender === 'bot'"
          class="copy-btn"
          @click="handleCopy"
          title="复制"
        >
          <el-icon :size="12">
            <CopyDocument />
          </el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import MarkdownRenderer from '../common/MarkdownRenderer.vue'
import SvgIcon from '../../assets/svg/SvgIcon.vue'
import { CopyDocument } from '@element-plus/icons-vue'
import A2UIForm from './A2UIForm.vue'
import dolphinImg from '../../assets/dolphin.png'
import userAvatarImg from '../../assets/user_avatar.png'
import ResolveStatusCard from '../common/ResolveStatusCard.vue'

// Props
const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  conversationId: {
    type: String,
    default: ''
  },
  isLastA2UIForm: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['image-click', 'file-click', 'form-submit', 'submit-success', 'resolved', 'unresolved'])

// 响应式数据
const copySuccess = ref(false)
const copyTimer = ref(null)



/**
 * 格式化时间，只显示时分
 */
const formattedTime = computed(() => {
  if (!props.message.time) return ''
  // 如果时间是 HH:mm 格式，直接返回
  if (/^\d{2}:\d{2}$/.test(props.message.time)) {
    return props.message.time
  }
  // 尝试解析时间字符串
  try {
    const date = new Date(props.message.time)
    if (!isNaN(date.getTime())) {
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes}`
    }
  } catch (e) {
    // 解析失败，返回原始时间
  }
  return props.message.time
})

// 方法
const handleImageClick = (image, index) => {
  emit('image-click', image, props.message.images, index)
}

const handleFileClick = (file) => {
  emit('file-click', file)
}

/**
 * 处理表单提交事件
 */
const handleFormSubmit = (eventName) => {
  emit('form-submit', eventName)
}

/**
 * 处理表单提交成功事件
 */
const handleSubmitSuccess = (payload) => {
  emit('submit-success', payload)
}

/**
 * 处理已解决点击
 */
const handleResolved = () => {
  emit('resolved')
}

/**
 * 处理未解决点击
 */
const handleUnresolved = () => {
  emit('unresolved')
}

const getFileIcon = (fileName) => {
  const extension = fileName.toLowerCase().split('.').pop()
  switch (extension) {
    case 'pdf':
      return '📄'
    case 'xlsx':
    case 'xls':
      return '📊'
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return '🖼️'
    default:
      return '📄'
  }
}

const getFileIconClass = (fileName) => {
  const extension = fileName.toLowerCase().split('.').pop()
  return `file-icon-${extension}`
}

/**
 * 处理复制消息内容
 */
const handleCopy = async () => {
  if (!props.message.text) return

  try {
    await navigator.clipboard.writeText(props.message.text)
    copySuccess.value = true

    // 清除之前的定时器
    if (copyTimer.value) {
      clearTimeout(copyTimer.value)
    }

    // 2秒后恢复按钮状态
    copyTimer.value = setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
    // 降级方案：使用传统的复制方法
    const textarea = document.createElement('textarea')
    textarea.value = props.message.text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      copySuccess.value = true
      copyTimer.value = setTimeout(() => {
        copySuccess.value = false
      }, 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
    document.body.removeChild(textarea)
  }
}
</script>

<style scoped>
.message {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
}

.message-user {
  align-self: flex-end;
  flex-direction: row-reverse;
  align-items: flex-end;
}

.message-bot {
  align-self: flex-start;
  flex-direction: row;
  align-items: flex-start;
}

/* 表单容器样式 */
.message-form-container {
  padding: 16px;
  border-radius: 18px;
  margin-bottom: 8px;
  background-color: #F8FAFC;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 4px;
  max-width: 100%;
  min-width: 300px;
}

/* 修复 a2ui 组件图标样式被全局样式覆盖的问题 */
.message-form-container ::v-deep(.card-header-box) {
  box-sizing: content-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-form-container ::v-deep(.card-header-icon) {
  display: block;
  max-width: none;
  max-height: none;
}

/* 表单提交 loading 遮罩 */
.form-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 18px;
  gap: 12px;
}

.form-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.form-loading-text {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.message-avatar {
  margin-right: 10px;
  margin-top: 0;
  align-self: flex-start;
}

.message-user .user-avatar-wrapper {
  margin-right: 0;
  margin-left: 10px;
}

.avatar-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

/* 机器人头像样式 - 使用 app.png 图片 */
.avatar-icon.bot-avatar {
  overflow: hidden;
}

.avatar-icon.bot-avatar:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: scale(1.05);
  transition: all 0.2s ease;
}

.bot-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-content {
  padding: 12px 10px;
  border-radius: 18px;
  margin-bottom: 4px;
  word-wrap: break-word;
}

.message-bot .message-content {
  background-color: #F3F5FA;
  border: 1px solid #e0e0e0;
  border-radius: 2px 12px 12px 12px;
}

.message-user .message-content {
  background-color: #EEF2FF;
  color: #1f2937;
  border: 1px solid #CED7FE;
  border-radius: 12px 4px 12px 12px;
}

.message-user .message-text {
  color: #1f2937;
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
  color: #333;
  /* margin-bottom: 8px; */
}

/* 图片消息 */
.message-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  background: transparent;
  border: none;
  padding: 0;
}

.message-user .message-images {
  justify-content: flex-end;
}

.message-bot .message-images {
  justify-content: flex-start;
}

.message-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.message-image:hover {
  transform: scale(1.05);
}

/* 文件消息 */
.message-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  background: transparent;
  border: none;
  padding: 0;
}

.message-user .message-files {
  justify-content: flex-end;
}

.message-bot .message-files {
  justify-content: flex-start;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-item:hover {
  background-color: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.file-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.file-icon-pdf {
  color: #e74c3c;
}

.file-icon-xlsx,
.file-icon-xls {
  color: #27ae60;
}

.file-icon-jpg,
.file-icon-jpeg,
.file-icon-png,
.file-icon-gif {
  color: #3498db;
}

.file-name {
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  max-width: 220px;
}

.file-download-icon {
  font-size: 14px;
  color: #666;
  flex-shrink: 0;
  transition: color 0.3s ease;
}

.file-item:hover .file-download-icon {
  color: #673ab7;
  transform: translateY(-1px);
}

.message-wrapper {
  flex: 1;
}

.message-footer {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-top: 8px;
  gap: 12px;
}

.message-time {
  font-size: 12px;
  color: #999;
}

.message-user .message-footer {
  flex-direction: row-reverse;
}

/* 复制按钮样式 */
.copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  background-color: transparent;
  color: #c0c0c0;
  cursor: pointer;
  transition: color 0.2s ease;
  margin-left: 6px;
  padding: 0;
  vertical-align: middle;
}

.copy-btn:hover {
  color: #666;
}

.copy-btn :deep(.el-icon) {
  width: 12px;
  height: 12px;
}


</style>
