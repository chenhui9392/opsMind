<template>
  <div class="chat-input-container">
    <!-- 图片预览区域 -->
    <div v-if="uploadedImages.length > 0" class="image-preview-container">
      <div v-for="(image, index) in uploadedImages" :key="index" class="preview-item">
        <img :src="image" class="preview-image" />
        <button class="delete-button" @click="deleteImage(index)">
          ×
        </button>
      </div>
    </div>

    <!-- 文件预览区域（非图片文件） -->
    <div v-if="uploadedFiles.length > 0" class="file-preview-container">
      <div v-for="(file, index) in uploadedFiles" :key="index" class="file-preview-item">
        <div class="file-icon">📄</div>
        <div class="file-name">{{ file.name }}</div>
        <button class="delete-button file-delete" @click="deleteFile(index)">
          ×
        </button>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input-wrapper">
      <!-- 系统和模块选择器 -->
      <div class="selectors-container">
        <select
          v-model="selectedSystem"
          class="system-select"
          :disabled="!isNewSession"
          @change="handleSystemChange"
        >
          <option value="">选择系统</option>
          <option v-for="system in systemList" :key="system.code" :value="system.code">
            {{ system.name }}
          </option>
        </select>
        <select
          v-model="selectedModule"
          class="module-select"
          :disabled="!isNewSession || !selectedSystem"
        >
          <option value="">{{ selectedSystem ? '选择模块' : '请先选择系统' }}</option>
          <option v-for="module in moduleList" :key="module.code" :value="module.code">
            {{ module.name }}
          </option>
        </select>
      </div>
      <textarea
        v-model="inputMessage"
        class="chat-input"
        placeholder="输入消息..."
        @keydown.enter.prevent="handleEnterKey"
        @input="autoResize"
        rows="1"
        :style="{ maxHeight: '500px' }"
      />
      <div class="input-actions">
        <FileUploader
          ref="fileUploader"
          accept="image/*,.xlsx,.xls,.pdf"
          :disabled="uploaderDisabled || isSending"
          title="上传"
          button-text="上传"
          @upload-start="handleUploadStart"
          @upload-success="handleUploadSuccess"
          @upload-error="handleUploadError"
          @upload-complete="handleUploadComplete"
        />
        <button v-if="!isSending" class="send-button" @click="sendMessage" :disabled="isUploading || isSending" title="发送">
          <SvgIcon name="send" width="18" height="18" color="white" />
          <span class="button-text">发送</span>
        </button>
        <button v-else class="stop-button" @click="handleStop" title="暂停">
          <SvgIcon name="stop" width="18" height="18" color="white" />
          <span class="button-text">暂停</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import SvgIcon from '../../assets/svg/SvgIcon.vue'
import FileUploader from '../common/FileUploader.vue'
import { getSystemList, getModuleListBySystem } from '../../config/systemModuleData.js'

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
  }
})

// Emits
const emit = defineEmits(['send', 'stop', 'show-error'])

// 响应式数据
const inputMessage = ref('')
const selectedFiles = ref([])
const uploadedImages = ref([])
const uploadedFiles = ref([])
const isUploading = ref(false)
const uploaderDisabled = ref(false)
const isInCodeBlock = ref(false)
const selectedSystem = ref('')
const selectedModule = ref('')
const systemList = ref([])
const moduleList = ref([])

// 模板引用
const fileUploader = ref(null)
const textareaRef = ref(null)

/**
 * 检查是否在代码块内
 */
const checkIfInCodeBlock = () => {
  const codeBlockMarkers = (inputMessage.value.match(/```/g) || []).length
  isInCodeBlock.value = codeBlockMarkers % 2 === 1
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
 * 处理文件上传开始
 */
const handleUploadStart = () => {
  isUploading.value = true
  uploaderDisabled.value = true
}

/**
 * 处理文件上传成功
 * @param {Object} result - 上传结果
 */
const handleUploadSuccess = (result) => {
  if (result.isImage) {
    uploadedImages.value.push(result.url)
  } else {
    uploadedFiles.value.push({
      name: result.name,
      url: result.url,
      type: result.type
    })
  }
}

/**
 * 处理文件上传错误
 * @param {Object} error - 错误信息
 */
const handleUploadError = (error) => {
  console.error('文件上传失败:', error)
}

/**
 * 处理文件上传完成
 * @param {Object} result - 上传结果
 */
const handleUploadComplete = (result) => {
  isUploading.value = false
  uploaderDisabled.value = false
}

/**
 * 加载系统列表
 */
const loadSystemList = () => {
  systemList.value = getSystemList()
}

/**
 * 恢复系统模块选择状态
 */
const restoreSystemModuleSelection = () => {
  const system = systemList.value.find(s => s.name === props.systemName)
  if (system) {
    selectedSystem.value = system.code
    moduleList.value = getModuleListBySystem(selectedSystem.value)
    const module = moduleList.value.find(m => m.name === props.moduleName)
    if (module) {
      selectedModule.value = module.code
    }
  }
  console.log('恢复系统模块选择:', props.systemName, props.moduleName, '->', selectedSystem.value, selectedModule.value)
}

/**
 * 处理系统选择变化
 */
const handleSystemChange = () => {
  selectedModule.value = ''
  moduleList.value = []

  if (selectedSystem.value) {
    moduleList.value = getModuleListBySystem(selectedSystem.value)
  }
}

/**
 * 发送消息
 */
const sendMessage = () => {
  if (props.isNewSession) {
    if (!selectedSystem.value || !selectedModule.value) {
      emit('show-error', '请先选择系统和模块')
      return
    }
  }

  if (!inputMessage.value && uploadedImages.value.length === 0 && uploadedFiles.value.length === 0) return

  const system = systemList.value.find(s => s.code === selectedSystem.value)
  const module = moduleList.value.find(m => m.code === selectedModule.value)
  const systemName = system ? system.name : ''
  const moduleName = module ? module.name : ''

  emit('send', {
    text: inputMessage.value,
    originalText: inputMessage.value,
    images: uploadedImages.value,
    files: uploadedFiles.value,
    systemCode: selectedSystem.value,
    moduleCode: selectedModule.value,
    systemName: systemName,
    moduleName: moduleName
  })

  inputMessage.value = ''
  uploadedImages.value = []
  uploadedFiles.value = []
  if (fileUploader.value && fileUploader.value.clear) {
    fileUploader.value.clear()
  }
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

// 监听systemName和moduleName变化
watch(() => props.systemName, (newVal) => {
  if (newVal && props.moduleName) {
    restoreSystemModuleSelection()
  }
})

watch(() => props.moduleName, (newVal) => {
  if (newVal && props.systemName) {
    restoreSystemModuleSelection()
  }
})

// 生命周期钩子
onMounted(() => {
  autoResize()
  loadSystemList()
  if (props.systemName && props.moduleName) {
    restoreSystemModuleSelection()
  }
})
</script>

<style scoped>
.chat-input-container {
  display: flex;
  flex-direction: column;
  border-top: 1px solid #e0e0e0;
  background-color: #f5f5f5;
}

/* 图片预览区域 */
.image-preview-container {
  padding: 12px 16px 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 文件预览区域 */
.file-preview-container {
  padding: 12px 16px 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.file-preview-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 32px 8px 12px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 400px;
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
  top: -6px;
  right: -6px;
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
  padding: 16px;
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
  min-height: 88px;
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 系统和模块选择器容器 */
.selectors-container {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 系统选择器 */
.system-select,
.module-select {
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 13px;
  background-color: #f5f5f5;
  color: #333;
  outline: none;
  cursor: pointer;
  min-width: 120px;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.system-select:hover,
.module-select:hover {
  border-color: #673ab7;
  background-color: #ffffff;
}

.system-select:focus,
.module-select:focus {
  border-color: #673ab7;
  background-color: #ffffff;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
}

/* 禁用状态的选择器 */
.system-select:disabled,
.module-select:disabled {
  background-color: #e8e8e8;
  color: #888;
  cursor: not-allowed;
  border-color: #d0d0d0;
  opacity: 0.7;
}

/* 下拉框选项样式 */
.system-select option,
.module-select option {
  padding: 8px 12px;
  font-size: 13px;
}

.chat-input {
  width: 100%;
  padding: 16px 100px 16px 56px;
  border: 1px solid #e0e0e0;
  border-radius: 28px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  background-color: #f5f5f5;
  min-height: 56px;
  box-sizing: border-box;
  resize: none;
  overflow-y: auto;
  line-height: 1.4;
}

.chat-input:focus {
  border-color: #673ab7;
  background-color: #ffffff;
}

.input-actions {
  position: absolute;
  right: 36px;
  bottom: 4px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
}

.send-button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg,#667eea,#764ba2);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  position: relative;
}

.send-button:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.send-icon {
  width: 18px;
  height: 18px;
}

/* 中断按钮样式 */
.stop-button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff4757, #ff6b81);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  position: relative;
}

.stop-button:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

/* 禁用状态 */
.send-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-text {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 12px;
  color: #666;
  background-color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s;
  z-index: 100;
  pointer-events: none;
}

.send-button:hover .button-text,
.stop-button:hover .button-text {
  opacity: 1;
  visibility: visible;
}
</style>
