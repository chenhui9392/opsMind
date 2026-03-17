<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'

const emit = defineEmits<{
  send: [content: string, images: string[]]
}>()

const messageText = ref('')
const selectedImages = ref<string[]>([])
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// 触发文件选择
const triggerFileSelect = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  
  if (!files || files.length === 0) return
  
  uploading.value = true
  
  try {
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await axios.post('https://css-test.tineco.com/gateway/fileServer/v4/upload/single', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      if (response.data.success) {
        selectedImages.value.push(response.data.data.accessPath)
      }
    }
  } catch (error) {
    console.error('上传图片失败:', error)
    alert('上传图片失败，请重试')
  } finally {
    uploading.value = false
    // 清空input，允许重复选择相同文件
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

// 删除已选图片
const removeImage = (index: number) => {
  selectedImages.value.splice(index, 1)
}

// 发送消息
const handleSend = async () => {
  if (!messageText.value.trim() && selectedImages.value.length === 0) return
  
  // 调用发送消息接口
  try {
    await axios.post('https://cloud-test.tineco.com/omp/api/agentChat/chat', {
      message: messageText.value,
      userName: 'hui.chenn',
      fileUrls: selectedImages.value
    })
  } catch (error) {
    console.error('发送消息失败:', error)
  }
  
  emit('send', messageText.value, [...selectedImages.value])
  
  // 清空输入
  messageText.value = ''
  selectedImages.value = []
}

// 处理键盘事件
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="message-input">
    <!-- 已选图片预览 -->
    <div v-if="selectedImages.length > 0" class="selected-images">
      <div v-for="(img, index) in selectedImages" :key="index" class="image-preview-item">
        <img :src="img" alt="预览" />
        <button class="remove-btn" @click="removeImage(index)">
          <span>×</span>
        </button>
      </div>
    </div>
    
    <div class="input-area">
      <button 
        class="upload-btn" 
        @click="triggerFileSelect"
        :disabled="uploading"
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
        </svg>
      </button>
      
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        style="display: none"
        @change="handleFileChange"
      />
      
      <textarea
        v-model="messageText"
        class="message-textarea"
        placeholder="请输入您的问题..."
        rows="3"
        @keydown="handleKeydown"
      />
      
      <button 
        class="send-btn" 
        @click="handleSend"
        :disabled="(!messageText.trim() && selectedImages.length === 0) || uploading"
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
    
    <div class="input-hint">
      <span v-if="uploading">上传中...</span>
      <span v-else>按 Enter 发送，Shift + Enter 换行</span>
    </div>
  </div>
</template>

<style scoped>
.message-input {
  background-color: #fff;
  border-top: 1px solid #e0e0e0;
  padding: 12px 16px;
}

.selected-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.image-preview-item {
  position: relative;
  width: 80px;
  height: 80px;
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.remove-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #ff4d4f;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  padding: 0;
}

.remove-btn:hover {
  background-color: #ff7875;
}

.input-area {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.upload-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.upload-btn:hover:not(:disabled) {
  background-color: #f0f0f0;
  color: #333;
}

.upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.message-textarea {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.message-textarea:focus {
  border-color: #667eea;
}

.send-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-hint {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
</style>