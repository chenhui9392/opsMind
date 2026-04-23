<!--
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-04-23 14:05:58
 * @LastEditTime: 2026-04-23 14:06:14
 * @LastEditors: hui.chenn
-->
<template>
  <div class="custom-cascader-demo">
    <h2>自定义级联选择组件演示</h2>

    <div class="demo-section">
      <h3>基础用法</h3>
      <div class="cascade-select-wrapper">
        <template v-for="item in treeData" :key="item.code">
          <CustomCascader
            v-model="cascaderValue"
            :options="item.children"
            :props="cascaderProps"
            :placeholder="loading ? '加载中...' : item.name"
            @change="handleCascadeChange"
          />
        </template>
      </div>
    </div>

    <div class="demo-section">
      <h3>当前选中值</h3>
      <div class="value-display">
        <p><strong>值路径:</strong> {{ JSON.stringify(cascaderValue) }}</p>
        <p><strong>显示文本:</strong> {{ displayText || '未选择' }}</p>
      </div>
    </div>

    <div class="demo-section">
      <h3>操作按钮</h3>
      <div class="action-buttons">
        <button class="btn btn-primary" @click="resetSelection">重置选择</button>
        <button class="btn btn-secondary" @click="loadData">重新加载数据</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import CustomCascader from '../components/common/CustomCascader.vue'
import { getSystemConfigTree } from '../api'

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

// 显示的文本
const displayText = computed(() => {
  if (!cascaderValue.value || cascaderValue.value.length === 0) return ''
  const labels = findPathLabels(cascaderValue.value)
  return labels.join(' / ')
})

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
 * 根据值路径查找标签路径
 * @param {Array} valuePath - 值路径数组
 * @returns {Array} - 标签路径数组
 */
const findPathLabels = (valuePath) => {
  const labels = []
  let currentOptions = treeData.value

  for (const value of valuePath) {
    const item = findSystemByCode(value, currentOptions)
    if (item) {
      labels.push(item.name)
      currentOptions = item.children || []
    } else {
      break
    }
  }

  return labels
}

/**
 * 处理级联选择变化
 * @param {Array} value - 选择值数组
 */
const handleCascadeChange = (value) => {
  const systemName = []
  value.forEach(code => {
    const node = findSystemByCode(code)
    if (node) {
      systemName.push(node.name)
    }
  })
  console.log('选中值:', value)
  console.log('系统名称:', systemName.join('-'))
}

/**
 * 重置选择
 */
const resetSelection = () => {
  cascaderValue.value = []
}

/**
 * 重新加载数据
 */
const loadData = () => {
  loadTreeData()
}

// 初始化
onMounted(() => {
  loadTreeData()
})
</script>

<style scoped>
.custom-cascader-demo {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  color: #303133;
  margin-bottom: 24px;
  font-size: 24px;
}

.demo-section {
  margin-bottom: 32px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.demo-section h3 {
  color: #606266;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 500;
}

/* 级联选择器容器 */
.cascade-select-wrapper {
  padding: 8px 16px;
  background-color: #ffffff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
}

.value-display {
  background-color: #ffffff;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.value-display p {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
}

.value-display strong {
  color: #303133;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: #6A70D7;
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #5a60c7;
}

.btn-secondary {
  background-color: #f0f2ff;
  color: #6A70D7;
  border: 1px solid #6A70D7;
}

.btn-secondary:hover {
  background-color: #e8eaf6;
}
</style>
