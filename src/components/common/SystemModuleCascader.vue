<template>
  <div class="cascade-select-wrapper">
    <template v-for="(item, index) in treeData" :key="item.code">
      <CustomCascader
        v-model="cascaderValues[index]"
        :options="item.children"
        :props="cascaderProps"
        :placeholder="loading ? '加载中...' : item.name"
        @change="(value) => handleCascadeChange(value, index, item)"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getSystemConfigTree } from '../../api'
import CustomCascader from './CustomCascader.vue'

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
const emit = defineEmits(['update:modelValue', 'change'])

// 响应式数据
const treeData = ref([])
const cascaderValues = ref([])  // 每个级联选择器独立的值数组
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
      // 初始化每个级联选择器的值数组
      cascaderValues.value = res.data.map(() => [])
    } else {
      treeData.value = []
      cascaderValues.value = []
    }
  } catch (error) {
    console.error('加载系统配置树失败:', error)
    treeData.value = []
    cascaderValues.value = []
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

  // 构建选中路径的名称
  let systemName = [systemItem.name]
  value.forEach(code => {
    const node = findSystemByCode(code)
    if (node && node.name) {
      systemName.push(node.name)
    }
  })

  emit('update:modelValue', systemName.join("-"))
  emit('change', { value, systemItem, index })
}

/**
 * 重置选择
 */
const resetSelection = () => {
  cascaderValues.value = cascaderValues.value.map(() => [])
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


</style>
