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

    <!-- 输入区域 -->
    <div class="chat-input-wrapper">
      <input
        type="text"
        v-model="inputMessage"
        class="chat-input"
        placeholder="输入消息..."
        @keydown.enter.prevent="handleEnterKey"
      />
      <div class="input-actions">
        <input
          type="file"
          ref="fileInput"
          multiple
          accept="image/*"
          class="file-input"
          @change="handleFileSelect"
        />
        <button class="upload-button" @click="$refs.fileInput.click()" :disabled="isUploading">
          <SvgIcon name="camera" width="20" height="20" />
        </button>
        <button class="send-button" @click="sendMessage" :disabled="isUploading">
          <SvgIcon name="send" width="18" height="18" color="white" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { uploadImage } from '../api'
import SvgIcon from '../assets/svg/SvgIcon.vue'

export default {
  name: 'ChatInput',
  components: {
    SvgIcon
  },
  data() {
    return {
      inputMessage: '',
      selectedFiles: [],
      uploadedImages: [],
      isUploading: false
    }
  },
  computed: {
    charCount() {
      return this.inputMessage.length
    }
  },
  methods: {
    /**
     * 处理回车键事件
     * @param {Event} event - 键盘事件
     */
    handleEnterKey(event) {
      if (event.shiftKey) {
        // Shift + Enter 换行
        this.inputMessage += '\n'
      } else {
        // Enter 发送消息
        this.sendMessage()
      }
    },
    /**
     * 处理文件选择
     * @param {Event} event - 文件选择事件
     */
    async handleFileSelect(event) {
      const files = event.target.files
      if (files.length > 0) {
        this.isUploading = true
        const filesArray = Array.from(files)

        for (const file of filesArray) {
          try {
            const imageUrl = await uploadImage(file)
            this.uploadedImages.push(imageUrl)
          } catch (error) {
            console.error('图片上传失败:', error)
          }
        }

        this.isUploading = false
      }
    },
    /**
     * 发送消息
     */
    sendMessage() {
      if (!this.inputMessage && this.uploadedImages.length === 0) return

      this.$emit('send', {
        text: this.inputMessage,
        images: this.uploadedImages
      })

      // 清空输入和文件
      this.inputMessage = ''
      this.uploadedImages = []
      this.$refs.fileInput.value = ''
    },
    /**
     * 删除图片
     * @param {number} index - 图片索引
     */
    deleteImage(index) {
      this.uploadedImages.splice(index, 1)
    }
  }
}
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
}

.chat-input {
  width: 100%;
  padding: 16px 16px 16px 56px;
  border: 1px solid #e0e0e0;
  border-radius: 28px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  background-color: #f5f5f5;
  min-height: 56px;
  box-sizing: border-box;
}

.chat-input:focus {
  border-color: #673ab7;
  background-color: #ffffff;
}

.input-actions {
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-input {
  display: none;
}

.upload-button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background-color: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #666;
}

.upload-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  transform: scale(1.05);
}

.upload-icon {
  width: 20px;
  height: 20px;
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
}

.send-button:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.send-icon {
  width: 18px;
  height: 18px;
}

/* 禁用状态 */
.upload-button:disabled,
.send-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
