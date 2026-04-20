<template>
  <div class="a2ui-test-page">
    <div class="test-header">
      <h2>A2UI Vue Engine 测试页面</h2>
    </div>

    <div class="test-container">
      <A2UIRoot
        ref="a2uiRootRef"
        :initialData="initialData"
        @message="handleMessage"
        @formData-change="handleFormDataChange"
        @ready="handleReady"
        @complete="handleComplete"
      />
    </div>


  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { A2UIRoot } from 'a2ui-vue-engine'
import { leaveRequestSchema } from '../mock/data'

const a2uiRootRef = ref()
const formData = ref({})
const messageLogs = ref([])

const initialData = {
  form: {
    leave: {
      type: '',
      priority: 'normal',
      startTime: '',
      endTime: '',
      duration: '',
      reason: '',
      approver: ''
    }
  }
}

const addLog = (type, content) => {
  messageLogs.value.unshift({
    time: new Date().toLocaleTimeString(),
    type,
    content
  })
}

const loadLeaveSchema = () => {
  if (a2uiRootRef.value) {
    a2uiRootRef.value.processMessage({
      type: 'node',
      node: leaveRequestSchema
    })
    addLog('info', '加载请假单 Schema')
  }
}

const getFormData = () => {
  if (a2uiRootRef.value) {
    const data = a2uiRootRef.value.getFormData()
    formData.value = data
    addLog('data', '获取表单数据成功')
  }
}

const resetForm = () => {
  if (a2uiRootRef.value) {
    a2uiRootRef.value.updateData(initialData)
    formData.value = {}
    addLog('action', '表单已重置')
  }
}

const handleMessage = (message) => {
  addLog('message', `收到消息: ${message.type}`)
}

const handleFormDataChange = (data) => {
  formData.value = data
}

const handleReady = () => {
  addLog('info', 'A2UIRoot 组件已就绪')
  loadLeaveSchema()
}

const handleComplete = () => {
  addLog('success', '渲染完成')
}

onMounted(() => {
  if (a2uiRootRef.value) {
    loadLeaveSchema()
  }
})
</script>

<style scoped>
.a2ui-test-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 20px;
  background: #f5f7fa;
}

.test-header {
  text-align: center;
  margin-bottom: 20px;
}

.test-header h2 {
  margin: 0;
  color: #303133;
}

.test-header p {
  margin: 8px 0 0;
  color: #909399;
}

.test-container {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-content: center;
}

.test-panel {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.panel-section h3 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #606266;
}

.panel-section pre {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow: auto;
  max-height: 200px;
}

.btn-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-log {
  max-height: 200px;
  overflow: auto;
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
}

.log-item {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
}

.log-time {
  color: #909399;
}

.log-type {
  color: #409eff;
  font-weight: 500;
}

.log-content {
  color: #606266;
}
</style>
