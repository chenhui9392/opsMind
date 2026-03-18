<template>
  <div class="chat-input-area">
    <input 
      type="text" 
      v-model="inputMessage"
      class="chat-input"
      placeholder="请输入您的问题..."
      @keydown.enter.prevent="handleEnterKey"
    />
    <div class="chat-actions">
      <input 
        type="file" 
        ref="fileInput"
        multiple
        accept="image/*"
        class="file-input"
        @change="handleFileSelect"
      />
      <button class="action-button" @click="$refs.fileInput.click()">
        📷
      </button>
      <button class="send-button" @click="sendMessage">
        发送
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatInput',
  data() {
    return {
      inputMessage: '',
      selectedFiles: []
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
    handleFileSelect(event) {
      const files = event.target.files
      if (files.length > 0) {
        this.selectedFiles = Array.from(files)
      }
    },
    /**
     * 发送消息
     */
    sendMessage() {
      if (!this.inputMessage && this.selectedFiles.length === 0) return

      this.$emit('send', {
        text: this.inputMessage,
        files: this.selectedFiles
      })

      // 清空输入和文件
      this.inputMessage = ''
      this.selectedFiles = []
      this.$refs.fileInput.value = ''
    }
  }
}
</script>

<style scoped>
.chat-input-area {
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 14px;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.chat-input:focus {
  border-color: #2196f3;
}

.chat-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-input {
  display: none;
}

.action-button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background-color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: background-color 0.2s;
}

.action-button:hover {
  background-color: #e0e0e0;
}

.send-button {
  padding: 10px 20px;
  border: none;
  border-radius: 20px;
  background-color: #2196f3;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.send-button:hover {
  background-color: #1976d2;
}
</style>
