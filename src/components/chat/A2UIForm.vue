<!--
 * @Author: hui.chenn
 * @Description: A2UI 表单渲染组件
 * @Date: 2026-04-29 11:49:56
-->
<template>
  <div class="a2ui-form-container" style="position: relative;">
    <A2UIRoot
      ref="a2uiRootRef"
      @message="handleA2UIMessage"
      @complete="handleA2UIComplete"
    />
    <!-- 提交 loading 遮罩 -->
    <div v-if="isSubmitting" class="form-loading-overlay">
      <div class="form-loading-spinner"></div>
      <div class="form-loading-text">提交中...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { A2UIRoot } from 'a2ui-vue-engine'
import { submitWorkOrder, updateOrder } from '../../api'
import chatMessageService from '../../services/chatMessageService'

// ============================================
// 常量定义
// ============================================

/** 可输入组件类型列表 */
const INPUT_COMPONENT_TYPES = [
  'DateTimeInput',
  'TextField',
  'SelectField',
  'ChoicePicker',
  'NumberField',
  'Checkbox',
  'RadioGroup',
  'Switch',
  'Slider',
  'Textarea',
  'TimePicker',
  'DatePicker'
]

// ============================================
// Props & Emits
// ============================================

const props = defineProps({
  formInfo: {
    type: [String, Array],
    default: null
  },
  hasFull: {
    type: Boolean,
    default: false
  },
  rawContent: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['form-submit', 'submit-success', 'refresh-order', 'feedback-updated'])

// ============================================
// 响应式数据
// ============================================

const a2uiRootRef = ref(null)
const isSubmitting = ref(false)
const isSubmitted = ref(false)

// ============================================
// 工具方法
// ============================================

/**
 * 根据 path 从 formData 中提取值
 * @param {Object} formData - 表单数据对象
 * @param {string} path - 数据路径，如 '/form/applyDate'
 * @returns {*} - 对应的值
 */
const getFormDataValueByPath = (formData, path) => {
  if (!path || !formData) return undefined

  const pathParts = path.replace(/^\//, '').split('/')
  let current = formData

  for (const part of pathParts) {
    if (current === undefined || current === null) return undefined
    current = current[part]
  }

  return current
}

/**
 * 解析 JSON 字符串或返回原数组
 * @param {string|Array} data - 数据
 * @returns {Array|null} - 解析后的数组
 */
const parseNodeList = (data) => {
  if (!data) return null

  let nodeList = data
  if (typeof data === 'string') {
    try {
      nodeList = JSON.parse(data)
    } catch (e) {
      return null
    }
  }

  return Array.isArray(nodeList) ? nodeList : null
}

/**
 * 从 rawContent 中提取节点数组
 * @param {string} rawContent - 原始 JSON 字符串
 * @returns {Object} - { nodeList, parsedData } 或 null
 */
const extractNodeListFromRawContent = (rawContent) => {
  if (!rawContent) return null

  try {
    const parsedData = JSON.parse(rawContent)
    let nodeList = parsedData.formInfo || parsedData

    if (!Array.isArray(nodeList) && Array.isArray(parsedData)) {
      nodeList = parsedData
    }

    if (!Array.isArray(nodeList)) {
      return null
    }

    return { nodeList, parsedData }
  } catch (e) {
    return null
  }
}

/**
 * 更新节点列表的 value.default 值
 * @param {Array} nodeList - 节点数组
 * @param {Object} formData - 表单数据
 * @returns {Array} - 更新后的节点数组
 */
const updateNodeListDefaultValues = (nodeList, formData) => {
  return nodeList.map(node => {
    if (node.value && node.value.path) {
      const userValue = getFormDataValueByPath(formData, node.value.path)
      node.value.default = userValue !== undefined && userValue !== null ? userValue : ''
    }
    return node
  })
}

/**
 * 重建提交 JSON
 * @param {Object} parsedData - 解析后的数据
 * @param {Array} nodeList - 更新后的节点数组
 * @returns {string} - JSON 字符串
 */
const buildUpdatedSubmitJson = (parsedData, nodeList) => {
  if (parsedData.formInfo) {
    parsedData.formInfo = nodeList
    return JSON.stringify(parsedData)
  }
  return JSON.stringify(nodeList)
}

// ============================================
// 表单渲染方法
// ============================================

/**
 * 禁用节点列表中的可输入组件和按钮
 * @param {Array} nodeList - 节点数组
 * @param {boolean} disableAll - 是否禁用所有可输入组件
 * @returns {Array} - 更新后的节点数组
 */
const disableNodes = (nodeList, disableAll = false) => {
  return nodeList.map(node => {
    // 禁用提交按钮
    if (node.id === 'submit-btn') {
      return { ...node, disabled: true }
    }
    // 禁用所有可输入组件
    if (disableAll && INPUT_COMPONENT_TYPES.includes(node.component)) {
      return { ...node, disabled: true }
    }
    // 禁用按钮组件（有默认值的按钮除外）
    if (disableAll && node.component === 'Button') {
      // 如果按钮有默认值（value.default），则正常显示，不禁用
      if (node.value && node.value.default !== undefined && node.value.default !== null && node.value.default !== '') {
        return node
      }
      return { ...node, disabled: true }
    }
    return node
  })
}

/**
 * 重新渲染表单
 * @param {Array} nodeList - 节点数组
 */
const renderForm = (nodeList) => {
  if (a2uiRootRef.value && nodeList) {
    a2uiRootRef.value.processMessage({
      type: 'node',
      node: nodeList
    })
  }
}

/**
 * 禁用表单所有组件
 */
const disableAllFormComponents = () => {
  const nodeList = parseNodeList(props.formInfo)
  if (nodeList) {
    renderForm(disableNodes(nodeList, true))
  }
}

// ============================================
// 提交工单相关方法
// ============================================

/**
 * 获取当前表单数据
 * @returns {Object} - 表单数据
 */
const getCurrentFormData = () => {
  return a2uiRootRef.value?.getFormData?.() || {}
}

/**
 * 构建提交数据
 * @returns {string|null} - 更新后的 JSON 字符串
 */
const buildSubmitData = () => {
  const extracted = extractNodeListFromRawContent(props.rawContent)
  if (!extracted) return null

  const formData = getCurrentFormData()
  const updatedNodeList = updateNodeListDefaultValues(extracted.nodeList, formData)
  return buildUpdatedSubmitJson(extracted.parsedData, updatedNodeList)
}

/**
 * 处理提交响应
 * @param {Object} result - API 返回结果
 */
const handleSubmitResponse = (result) => {
  if (!result || result.code !== 200) return

  isSubmitted.value = true

  // 保存返回的工单ID，供后续反馈更新使用
  if (result.data?.id) {
    chatMessageService.saveOrderId(result.data.id)
  }

  // 解析返回的 content
  const responseContent = result.data?.message?.content
  let parsedContent = null

  if (responseContent) {
    try {
      parsedContent = JSON.parse(responseContent)
    } catch (e) {
    }
  }

  // 禁用所有表单组件
  disableAllFormComponents()

  // 根据返回内容触发相应事件
  if (parsedContent?.hasfull === false && parsedContent.tip) {
    emit('submit-success', { tip: parsedContent.tip })
  } else {
    emit('submit-success')
  }
}

/**
 * 执行提交工单
 */
const executeSubmitWorkOrder = async () => {
  const submitJson = buildSubmitData()
  if (!submitJson) {
    return
  }

  const result = await submitWorkOrder({
    submitJson,
    conversationId: chatMessageService.getCurrentConversationId(),
    systemName: chatMessageService.getCurrentSystemName(),
    userName: chatMessageService.getCurrentUserName()
  })

  handleSubmitResponse(result)
}

/**
 * 执行反馈更新
 * 1. 在被点击的按钮节点上添加 value 属性
 * 2. 删除对侧反馈按钮节点
 * 3. 调用 updateOrder 接口
 * @param {string} eventName - 事件名称 feedbackResolved 或 feedbackUnresolved
 */
const executeFeedbackUpdate = async (eventName) => {
  const extracted = extractNodeListFromRawContent(props.rawContent)
  if (!extracted) return

  const { nodeList, parsedData } = extracted
  const feedbackValue = eventName === 'feedbackResolved' ? 'RESOLVED' : 'UNRESOLVED'

  // 1. 找到被点击的按钮节点，添加 value 属性
  const targetNode = nodeList.find(node => node.action?.event?.name === eventName)
  if (targetNode) {
    targetNode.value = {
      path: '/form/feedback',
      default: feedbackValue
    }
  }

  // 2. 保留所有节点，仅更新被点击按钮的 value

  // 3. 构建更新后的 JSON
  const isSolvedJson = buildUpdatedSubmitJson(parsedData, nodeList)

  // 4. 调用 updateOrder 接口
  try {
    const result = await updateOrder({
      id: chatMessageService.getCurrentOrderId(),
      conversationId: chatMessageService.getCurrentConversationId(),
      feedbackRecord: feedbackValue,
      isSolvedJson
    })

    if (result && result.code === 200) {
      // 通知父组件更新历史会话
      emit('refresh-order')
      // 更新成功，处理反馈按钮状态
      nodeList.forEach(node => {
        const nodeEventName = node.action?.event?.name
        const isFeedbackBtn = nodeEventName === 'feedbackResolved' || nodeEventName === 'feedbackUnresolved'
        if (isFeedbackBtn) {
          // 移除 action，防止再次触发点击事件
          delete node.action
          // 没有默认值的按钮显示禁用状态（灰色）
          if (!node.value?.default) {
            node.disabled = true
          }
        }
      })
      // 刷新表单显示
      renderForm(nodeList)
      // 通知父组件 feedbackRecord 已更新，触发满意度卡片显示
      emit('feedback-updated', { feedbackRecord: feedbackValue })
    }
  } catch (error) {
    console.error('反馈提交失败:', error)
  }
}

// ============================================
// 事件处理方法
// ============================================

/**
 * 处理 A2UI 消息
 */
const handleA2UIMessage = async (payload) => {
  if (payload.type !== 'action') return

  const eventName = payload.payload.eventName
  emit('form-submit', eventName)

  // 处理 feedbackResolved 和 feedbackUnresolved 事件
  if (eventName === 'feedbackResolved' || eventName === 'feedbackUnresolved') {
    await executeFeedbackUpdate(eventName)
    return
  }

  if (eventName !== 'submitWorkOrder' || isSubmitted.value) return

  try {
    isSubmitting.value = true
    chatMessageService.setFormSubmitting(true)
    await executeSubmitWorkOrder()
  } catch (error) {
  } finally {
    isSubmitting.value = false
    chatMessageService.setFormSubmitting(false)
  }
}

/**
 * 处理 A2UI 完成事件
 */
const handleA2UIComplete = () => {
}

/**
 * 处理 formInfo 渲染
 */
const processFormInfo = () => {
  if (!props.hasFull || !props.formInfo || !a2uiRootRef.value) return

  const nodeList = parseNodeList(props.formInfo)
  if (!nodeList) return

  // 处理反馈按钮：如果 JSON 中已有默认值，移除 action 使其不可点击，但保持正常样式
  nodeList.forEach(node => {
    const nodeEventName = node.action?.event?.name
    const isFeedbackBtn = nodeEventName === 'feedbackResolved' || nodeEventName === 'feedbackUnresolved'
    if (isFeedbackBtn && node.value?.default) {
      delete node.action
    }
  })

  renderForm(props.disabled ? disableNodes(nodeList, true) : nodeList)
}

// ============================================
// 生命周期
// ============================================

watch(() => props.formInfo, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    nextTick(() => processFormInfo())
  }
})

watch(() => props.disabled, (newVal) => {
  nextTick(() => processFormInfo())
  if (!newVal) {
    isSubmitted.value = false
  }
})

onMounted(() => {
  nextTick(() => processFormInfo())
})
</script>

<style scoped>
/* 表单容器样式 */
.a2ui-form-container {
  padding: 16px;
  border-radius: 18px;
  margin-bottom: 8px;
  background-color: #F8FAFC;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 4px;
  max-width: 100%;
  min-width: 300px;
}

/* 修复 a2ui 组件图标样式 */
.a2ui-form-container ::v-deep(.card-header-box) {
  box-sizing: content-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.a2ui-form-container ::v-deep(.card-header-icon) {
  display: block;
  max-width: none;
  max-height: none;
}

/* 提交 loading 遮罩 */
.form-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 18px;
  gap: 12px;
}

.form-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.form-loading-text {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
