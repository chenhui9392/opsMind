<!--
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-03-30 15:11:37
 * @LastEditTime: 2026-03-30 15:11:44
 * @LastEditors: hui.chenn
-->
<template>
  <div class="file-uploader">
    <input
      type="file"
      ref="fileInput"
      multiple
      :accept="accept"
      class="file-input"
      @change="handleFileChange"
    />
    <button
      class="upload-button"
      @click="handleClick"
      :disabled="disabled || isUploading"
      :title="title"
    >
      <slot name="icon">
        <SvgIcon name="upload" width="20" height="20" />
      </slot>
      <span v-if="buttonText" class="button-text">{{ buttonText }}</span>
    </button>
  </div>
</template>

<script>
import SvgIcon from '../../assets/svg/SvgIcon.vue'
import { uploadImage } from '../../api'

export default {
  name: 'FileUploader',
  components: {
    SvgIcon
  },
  props: {
    accept: {
      type: String,
      default: 'image/*,.xlsx,.xls,.pdf'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '上传文件'
    },
    buttonText: {
      type: String,
      default: ''
    },
    bucket: {
      type: String,
      default: 'CSS-01'
    }
  },
  emits: ['upload-start', 'upload-success', 'upload-error', 'upload-complete'],
  data() {
    return {
      isUploading: false
    }
  },
  methods: {
    handleClick() {
      this.$refs.fileInput.click()
    },
    async handleFileChange(event) {
      const files = event.target.files
      if (files.length === 0) return

      this.isUploading = true
      this.$emit('upload-start')

      const filesArray = Array.from(files)
      const uploadedImages = []
      const uploadedFiles = []

      for (const file of filesArray) {
        const isImage = file.type.startsWith('image/')

        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('bucket', this.bucket)

          const data = await uploadImage(formData)

          if (data.success) {
            const fileUrl = data.data.accessPath.trim()
            if (isImage) {
              uploadedImages.push(fileUrl)
            } else {
              uploadedFiles.push({
                name: file.name,
                url: fileUrl,
                type: file.type
              })
            }
            this.$emit('upload-success', { url: fileUrl, name: file.name, isImage })
          } else {
            this.$emit('upload-error', { file: file.name, error: '上传失败' })
          }
        } catch (error) {
          this.$emit('upload-error', { file: file.name, error: error.message })
        }
      }

      this.isUploading = false
      this.$emit('upload-complete', { images: uploadedImages, files: uploadedFiles })

      // 清空 input 以便可以重复选择相同文件
      this.$refs.fileInput.value = ''
    },
    clear() {
      this.$refs.fileInput.value = ''
    }
  }
}
</script>

<style scoped>
.file-uploader {
  display: inline-block;
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
  position: relative;
}

.upload-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  transform: scale(1.05);
}

.upload-button:disabled {
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

.upload-button:hover .button-text {
  opacity: 1;
  visibility: visible;
}
</style>
