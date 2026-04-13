<template>
  <div
    class="message"
    :class="{ 'message-user': message.sender === 'user', 'message-bot': message.sender === 'bot' }"
  >
    <div class="message-avatar" v-if="message.sender === 'bot'">
      <div class="avatar-icon">🤖</div>
    </div>
    <div class="message-wrapper">
      <!-- 消息内容 -->
      <div class="message-content" v-if="message.text">
        <!-- 文本 -->
        <div class="message-text markdown-body" v-html="renderedText"></div>
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

      <!-- 消息底部：时间和复制按钮 -->
      <div class="message-footer">
        <span class="message-time">{{ formattedTime }}</span>
        <!-- 复制按钮 -->
        <button
          v-if="message.text && message.sender === 'bot'"
          class="copy-btn"
          @click="handleCopy"
          title="复制"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import SvgIcon from '../../assets/svg/SvgIcon.vue'

// 配置 marked 选项
marked.setOptions({
  breaks: true,
  gfm: true,
  sanitize: false
})

// Props
const props = defineProps({
  message: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['image-click', 'file-click'])

// 响应式数据
const copySuccess = ref(false)
const copyTimer = ref(null)

// 计算属性
const renderedText = computed(() => {
  if (!props.message.text) return ''
  const textStr = String(props.message.text)
  const escapedText = textStr.replace(/</g, '&lt;')
  return marked(escapedText)
})

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

.message-avatar {
  margin-right: 10px;
  margin-top: 4px;
}

.message-content {
  padding: 12px 16px;
  border-radius: 18px;
  margin-bottom: 4px;
  word-wrap: break-word;
}

.message-bot .message-content {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 4px;
}

.message-user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
  border-bottom-right-radius: 4px;
}

.message-user .message-text {
  color: #ffffff;
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
  color: #333;
  margin-bottom: 8px;
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
  max-width: 80%;
}

.message-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

/* Markdown样式 */
.markdown-body {
  font-size: 14px;
  line-height: 1.6;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  margin-top: 20px;
  margin-bottom: 10px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body h1 {
  font-size: 2em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-body h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-body h3 {
  font-size: 1.25em;
}

.markdown-body h4 {
  font-size: 1em;
}

.markdown-body h5 {
  font-size: 0.875em;
}

.markdown-body h6 {
  font-size: 0.85em;
  color: #6a737d;
}

.markdown-body p {
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body li {
  margin-top: 0.25em;
}

.markdown-body code {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.85em;
  padding: 0.2em 0.4em;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
}

.markdown-body pre {
  background-color: #f6f8fa;
  border-radius: 3px;
  padding: 16px;
  overflow: auto;
  font-size: 0.85em;
  line-height: 1.45;
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body pre code {
  background-color: transparent;
  padding: 0;
}

.markdown-body a {
  color: #0366d6;
  text-decoration: none;
}

.markdown-body a:hover {
  text-decoration: underline;
}

.markdown-body blockquote {
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
  margin: 0 0 16px 0;
}

.markdown-body table {
  border-collapse: collapse;
  margin-bottom: 16px;
  width: 100%;
  overflow: auto;
  display: block;
}

.markdown-body table th {
  font-weight: 600;
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
  background-color: #f6f8fa;
}

.markdown-body table td {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

.markdown-body table tr {
  background-color: #ffffff;
  border-top: 1px solid #c6cbd1;
}

.markdown-body table tr:nth-child(2n) {
  background-color: #f6f8fa;
}
</style>
