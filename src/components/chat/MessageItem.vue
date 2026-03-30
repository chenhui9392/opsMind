<!--
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-03-30 14:50:49
 * @LastEditTime: 2026-03-30 14:50:57
 * @LastEditors: hui.chenn
-->
<template>
  <div
    class="message"
    :class="{ 'message-user': message.sender === 'user', 'message-bot': message.sender === 'bot' }"
  >
    <div class="message-avatar" v-if="message.sender === 'bot'">
      <div class="avatar-icon">🤖</div>
    </div>
    <div>
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
      <!-- 时间 -->
      <div class="message-time">{{ message.time }}</div>
    </div>
  </div>
</template>

<script>
import { marked } from 'marked'

// 配置 marked 选项
marked.setOptions({
  breaks: true,
  gfm: true,
  sanitize: false
})

export default {
  name: 'MessageItem',
  props: {
    message: {
      type: Object,
      required: true
    }
  },
  emits: ['image-click', 'file-click'],
  computed: {
    renderedText() {
      if (!this.message.text) return ''
      const textStr = String(this.message.text)
      const escapedText = textStr.replace(/</g, '&lt;')
      return marked(escapedText)
    }
  },
  methods: {
    handleImageClick(image, index) {
      this.$emit('image-click', image, this.message.images, index)
    },
    handleFileClick(file) {
      this.$emit('file-click', file)
    },
    getFileIcon(fileName) {
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
    },
    getFileIconClass(fileName) {
      const extension = fileName.toLowerCase().split('.').pop()
      return `file-icon-${extension}`
    }
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

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  text-align: right;
}

.message-user .message-time {
  text-align: right;
}

.message-bot .message-time {
  text-align: left;
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
