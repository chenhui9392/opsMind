<template>
  <div class="power-shell-test">
    <div class="test-header">
      <h3>PowerShell 执行测试</h3>
      <p>测试安全执行白名单命令</p>
    </div>

    <div class="test-content">
      <!-- 模拟聊天 JSON 输入 -->
      <div class="json-input-section">
        <h4>模拟聊天 JSON</h4>
        <el-input
          v-model="jsonInput"
          type="textarea"
          :rows="4"
          placeholder="输入 JSON 格式的聊天响应，如: { action: 'run-client' }"
        />
        <el-button type="primary" @click="handleParseAndExecute" :loading="isExecuting">
          解析并执行
        </el-button>
      </div>

      <!-- 直接执行白名单命令 -->
      <div class="direct-exec-section">
        <h4>直接执行白名单命令</h4>
        <el-select v-model="selectedAction" placeholder="选择命令">
          <el-option label="run-client (执行远程客户端)" value="run-client" />
        </el-select>
        <el-button type="primary" @click="handleDirectExecute" :loading="isExecuting">
          执行命令
        </el-button>
      </div>

      <!-- 执行结果展示 -->
      <div class="result-section">
        <h4>执行结果</h4>
        <div class="result-box" :class="{ 'success': result.success, 'error': !result.success }">
          <div class="result-item">
            <span class="label">状态:</span>
            <span class="value">{{ result.success ? '成功' : '失败' }}</span>
          </div>
          <div class="result-item">
            <span class="label">输出:</span>
            <pre class="value">{{ result.data || '无' }}</pre>
          </div>
          <div class="result-item">
            <span class="label">错误:</span>
            <pre class="value">{{ result.error || '无' }}</pre>
          </div>
        </div>
      </div>

      <!-- 流式输出展示 -->
      <div class="stream-section" v-if="streamLogs.length > 0">
        <h4>流式输出日志</h4>
        <div class="stream-logs">
          <div v-for="(log, index) in streamLogs" :key="index" class="log-item" :class="log.type">
            <span class="log-type">{{ log.type }}</span>
            <span class="log-data">{{ log.data }}</span>
          </div>
        </div>
      </div>

      <!-- API 状态检查 -->
      <div class="api-status">
        <h4>API 状态</h4>
        <el-tag :type="apiAvailable ? 'success' : 'danger'">
          {{ apiAvailable ? 'PowerShell API 已就绪' : 'PowerShell API 不可用（非 Electron 环境）' }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { handleChatPowerShell, executePowerShellStream } from '../utils/powerShellService'

// 响应式数据
const jsonInput = ref('{ "action": "run-client" }')
const selectedAction = ref('run-client')
const isExecuting = ref(false)
const result = ref({ success: false, data: '', error: '' })
const streamLogs = ref([])

// API 是否可用
const apiAvailable = computed(() => {
  return typeof window !== 'undefined' && window.powerShellAPI
})

/**
 * 解析 JSON 并执行
 */
const handleParseAndExecute = async () => {
  isExecuting.value = true
  streamLogs.value = []

  try {
    let jsonData
    try {
      jsonData = JSON.parse(jsonInput.value)
    } catch (e) {
      result.value = {
        success: false,
        data: '',
        error: 'JSON 格式错误，请检查输入'
      }
      return
    }

    const res = await handleChatPowerShell(jsonData)
    result.value = res
  } catch (error) {
    result.value = {
      success: false,
      data: '',
      error: error.message
    }
  } finally {
    isExecuting.value = false
  }
}

/**
 * 直接执行白名单命令
 */
const handleDirectExecute = async () => {
  if (!apiAvailable.value) {
    result.value = {
      success: false,
      data: '',
      error: '当前环境不支持 PowerShell 执行'
    }
    return
  }

  isExecuting.value = true
  streamLogs.value = []

  try {
    // 使用流式执行（支持进度回调）
    const res = await executePowerShellStream(
      selectedAction.value,
      { timeout: 60000 }, // 60秒超时
      (progress) => {
        streamLogs.value.push({
          type: progress.type,
          data: progress.data
        })
      }
    )
    result.value = res
  } catch (error) {
    result.value = {
      success: false,
      data: '',
      error: error.message
    }
  } finally {
    isExecuting.value = false
  }
}

// 组件挂载时检查 API
onMounted(() => {
  console.log('[PowerShell Test] API 状态:', apiAvailable.value)
})
</script>

<style scoped>
.power-shell-test {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  max-width: 800px;
  margin: 20px auto;
  height: 100%;
  overflow: auto;
}

.test-header {
  text-align: center;
  margin-bottom: 20px;
}

.test-header h3 {
  margin: 0;
  color: #303133;
}

.test-header p {
  margin: 8px 0 0;
  color: #909399;
  font-size: 14px;
}

.test-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.test-content h4 {
  margin: 0 0 12px;
  color: #606266;
  font-size: 14px;
}

.json-input-section,
.direct-exec-section,
.result-section,
.stream-section,
.api-status {
  background: #fff;
  padding: 16px;
  border-radius: 6px;
}

.json-input-section .el-input,
.direct-exec-section .el-select {
  margin-bottom: 12px;
}

.direct-exec-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-box {
  border-radius: 4px;
  padding: 16px;
  background: #f5f7fa;
}

.result-box.success {
  border: 1px solid #67c23a;
}

.result-box.error {
  border: 1px solid #f56c6c;
}

.result-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.result-item .label {
  font-weight: 500;
  color: #909399;
  min-width: 60px;
}

.result-item .value {
  color: #606266;
}

.result-item pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.stream-logs {
  max-height: 200px;
  overflow-y: auto;
  background: #1e1e1e;
  color: #fff;
  padding: 12px;
  border-radius: 4px;
  font-family: monospace;
}

.log-item {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
}

.log-item.stdout {
  color: #4ec9b0;
}

.log-item.stderr {
  color: #f56c6c;
}

.log-type {
  opacity: 0.7;
}

.log-data {
  white-space: pre-wrap;
}
</style>
