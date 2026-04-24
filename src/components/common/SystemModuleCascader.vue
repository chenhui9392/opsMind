<template>
  <div class="cascade-select-wrapper">
    <!-- 加载中状态 -->
    <div v-if="loading" class="loading-placeholder">
      <span class="loading-text">加载中...</span>
    </div>
    <!-- 数据为空状态 -->
    <div
      v-else-if="treeData.length === 0"
      class="empty-placeholder"
      :class="{ 'error': loadError }"
      @click="loadTreeData"
    >
      <span class="empty-text">{{ loadError ? '加载失败，点击重试' : '点击加载系统选项' }}</span>
    </div>
    <!-- 正常渲染级联选择器 -->
    <template v-else v-for="(item, index) in treeData" :key="item.code">
      <CustomCascader
        v-model="cascaderValues[index]"
        :options="item.children"
        :props="cascaderProps"
        :placeholder="item.name"
        @change="(value) => handleCascadeChange(value, index, item)"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { getSystemConfigTree } from '../../api'
import CustomCascader from './CustomCascader.vue'

// Props
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ businessType: '', systemName: '', moduleName: '' })
  },
  disabled: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: '请选择系统和模块'
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'change'])

// 响应式数据
const treeData = ref([])
const cascaderValues = ref([])  // 每个级联选择器独立的值数组
const loading = ref(false)
const loadError = ref(false)
const retryCount = ref(0)
const MAX_RETRY = 3

// Cascader 配置
const cascaderProps = {
  value: 'code',
  label: 'name',
  children: 'children'
}
/**
 * 从接口加载树形数据
 * @param {boolean} isRetry - 是否为重试调用
 */
const loadTreeData = async (isRetry = false) => {
  if (loading.value) return

  loading.value = true
  loadError.value = false

  try {
    const res = await getSystemConfigTree()
    if (res.code === 200 && res.data && res.data.length > 0) {
      treeData.value = res.data
      // 初始化每个级联选择器的值数组
      cascaderValues.value = res.data.map(() => [])
      loadError.value = false
      retryCount.value = 0
    } else {
      throw new Error('返回数据为空或格式不正确')
    }
  } catch (error) {
    console.error('加载系统配置树失败:', error)
    loadError.value = true

    // 自动重试机制
    if (!isRetry && retryCount.value < MAX_RETRY) {
      retryCount.value++
      console.log(`级联选择器数据加载失败，${retryCount.value}秒后重试(${retryCount.value}/${MAX_RETRY})...`)
      setTimeout(() => {
        loadTreeData(true)
      }, retryCount.value * 1000)
    }
  } finally {
    loading.value = false
  }
}

/**
 * 根据 code 递归查找树形数据中的节点
 * @param {string} code - 节点 code
 * @param {Array} data - 树形数据，默认为 treeData.value
 * @returns {Object|null} - 找到的节点或 null
 */
const findSystemByCode = (code, data = treeData.value) => {
  for (const item of data) {
    if (item.code === code) {
      return item
    }
    if (item.children && item.children.length > 0) {
      const found = findSystemByCode(code, item.children)
      if (found) {
        return found
      }
    }
  }
  return null
}

/**
 * 处理级联选择变化
 * @param {Array} value - 选择值数组
 * @param {number} index - 当前级联选择器的索引
 * @param {Object} systemItem - 当前系统项数据
 */
const handleCascadeChange = (value, index, systemItem) => {
  // 重置其他级联选择器的值
  for (let i = 0; i < cascaderValues.value.length; i++) {
    if (i !== index) {
      cascaderValues.value[i] = []
    }
  }

  // 拆分三个字段：businessType, systemName, moduleName
  let systemNamePath = [systemItem.name]
  let businessType = systemItem.name
  let systemName = ''
  let moduleName = ''
  
  value.forEach(code => {
    const node = findSystemByCode(code)
    if (node && node.name) {
      systemNamePath.push(node.name)
      // 根据级联层级分配值
      if (value.indexOf(code) === 0) {
        systemName = node.name
      } else if (value.indexOf(code) === 1) {
        moduleName = node.name
      }
    }
  })

  // 发射拆分后的对象
  const cascaderData = {
    systemName: systemName,
    moduleName: moduleName,
    businessType: businessType
  }
  
  emit('update:modelValue', cascaderData)
  emit('change', { value, systemItem, index, cascaderData })
}

/**
 * 重置选择
 */
const resetSelection = () => {
  cascaderValues.value = cascaderValues.value.map(() => [])
}

// 初始化
onMounted(() => {
  // 使用 nextTick 确保组件完全挂载后再加载数据
  nextTick(() => {
    loadTreeData()
  })
})

// 暴露方法给父组件
defineExpose({
  resetSelection
})
</script>

<style scoped>
/* 级联选择器容器 */
.cascade-select-wrapper {
  padding: 8px 16px;
  background-color: #ffffff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
}

/* 加载中占位 */
.loading-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background-color: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.loading-text {
  font-size: 14px;
  color: #666;
}

/* 空数据占位 */
.empty-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  background-color: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  cursor: pointer;
}

.empty-text {
  font-size: 14px;
  color: #666;
}

.empty-placeholder:hover {
  background-color: #e8e8e8;
}

/* 错误状态样式 */
.empty-placeholder.error {
  border-color: #ff4d4f;
  background-color: #fff2f0;
}

.empty-placeholder.error .empty-text {
  color: #ff4d4f;
}
</style>
