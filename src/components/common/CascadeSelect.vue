<!--
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-04-13 14:09:01
 * @LastEditTime: 2026-04-13 14:09:15
 * @LastEditors: hui.chenn
-->
<template>
  <div class="cascade-select">
    <!-- 第一级选择 -->
    <div class="select-wrapper">
      <button
        class="select-trigger"
        :class="{ 'active': showLevel1, 'selected': level1Value }"
        @click="toggleLevel1"
        :disabled="disabled"
      >
        <span class="select-text">{{ level1Label }}</span>
        <SvgIcon name="chevronRight" width="14" height="14" class="arrow-icon" />
      </button>
      <!-- 第一级下拉菜单 -->
      <div v-if="showLevel1" class="dropdown-menu level1-menu">
        <div
          v-for="item in level1Options"
          :key="item[valueKey]"
          class="dropdown-item"
          :class="{ 'active': level1Value === item[valueKey] }"
          @click="selectLevel1(item)"
        >
          <span class="item-text">{{ item[labelKey] }}</span>
          <SvgIcon
            v-if="hasChildren(item)"
            name="chevronRight"
            width="14"
            height="14"
            class="item-arrow"
          />
        </div>
      </div>
    </div>

    <!-- 第二级选择（如果有） -->
    <div v-if="showLevel2 && level2Options.length > 0" class="select-wrapper">
      <button
        class="select-trigger"
        :class="{ 'active': showLevel2Dropdown, 'selected': level2Value }"
        @click="toggleLevel2"
        :disabled="disabled || !level1Value"
      >
        <span class="select-text">{{ level2Label }}</span>
        <SvgIcon name="chevronRight" width="14" height="14" class="arrow-icon" />
      </button>
      <!-- 第二级下拉菜单 -->
      <div v-if="showLevel2Dropdown" class="dropdown-menu level2-menu">
        <div
          v-for="item in level2Options"
          :key="item[valueKey]"
          class="dropdown-item"
          :class="{ 'active': level2Value === item[valueKey] }"
          @click="selectLevel2(item)"
        >
          <span class="item-text">{{ item[labelKey] }}</span>
        </div>
      </div>
    </div>

    <!-- 遮罩层 -->
    <div v-if="showLevel1 || showLevel2Dropdown" class="overlay" @click="closeAll"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import SvgIcon from '../../assets/svg/SvgIcon.vue'

/**
 * CascadeSelect 级联选择组件
 * 支持一级或两级级联选择
 */

// Props
const props = defineProps({
  /**
   * 第一级选项列表
   */
  level1Options: {
    type: Array,
    default: () => []
  },
  /**
   * 第二级选项列表（根据第一级值动态获取）
   * 可以是数组或函数
   */
  level2Options: {
    type: [Array, Function],
    default: () => []
  },
  /**
   * 第一级选中值
   */
  level1Value: {
    type: [String, Number],
    default: ''
  },
  /**
   * 第二级选中值
   */
  level2Value: {
    type: [String, Number],
    default: ''
  },
  /**
   * 选项标签字段名
   */
  labelKey: {
    type: String,
    default: 'name'
  },
  /**
   * 选项值字段名
   */
  valueKey: {
    type: String,
    default: 'code'
  },
  /**
   * 子选项字段名（用于判断是否还有下级）
   */
  childrenKey: {
    type: String,
    default: 'children'
  },
  /**
   * 第一级占位文本
   */
  level1Placeholder: {
    type: String,
    default: '请选择'
  },
  /**
   * 第二级占位文本
   */
  level2Placeholder: {
    type: String,
    default: '请选择'
  },
  /**
   * 是否禁用
   */
  disabled: {
    type: Boolean,
    default: false
  },
  /**
   * 是否显示第二级
   */
  showLevel2: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits([
  'update:level1Value',
  'update:level2Value',
  'change'
])

// 响应式数据
const showLevel1 = ref(false)
const showLevel2Dropdown = ref(false)

// 计算属性
const level1Label = computed(() => {
  if (!props.level1Value) return props.level1Placeholder
  const item = props.level1Options.find(
    item => item[props.valueKey] === props.level1Value
  )
  return item ? item[props.labelKey] : props.level1Placeholder
})

const level2Label = computed(() => {
  if (!props.level2Value) return props.level2Placeholder
  const item = level2Options.value.find(
    item => item[props.valueKey] === props.level2Value
  )
  return item ? item[props.labelKey] : props.level2Placeholder
})

const level2Options = computed(() => {
  if (typeof props.level2Options === 'function') {
    return props.level2Options(props.level1Value) || []
  }
  return props.level2Options || []
})

// 方法
const hasChildren = (item) => {
  return item[props.childrenKey] && item[props.childrenKey].length > 0
}

const toggleLevel1 = () => {
  if (props.disabled) return
  showLevel1.value = !showLevel1.value
  showLevel2Dropdown.value = false
}

const toggleLevel2 = () => {
  if (props.disabled || !props.level1Value) return
  showLevel2Dropdown.value = !showLevel2Dropdown.value
  showLevel1.value = false
}

const closeAll = () => {
  showLevel1.value = false
  showLevel2Dropdown.value = false
}

const selectLevel1 = (item) => {
  const value = item[props.valueKey]
  emit('update:level1Value', value)
  emit('update:level2Value', '')
  emit('change', { level1: value, level2: '' })
  showLevel1.value = false

  // 如果没有子级，直接关闭
  if (!hasChildren(item) || !props.showLevel2) {
    showLevel2Dropdown.value = false
  } else {
    // 自动展开第二级
    showLevel2Dropdown.value = true
  }
}

const selectLevel2 = (item) => {
  const value = item[props.valueKey]
  emit('update:level2Value', value)
  emit('change', { level1: props.level1Value, level2: value })
  showLevel2Dropdown.value = false
}

// 监听 level1Value 变化，当清空时同时清空 level2
watch(() => props.level1Value, (newVal) => {
  if (!newVal) {
    emit('update:level2Value', '')
  }
})
</script>

<style scoped>
.cascade-select {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.select-wrapper {
  position: relative;
}

.select-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  background-color: #f5f5f5;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.select-trigger:hover:not(:disabled) {
  border-color: #667eea;
  background-color: #ffffff;
}

.select-trigger.active {
  border-color: #667eea;
  background-color: #ffffff;
}

.select-trigger.selected {
  color: #667eea;
  border-color: #667eea;
  background-color: rgba(102, 126, 234, 0.1);
}

.select-trigger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.arrow-icon {
  transition: transform 0.2s ease;
}

.select-trigger.active .arrow-icon {
  transform: rotate(90deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 160px;
  max-height: 280px;
  overflow-y: auto;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  padding: 8px 0;
}

.level2-menu {
  left: 100%;
  top: 0;
  margin-left: 4px;
  margin-top: 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 13px;
  color: #333;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-item.active {
  background-color: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.item-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-arrow {
  margin-left: 8px;
  color: #999;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
}
</style>
