<template>
  <div class="cascade-select-wrapper">
    <template v-for="item in treeData">
      <el-cascader
        v-model="cascaderValue"
        :options="item.children"
        :props="cascaderProps"
        :placeholder="loading ? '加载中...' : item.name"
        @change="handleCascadeChange"
        class="system-cascader"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { getSystemConfigTree } from '../../api'

// Props
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
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
const emit = defineEmits(['update:modelValue', 'change', 'update:systemModule'])

// 响应式数据
const treeData = ref([])
const cascaderValue = ref([])
const loading = ref(false)

// Cascader 配置
const cascaderProps = {
  value: 'code',
  label: 'name',
  children: 'children'
}
/**
 * 从接口加载树形数据
 */
const loadTreeData = async () => {
  loading.value = true
  try {
    const res = await getSystemConfigTree()
    if (res.code === 200 && res.data) {
      treeData.value = res.data
    } else {
      treeData.value = []
    }
  } catch (error) {
    console.error('加载系统配置树失败:', error)
    treeData.value = []
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
 */
const handleCascadeChange = (value) => {
  let systemName = []
  value.map(code => {
    systemName.push(findSystemByCode(code)?.name)
  })
  emit('update:modelValue', systemName.join("-"))
}

/**
 * 重置选择
 */
const resetSelection = () => {
  cascaderValue.value = []
}

// 初始化
onMounted(() => {
  loadTreeData()
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
}

/* Element Plus Cascader 样式 - 标签风格 */
.system-cascader {
  width: auto;
}

/* 调整输入框宽度为自适应内容 */
.system-cascader :deep(.el-input) {
  width: auto !important;
}

/* 调整箭头与文字的间距 */
.system-cascader :deep(.el-input__suffix) {
  margin-left: 4px !important;
}

/* 覆盖 Element Plus 默认样式 - 使用更高优先级 */
:deep(.el-input__wrapper),
:deep(.el-input.is-focus .el-input__wrapper),
:deep(.el-input:hover .el-input__wrapper) {
  border-radius: 8px !important;
  background-color: #f0f2ff !important;
  border: none !important;
  box-shadow: none !important;
  padding: 6px 12px !important;
  min-height: 32px !important;
  color: #6A70D7 !important;
}

:deep(.el-input__inner) {
  font-size: 14px !important;
  color: #6A70D7 !important;
  font-weight: 500 !important;
  font-weight: bold !important;
}

/* placeholder 文字颜色 */
:deep(.el-input__inner::placeholder) {
  color: #6A70D7 !important;
  font-weight: bold !important;
}

:deep(.el-input__suffix-inner) {
  color: #5c6bc0 !important;
}

.system-cascader :deep(.el-input .el-icon) {
  color: #5c6bc0 !important;
}

/* 选中后的标签样式 */
:deep(.el-input.is-focus .el-input__wrapper) {
  background-color: #e8eaf6 !important;
}

/* 级联下拉菜单样式 */
.system-cascader :deep(.el-cascader__dropdown) {
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.system-cascader :deep(.el-cascader-node) {
  font-size: 14px;
  padding: 8px 16px;
}

.system-cascader :deep(.el-cascader-node.is-active) {
  color: #6366f1;
  font-weight: 500;
}

.system-cascader :deep(.el-cascader-node.in-active-path) {
  color: #6366f1;
}

.system-cascader :deep(.el-cascader-node:hover) {
  background-color: #f5f5f5;
}
</style>
