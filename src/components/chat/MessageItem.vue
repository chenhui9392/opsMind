<template>
  <div
    class="message"
    :class="{ 'message-user': message.sender === 'user', 'message-bot': message.sender === 'bot' }"
  >
    <!-- 机器人头像 -->
    <div class="message-avatar" v-if="message.sender === 'bot'">
      <div class="avatar-icon bot-avatar">
        <img src="/app.png" alt="AI助手" class="bot-avatar-img" />
      </div>
    </div>
    <!-- 用户头像 -->
    <div class="message-avatar user-avatar-wrapper" v-if="message.sender === 'user'">
      <div class="avatar-icon user-avatar">
        <SvgIcon name="user" width="20" height="20" />
      </div>
    </div>
    <div class="message-wrapper">
      <!-- 表单信息渲染（当 hasFull=true 时） -->
      <div v-if="message.hasFull && message.formInfo" class="message-form-container">
        <A2UIRoot
          ref="a2uiRootRef"
          @message="handleA2UIMessage"
          @complete="handleA2UIComplete"
        />
      </div>

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
          <el-icon :size="12">
            <CopyDocument />
          </el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { marked } from 'marked'
import SvgIcon from '../../assets/svg/SvgIcon.vue'
import { CopyDocument } from '@element-plus/icons-vue'
import { A2UIRoot } from 'a2ui-vue-engine'
import { submitWorkOrder } from '../../api'
import chatMessageService from '../../services/chatMessageService'

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
const emit = defineEmits(['image-click', 'file-click', 'form-submit', 'submit-success'])

// 响应式数据
const copySuccess = ref(false)
const copyTimer = ref(null)
const a2uiRootRef = ref(null)
const isSubmitting = ref(false)
const isSubmitted = ref(false)

// 计算属性
const renderedText = computed(() => {
  if (!props.message.text) return ''
  const textStr = String(props.message.text)
  const escapedText = textStr.replace(/</g, '&lt;')
  return marked(escapedText)
})

/**
 * 处理 A2UI 消息
 */
const handleA2UIMessage = async (payload) => {
  if(payload.type === 'action') {
    const eventName = payload.payload.eventName
    emit('form-submit', eventName)

    // 处理提交工单事件
    if (eventName === 'submitWorkOrder') {
      // 如果已经提交成功，不再处理
      if (isSubmitted.value) {
        return
      }

      try {
        isSubmitting.value = true

        // 获取聊天接口返回的原始 content JSON 字符串作为 submitJson
        const submitJson = props.message.rawContent
        if (!submitJson) {
          console.error('原始 content 数据不存在')
          isSubmitting.value = false
          return
        }

        // 获取当前会话信息
        const conversationId = chatMessageService.getCurrentConversationId()
        const systemName = chatMessageService.getCurrentSystemName()
        const userName = chatMessageService.getCurrentUserName()

        const result = await submitWorkOrder({
          submitJson,
          conversationId,
          systemName,
          userName
        })

        console.log('工单提交成功:', result)

        // 检查接口返回是否成功
        if (result && result.code === 200) {
          isSubmitted.value = true

          // 禁用表单提交按钮
          disableSubmitButton()

          // 通知父组件提交成功，隐藏聊天框
          emit('submit-success')
        }
      } catch (error) {
        console.error('工单提交失败:', error)
      } finally {
        isSubmitting.value = false
      }
    }
  }
}

/**
 * 禁用表单提交按钮
 * 通过更新 formInfo 中的按钮配置来禁用提交按钮
 */
const disableSubmitButton = () => {
  if (a2uiRootRef.value && props.message.formInfo) {
    try {
      // 解析当前的 formInfo
      let nodeList = props.message.formInfo
      if (typeof nodeList === 'string') {
        nodeList = JSON.parse(nodeList)
      }

      // 查找提交按钮节点并更新 disabled 属性
      const updatedNodeList = nodeList.map(node => {
        if (node.id === 'submit-btn') {
          return {
            ...node,
            disabled: true
          }
        }
        return node
      })

      // 重新渲染整个表单
      a2uiRootRef.value.processMessage({
        type: 'node',
        node: updatedNodeList
      })
    } catch (error) {
      console.error('禁用提交按钮失败:', error)
    }
  }
}

/**
 * 处理 A2UI 完成事件
 */
const handleA2UIComplete = () => {
  console.log('A2UI Complete')
}

/**
 * 处理 formInfo 渲染
 */
const processFormInfo = () => {
  if (props.message.hasFull && props.message.formInfo && a2uiRootRef.value) {
    const formInfoData = props.message.formInfo

    // 如果 formInfo 是字符串，先解析成数组
    let nodeList = formInfoData
    if (typeof formInfoData === 'string') {
      try {
        nodeList = JSON.parse(formInfoData)
      } catch (e) {
        console.error('Failed to parse formInfo:', e)
        return
      }
    }

    // 检查是否是数组
    if (Array.isArray(nodeList) && nodeList.length > 0) {
      // 如果是从历史会话进入且工单状态为【已创建】（非 DRAFT），禁用提交按钮
      const orderStatus = props.message.orderStatus
      if (orderStatus && orderStatus !== 'DRAFT') {
        nodeList = nodeList.map(node => {
          if (node.id === 'submit-btn') {
            return {
              ...node,
              disabled: true
            }
          }
          return node
        })
      }

      a2uiRootRef.value.processMessage({
        type: 'node',
        node: nodeList
      })
    }
  }
}

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

// 监听消息变化，处理 formInfo（不使用 immediate，等组件挂载后才处理）
watch(() => props.message, (newVal, oldVal) => {
  // 只在消息变化时处理，初次加载由 onMounted 处理
  if (newVal !== oldVal) {
    nextTick(() => {
      processFormInfo()
    })
  }
})

// 生命周期钩子
onMounted(() => {
  nextTick(() => {
    processFormInfo()
  })
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

/* 用户头像样式 - 紫色渐变 */
.avatar-icon.user-avatar {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
}

/* 机器人头像样式 - 使用 app.png 图片 */
.avatar-icon.bot-avatar {
  background: transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  padding: 12px 16px;
  border-radius: 18px;
  margin-bottom: 4px;
  word-wrap: break-word;
}

.message-bot .message-content {
  background-color: #F8FAFC;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 4px;
}

.message-user .message-content {
  background-color: #EEF2FF;
  color: #1f2937;
  border: 1px solid #c7d2fe;
  border-bottom-right-radius: 4px;
}

.message-user .message-text {
  color: #1f2937;
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
