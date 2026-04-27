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
      <textarea
        v-model="inputMessage"
        class="chat-input"
        :placeholder="placeholderText"
        @keydown.enter.prevent="handleEnterKey"
        @input="autoResize"
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
        />

        <div class="input-actions">
          <!-- Element Plus Upload 组件 -->
          <el-upload
            ref="uploadRef"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :disabled="uploaderDisabled || isSending"
            :accept="uploadAccept"
            :on-change="handleFileChange"
            :multiple="true"
            class="upload-component"
          >
            <template #trigger>
              <button
                class="attachment-btn"
                :disabled="uploaderDisabled || isSending"
                title="上传文件"
              >
                <img src="../../assets/link.png" alt="附件" class="attachment-icon" />
                <span class="attachment-text">附件</span>
              </button>
            </template>
          </el-upload>
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
import { ref, computed, watch, onMounted } from 'vue'
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
      console.error('文件上传失败:', data.message)
      emit('show-error', '文件上传失败')
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    emit('show-error', '文件上传失败')
  } finally {
    isUploading.value = false
    uploaderDisabled.value = false
  }
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

// 生命周期钩子
onMounted(() => {
  autoResize()
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

// 暴露方法给父组件
defineExpose({
  resetCascader
})
</script>

<style scoped>
.chat-input-container {
  display: flex;
  flex-direction: column;
  //border-top: 1px solid #e0e0e0;
  //background-color: #F8F8FB;
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
  margin: 12px 16px 16px;
  background-color: #F8F8FB;
  border: 1px solid #EEEDF6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
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
  //border-top: 1px solid #f0f0f0;
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
