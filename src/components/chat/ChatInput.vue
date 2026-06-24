<template>
  <div class="chat-input-container">
    <!-- 预览区域（图片和文件在同一排显示） -->
    <div v-if="uploadedImages.length > 0 || uploadedFiles.length > 0" class="preview-container">
      <div class="preview-content">
        <!-- 图片预览 -->
        <div v-for="(image, index) in uploadedImages" :key="'img-' + index" class="preview-item">
          <img
            :src="image"
            class="preview-image"
            @click="openImagePreview(index)"
          />
          <button class="delete-button" @click.stop="deleteImage(index)">
            ×
          </button>
        </div>
        <!-- 文件预览（非图片文件） -->
        <div
          v-for="(file, index) in uploadedFiles"
          :key="'file-' + index"
          class="file-preview-item"
          :title="`点击下载：${file.name}`"
          @click="downloadFile(file)"
        >
          <div class="file-icon">📄</div>
          <div class="file-name">{{ file.name }}</div>
          <div class="file-download-icon">⬇</div>
          <button class="delete-button file-delete" @click.stop="deleteFile(index)">
            ×
          </button>
        </div>
      </div>
    </div>

    <!-- 待发送图片预览（点击放大查看） -->
    <el-image-viewer
      v-if="imageViewer.show"
      :url-list="uploadedImages"
      :initial-index="imageViewer.index"
      @close="imageViewer.show = false"
      @switch="(idx) => (imageViewer.index = idx)"
    />

    <!-- 输入区域 -->
    <div
      class="chat-input-wrapper"
      :class="{ 'drag-over': isDragging }"
      @dragenter.prevent="handleDragEnter"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <textarea
        v-model.trim="inputMessage"
        class="chat-input"
        :placeholder="placeholderText"
        @keydown.enter.prevent="handleEnterKey"
        @input="autoResize"
        @paste="handlePaste"
        rows="1"
        :disabled="props.isInputDisabled"
        :style="{ maxHeight: '500px' }"
      />

      <!-- 底部工具栏：级联 + 操作按钮 -->
      <div class="input-toolbar">
        <!-- 级联选择组件（输入框内部左下角） -->
        <SystemModuleCascader
          ref="cascaderRef"
          v-model="cascaderValue"
          placeholder="请选择系统和模块"
          class="toolbar-cascader"
          :disabled="props.isInputDisabled"
          @change="handleCascaderChange"
        />

        <div class="input-actions">
          <!-- Element Plus Upload 组件 -->
          <el-upload
            ref="uploadRef"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :disabled="uploaderDisabled || isSending || props.isInputDisabled"
            :accept="uploadAccept"
            :on-change="handleFileChange"
            :multiple="true"
            class="upload-component"
          >
            <template #trigger>
              <button
                class="attachment-btn"
                :disabled="uploaderDisabled || isSending || props.isInputDisabled"
                title="上传文件"
              >
                <img src="../../assets/link.png" alt="附件" class="attachment-icon" />
                <span class="attachment-text">附件</span>
              </button>
            </template>
          </el-upload>
          <!-- 截图按钮 -->
          <el-tooltip
            content="截图(Alt + A)"
            placement="top"
            :show-after="100"
          >
            <button
              class="attachment-btn screenshot-btn"
              :disabled="uploaderDisabled || isSending || props.isInputDisabled"
              @click="handleScreenshot"
            >
              <SvgIcon name="scissors" :width="16" :height="16" color="#666" class="scissors-icon" />
              <span class="attachment-text">截图</span>
            </button>
          </el-tooltip>
          <button v-if="!isSending" class="send-button" @click="sendMessage" :disabled="isUploading || isSending || props.isInputDisabled" title="发送">
            <img src="../../assets/sent.png" alt="发送" class="send-icon" />
            <span class="send-text">发送</span>
          </button>
          <button v-else class="stop-button" @click="handleStop" title="暂停">
            <SvgIcon name="stop" width="16" height="16" color="white" />
            <span class="send-text">暂停</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElUpload, ElTooltip, ElImageViewer } from 'element-plus'
import SvgIcon from '../../assets/svg/SvgIcon.vue'
import SystemModuleCascader from '../common/SystemModuleCascader.vue'
import { uploadImage } from '../../api'

// Props
const props = defineProps({
  isSending: {
    type: Boolean,
    default: false
  },
  isNewSession: {
    type: Boolean,
    default: false
  },
  systemName: {
    type: String,
    default: ''
  },
  moduleName: {
    type: String,
    default: ''
  },
  isInputDisabled: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['send', 'stop', 'show-error'])

// 上传配置
const uploadAccept = 'image/*,.xlsx,.xls,.pdf'
const uploadRef = ref(null)

// 响应式数据
const inputMessage = ref('')
const selectedFiles = ref([])
const uploadedImages = ref([])
const uploadedFiles = ref([])
const isUploading = ref(false)
const uploaderDisabled = ref(false)
const isInCodeBlock = ref(false)
const cascaderValue = ref({ businessType: '', systemName: '', moduleName: '' })
const isDragging = ref(false)

// 待发送图片预览查看器状态
const imageViewer = reactive({
  show: false,
  index: 0
})

/**
 * 打开待发送图片预览
 * @param {number} index - 图片索引
 */
const openImagePreview = (index) => {
  imageViewer.index = index
  imageViewer.show = true
}

// 级联选择组件引用
const cascaderRef = ref(null)
// 计算属性
const placeholderText = computed(() => {
  if (!props.isNewSession) {
    return '输入消息...(Shift+Enter 换行)'
  }
  if (!cascaderValue.value) {
    return '请先选择系统和模块...'
  }
  return '输入消息...(Shift+Enter 换行)'
})

/**
 * 检查是否在代码块内
 */
const checkIfInCodeBlock = () => {
  const codeBlockMarkers = (inputMessage.value.match(/```/g) || []).length
  isInCodeBlock.value = codeBlockMarkers % 2 === 1
}

/**
 * 处理级联选择变化
 * @param {Object} eventData - 级联变化事件数据
 */
const handleCascaderChange = (eventData) => {
  if (eventData && eventData.cascaderData) {
    // 直接更新 cascaderValue 确保响应式更新
    cascaderValue.value = {
      businessType: eventData.cascaderData.businessType || '',
      systemName: eventData.cascaderData.systemName || '',
      moduleName: eventData.cascaderData.moduleName || ''
    }
  }
}

/**
 * 处理回车键事件
 * @param {Event} event - 键盘事件
 */
const handleEnterKey = (event) => {
  checkIfInCodeBlock()

  if (event.shiftKey || isInCodeBlock.value) {
    inputMessage.value += '\n'
  } else {
    sendMessage()
  }
}

/**
 * 处理文件变化（选择文件后）
 * @param {Object} uploadFile - Element Plus 上传文件对象
 */
const handleFileChange = async (uploadFile) => {
  const file = uploadFile.raw
  if (!file) return

  isUploading.value = true
  uploaderDisabled.value = true

  await uploadAndPreviewFile(file)

  isUploading.value = false
  uploaderDisabled.value = false
}

/**
 * 上传文件并预览
 * @param {File} file - 文件对象
 */
const uploadAndPreviewFile = async (file) => {
  if (!file) return

  const isImage = file.type.startsWith('image/')

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('repository', 'agent-octopus')

    const data = await uploadImage(formData)
    if (data.code === 200) {
      const fileUrl = data.data[0].url.trim()
      if (isImage) {
        uploadedImages.value.push(fileUrl)
      } else {
        uploadedFiles.value.push({
          name: file.name,
          url: fileUrl,
          type: file.type
        })
      }
    } else {
      emit('show-error', '文件上传失败')
    }
  } catch (error) {
    emit('show-error', '文件上传失败')
  }
}

/**
 * 处理粘贴事件（支持截图粘贴）
 * @param {ClipboardEvent} event - 粘贴事件
 */
const handlePaste = async (event) => {
  if (props.isInputDisabled) return

  const items = event.clipboardData?.items
  if (!items || items.length === 0) return

  isUploading.value = true
  uploaderDisabled.value = true

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        await uploadAndPreviewFile(file)
      }
    }
  }

  isUploading.value = false
  uploaderDisabled.value = false
}

/**
 * 处理拖拽进入事件
 * @param {DragEvent} event - 拖拽事件
 */
const handleDragEnter = (event) => {
  if (props.isInputDisabled) return
  isDragging.value = true
}

/**
 * 处理拖拽悬停事件
 * @param {DragEvent} event - 拖拽事件
 */
const handleDragOver = (event) => {
  if (props.isInputDisabled) return
  event.dataTransfer.dropEffect = 'copy'
}

/**
 * 处理拖拽离开事件
 * @param {DragEvent} event - 拖拽事件
 */
const handleDragLeave = (event) => {
  const rect = event.currentTarget.getBoundingClientRect()
  if (
    event.clientX <= rect.left ||
    event.clientX >= rect.right ||
    event.clientY <= rect.top ||
    event.clientY >= rect.bottom
  ) {
    isDragging.value = false
  }
}

/**
 * 处理放置事件
 * @param {DragEvent} event - 放置事件
 */
const handleDrop = async (event) => {
  if (props.isInputDisabled) return

  isDragging.value = false

  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return

  isUploading.value = true
  uploaderDisabled.value = true

  for (let i = 0; i < files.length; i++) {
    await uploadAndPreviewFile(files[i])
  }

  isUploading.value = false
  uploaderDisabled.value = false
}

/**
 * 发送消息
 */
const sendMessage = () => {
  if (props.isInputDisabled) return
  if (!inputMessage.value && uploadedImages.value.length === 0 && uploadedFiles.value.length === 0) return

  emit('send', {
    text: inputMessage.value,
    originalText: inputMessage.value,
    images: uploadedImages.value,
    files: uploadedFiles.value,
    businessType: cascaderValue.value?.businessType || '',
    systemName: cascaderValue.value?.systemName || '',
    moduleName: cascaderValue.value?.moduleName || ''
  })

  inputMessage.value = ''
  uploadedImages.value = []
  uploadedFiles.value = []
  isInCodeBlock.value = false
  resetResize()
}

/**
 * 删除图片
 * @param {number} index - 图片索引
 */
const deleteImage = (index) => {
  uploadedImages.value.splice(index, 1)
}

/**
 * 删除文件
 * @param {number} index - 文件索引
 */
const deleteFile = (index) => {
  uploadedFiles.value.splice(index, 1)
}

/**
 * 下载待发送的文件
 * @param {Object} file - 文件对象 { name, url, type }
 */
const downloadFile = (file) => {
  if (!file || !file.url) return
  try {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name || 'download'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    emit('show-error', '文件下载失败')
  }
}

/**
 * 重置textarea高度
 */
const resetResize = () => {
  const textarea = document.querySelector('.chat-input')
  if (textarea) {
    textarea.style.height = '54px'
  }
}

/**
 * 自动调整textarea高度
 */
const autoResize = () => {
  const textarea = document.querySelector('.chat-input')
  if (textarea) {
    textarea.style.height = '54px'
    const newHeight = Math.min(textarea.scrollHeight, 500)
    textarea.style.height = `${newHeight}px`
  }
}

/**
 * 处理中断请求
 */
const handleStop = () => {
  emit('stop')
}

/**
 * 处理截图按钮点击，触发主进程开启截图流程
 */
const handleScreenshot = async () => {
  if (props.isInputDisabled || props.isSending) return
  if (!window.screenshotAPI || typeof window.screenshotAPI.start !== 'function') {
    emit('show-error', '截图功能不可用，请重启应用后重试')
    console.warn('[Screenshot] window.screenshotAPI 不存在，需重启 Electron 以加载新的 preload.js')
    return
  }
  try {
    const result = await window.screenshotAPI.start()
    if (result && result.success === false) {
      emit('show-error', result.message || '启动截图失败')
    }
  } catch (error) {
    console.error('[Screenshot] 启动截图异常:', error)
    emit('show-error', '启动截图失败')
  }
}

/**
 * 全局键盘监听：捕获 Alt+A 触发截图
 * 注意：主进程已通过 globalShortcut 和 before-input-event 监听 Alt+A，
 * 此处作为兜底，仅当 screenshotAPI 可用时主动调用，避免误报错误
 * @param {KeyboardEvent} event
 */
const handleGlobalKeydown = (event) => {
  // 仅响应 Alt+A（不含 Ctrl/Shift/Meta），key 为 'a' 或 'A'
  const isAltA = event.altKey && !event.ctrlKey && !event.shiftKey && !event.metaKey
    && (event.key === 'a' || event.key === 'A' || event.code === 'KeyA')
  if (!isAltA) return
  // 如果 screenshotAPI 不存在，交由主进程处理（before-input-event），不做任何处理避免误报
  if (!window.screenshotAPI || typeof window.screenshotAPI.start !== 'function') {
    return
  }
  event.preventDefault()
  event.stopPropagation()
  handleScreenshot()
}

/**
 * 截图结果回调，将截图作为图片上传并预览
 * @param {Object} data - { success, dataUrl?, cancelled? }
 */
const handleScreenshotResult = async (data) => {
  if (!data || !data.success || !data.dataUrl) return

  try {
    // 将 dataUrl 转换为 File 对象
    const res = await fetch(data.dataUrl)
    const blob = await res.blob()
    const fileName = `screenshot_${Date.now()}.png`
    const file = new File([blob], fileName, { type: 'image/png' })

    isUploading.value = true
    uploaderDisabled.value = true
    await uploadAndPreviewFile(file)
  } catch (error) {
    emit('show-error', '截图上传失败')
  } finally {
    isUploading.value = false
    uploaderDisabled.value = false
  }
}

// 监听 isNewSession 变化，新建会话时自动重置级联选择器
watch(() => props.isNewSession, (newVal) => {
  if (newVal) {
    resetCascader()
  }
})

// 监听输入框禁用状态，禁用时自动清除输入内容
watch(() => props.isInputDisabled, (newVal) => {
  if (newVal) {
    clearInput()
  }
})

// 生命周期钩子
onMounted(() => {
  autoResize()
  if (window.screenshotAPI && typeof window.screenshotAPI.onScreenshotResult === 'function') {
    window.screenshotAPI.onScreenshotResult(handleScreenshotResult)
  }
  // 渲染端额外监听 Alt+A 快捷键（作为主进程快捷键的兜底，避免被输入框拦截）
  window.addEventListener('keydown', handleGlobalKeydown, true)
})

onUnmounted(() => {
  if (window.screenshotAPI && typeof window.screenshotAPI.offScreenshotResult === 'function') {
    window.screenshotAPI.offScreenshotResult(handleScreenshotResult)
  }
  window.removeEventListener('keydown', handleGlobalKeydown, true)
})

/**
 * 重置级联选择器
 */
const resetCascader = () => {
  cascaderValue.value = { businessType: '', systemName: '', moduleName: '' }
  if (cascaderRef.value && cascaderRef.value.resetSelection) {
    cascaderRef.value.resetSelection()
  }
}

/**
 * 清除输入框内容（切换会话时调用）
 */
const clearInput = () => {
  inputMessage.value = ''
  uploadedImages.value = []
  uploadedFiles.value = []
  isInCodeBlock.value = false
  resetResize()
  resetCascader()
}

// 暴露方法给父组件
defineExpose({
  resetCascader,
  clearInput
})
</script>

<style scoped>
.chat-input-container {
  display: flex;
  flex-direction: column;
}

/* 预览区域（图片和文件在同一排显示） */
.preview-container {
  padding: 12px 16px 0;
}

.preview-content {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.preview-item {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: zoom-in;
  transition: transform 0.2s;
}

.preview-image:hover {
  transform: scale(1.05);
}

.file-preview-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 28px 6px 10px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 300px;
  cursor: pointer;
  transition: background-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.file-preview-item:hover {
  background-color: #f5f7ff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.file-preview-item .file-download-icon {
  font-size: 14px;
  color: #2260FA;
  opacity: 0;
  margin-left: 2px;
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.file-preview-item:hover .file-download-icon {
  opacity: 1;
}

.file-icon {
  font-size: 20px;
  flex-shrink: 0;
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

.file-delete {
  position: absolute;
  top: 50%;
  right: 4px;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background-color: #ff4757;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-button {
  position: absolute;
  top: 0;
  right: 0;
  width: 24px;
  height: 24px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  background-color: #ff4757;
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
  z-index: 10;
}

.delete-button:hover {
  background-color: #ff3742;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

/* 输入区域 */
.chat-input-wrapper {
  position: relative;
  margin: 12px 16px 16px;
  background-color: #F8F8FB;
  border: 1px solid #EEEDF6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.chat-input-wrapper.drag-over {
  border-color: #2260FA;
  background-color: #f0f5ff;
  box-shadow: 0 0 12px rgba(34, 96, 250, 0.2);
}

.chat-input {
  width: 100%;
  padding: 12px 16px;
  border: none;
  font-size: 14px;
  outline: none;
  background-color: transparent;
  min-height: 48px;
  max-height: 200px;
  box-sizing: border-box;
  resize: none;
  overflow-y: auto;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
  color: #333;
}

.chat-input::placeholder {
  color: #999;
}

/* 底部工具栏 */
.input-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  /* border-top: 1px solid #f0f0f0; */
  min-height: 40px;
}

/* 级联选择器在工具栏中的样式 */
:deep(.cascade-select-wrapper) {
  padding: 0 !important;
  border: none !important;
  background-color: transparent !important;
  min-height: auto !important;
}

/* 附件按钮样式 */
.upload-component {
  display: inline-block;
}

/* 隐藏 Element Plus Upload 内部原生文件输入框的默认提示 */
.upload-component :deep(.el-upload__input) {
  display: none;
}

/* 确保上传组件内不会出现额外的文件列表或提示区域 */
.upload-component :deep(.el-upload-list),
.upload-component :deep(.el-upload__tip) {
  display: none;
}

.attachment-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
  background-color: transparent;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 4px 8px;
  border-radius: 4px;
}

.attachment-btn:hover:not(:disabled) {
  background-color: #f5f5f5;
  color: #333;
}

.attachment-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.attachment-icon {
  width: 16px;
  height: 16px;
  opacity: 0.7;
}

/* 剪刀图标旋转 90 度，竖向展示 */
.scissors-icon {
  transform: rotate(-90deg);
}

.attachment-text {
  font-size: 12px;
}

/* 操作按钮区域 */
.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 发送按钮 */
.send-button {
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
  border-radius: 8px;
  background-color: #2260FA;
  color: #ffffff;
  cursor: pointer;
  padding: 6px 14px;
  font-size: 12px;
  transition: all 0.2s;
}

.send-button:hover:not(:disabled) {
  background-color: #1a4fd6;
}

.send-icon {
  width: 14px;
  height: 14px;
}

.send-text {
  font-size: 12px;
  line-height: 1;
}

/* 中断按钮样式 */
.stop-button {
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #ff4757, #ff6b81);
  color: #ffffff;
  cursor: pointer;
  padding: 6px 14px;
  font-size: 12px;
  transition: all 0.2s;
}

.stop-button:hover {
  background: linear-gradient(135deg, #ff3742, #ff5e70);
}

/* 禁用状态 */
.send-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
