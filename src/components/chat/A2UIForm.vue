<!--
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-04-29 11:49:56
 * @LastEditTime: 2026-04-29 11:50:07
 * @LastEditors: hui.chenn
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
import { submitWorkOrder } from '../../api'
import chatMessageService from '../../services/chatMessageService'

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
  orderStatus: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['form-submit', 'submit-success'])

// 响应式数据
const a2uiRootRef = ref(null)
const isSubmitting = ref(false)
const isSubmitted = ref(false)

/**
 * 处理 A2UI 消息
 */
const handleA2UIMessage = async (payload) => {
  if (payload.type === 'action') {
    const eventName = payload.payload.eventName
    emit('form-submit', eventName)

    // 处理提交工单事件
    if (eventName === 'submitWorkOrder') {
      // 如果已经提交成功，不再处理
      if (isSubmitted.value) {
        return
      }

      try {
        isSubmitting.value = true

        // 获取聊天接口返回的原始 content JSON 字符串作为 submitJson
        const submitJson = props.rawContent
        if (!submitJson) {
          console.error('原始 content 数据不存在')
          isSubmitting.value = false
          return
        }

        // 获取当前会话信息
        const conversationId = chatMessageService.getCurrentConversationId()
        const systemName = chatMessageService.getCurrentSystemName()
        const userName = chatMessageService.getCurrentUserName()

        const result = await submitWorkOrder({
          submitJson,
          conversationId,
          systemName,
          userName
        })

        console.log('工单提交返回:', result)

        // 检查接口返回是否成功
        if (result && result.code === 200) {
          isSubmitted.value = true

          // 解析返回的 content
          const responseContent = result.data?.message?.content
          let parsedContent = null
          if (responseContent) {
            try {
              parsedContent = JSON.parse(responseContent)
            } catch (e) {
              console.log('submit 返回的 content 不是 JSON:', responseContent)
            }
          }

          // 判断 hasfull 字段
          if (parsedContent && parsedContent.hasfull === false) {
            // hasfull=false：展示 tip 内容，禁用所有操作按钮
            const tipText = parsedContent.tip || '工单已提交'

            // 禁用表单提交按钮
            disableSubmitButton()

            // 在消息列表中追加 tip 消息
            emit('submit-success', { tip: tipText })
          } else {
            // hasfull=true 或其他情况：保持原有表单逻辑
            // 禁用表单提交按钮
            disableSubmitButton()
            // 通知父组件提交成功
            emit('submit-success')
          }
        }
      } catch (error) {
        console.error('工单提交失败:', error)
      } finally {
        isSubmitting.value = false
      }
    }
  }
}

/**
 * 禁用表单提交按钮
 * 通过更新 formInfo 中的按钮配置来禁用提交按钮
 */
const disableSubmitButton = () => {
  if (a2uiRootRef.value && props.formInfo) {
    try {
      // 解析当前的 formInfo
      let nodeList = props.formInfo
      if (typeof nodeList === 'string') {
        nodeList = JSON.parse(nodeList)
      }

      // 查找提交按钮节点并更新 disabled 属性
      const updatedNodeList = nodeList.map(node => {
        if (node.id === 'submit-btn') {
          return {
            ...node,
            disabled: true
          }
        }
        return node
      })

      // 重新渲染整个表单
      a2uiRootRef.value.processMessage({
        type: 'node',
        node: updatedNodeList
      })
    } catch (error) {
      console.error('禁用提交按钮失败:', error)
    }
  }
}

/**
 * 处理 A2UI 完成事件
 */
const handleA2UIComplete = () => {
  console.log('A2UI Complete')
}

/**
 * 处理 formInfo 渲染
 */
const processFormInfo = () => {
  if (props.hasFull && props.formInfo && a2uiRootRef.value) {
    const formInfoData = props.formInfo

    // 如果 formInfo 是字符串，先解析成数组
    let nodeList = formInfoData
    if (typeof formInfoData === 'string') {
      try {
        nodeList = JSON.parse(formInfoData)
      } catch (e) {
        console.error('Failed to parse formInfo:', e)
        return
      }
    }

    // 检查是否是数组
    if (Array.isArray(nodeList) && nodeList.length > 0) {
      // 如果是从历史会话进入且工单状态为【已创建】（非 DRAFT），禁用提交按钮
      const orderStatus = props.orderStatus
      if (orderStatus && orderStatus !== 'DRAFT') {
        nodeList = nodeList.map(node => {
          if (node.id === 'submit-btn') {
            return {
              ...node,
              disabled: true
            }
          }
          return node
        })
      }

      a2uiRootRef.value.processMessage({
        type: 'node',
        node: nodeList
      })
    }
  }
}

// 监听 formInfo 变化，重新渲染表单
watch(() => props.formInfo, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    nextTick(() => {
      processFormInfo()
    })
  }
})

// 生命周期钩子
onMounted(() => {
  nextTick(() => {
    processFormInfo()
  })
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

/* 修复 a2ui 组件图标样式被全局样式覆盖的问题 */
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

/* 表单提交 loading 遮罩 */
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
