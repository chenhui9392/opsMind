<!--
 * @Author: hui.chenn
 * @Description:
 * @Date: 2026-04-23 14:05:20
 * @LastEditTime: 2026-04-23 14:19:37
 * @LastEditors: hui.chenn
-->
<template>
  <div class="custom-cascader-wrapper">
    <!-- 触发器输入框 -->
    <div
      ref="triggerRef"
      class="custom-cascader-trigger"
      :class="{ 'has-value': hasValue, 'is-open': isOpen, 'is-disabled': disabled }"
      @click="toggleDropdown"
    >
      <span class="trigger-icon">
        <svg viewBox="0 0 24 24" width="14" height="14">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2"/>
          <rect x="7" y="7" width="6" height="6" rx="1" ry="1" fill="currentColor"/>
        </svg>
      </span>
      <span v-if="hasValue" class="selected-text">{{ displayText }}</span>
      <span v-else class="placeholder-text">{{ placeholder }}</span>
      <!-- 清除按钮 -->
      <span
        v-if="hasValue && clearable && !disabled"
        class="clear-btn"
        @click.stop="clearSelection"
      >
        ×
      </span>
    </div>

    <!-- 下拉面板 -->
    <Teleport to="body">
      <Transition name="cascader-dropdown">
        <div
          v-show="isOpen"
          ref="dropdownRef"
          class="custom-cascader-dropdown"
          :style="dropdownStyle"
        >
          <!-- 搜索框（固定在顶部，仅在第一级超过10条时显示） -->
          <div v-if="needSearch" class="cascader-search-box">
            <div class="search-input-wrapper">
              <input
                v-model="searchKeyword"
                type="text"
                class="search-input"
                placeholder="搜索..."
                @click.stop
              />
              <button
                v-if="searchKeyword"
                class="search-clear-btn"
                @click.stop="clearSearch"
              >
                ×
              </button>
            </div>
          </div>
          <!-- 级联面板 -->
          <div class="cascader-menus">
            <div
              v-for="(menu, level) in visibleMenuList"
              :key="level"
              class="cascader-menu"
            >
              <div
                v-for="item in menu"
                :key="getValue(item)"
                class="cascader-node"
                :class="{
                  'is-active': isActive(item, level),
                  'is-disabled': getDisabled(item)
                }"
                @click="handleNodeClick(item, level)"
              >
                <span class="node-label">{{ getLabel(item) }}</span>
                <span v-if="hasChildren(item)" class="node-arrow">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

// Props 定义 - 仿照 Element Plus el-cascader
const props = defineProps({
  // 绑定值
  modelValue: {
    type: Array,
    default: () => []
  },
  // 选项数据
  options: {
    type: Array,
    default: () => []
  },
  // 配置选项
  props: {
    type: Object,
    default: () => ({
      value: 'value',
      label: 'label',
      children: 'children',
      disabled: 'disabled'
    })
  },
  // 占位文本
  placeholder: {
    type: String,
    default: '请选择'
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 分隔符
  separator: {
    type: String,
    default: ' / '
  },
  // 是否可清空
  clearable: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'change', 'clear'])

/**
 * 统计当前菜单的节点总数（只统计第一级）
 */
const totalNodesCount = computed(() => {
  const firstMenu = props.options
  return firstMenu ? firstMenu.length : 0
})

/**
 * 是否需要显示搜索框（第一级超过10条）
 */
const needSearch = computed(() => totalNodesCount.value > 10)

// 响应式数据
const isOpen = ref(false)
const triggerRef = ref(null)
const dropdownRef = ref(null)
const dropdownStyle = ref({})
const activePath = ref([]) // 当前激活的路径
const searchKeyword = ref('') // 搜索关键词
const menuRefs = ref([]) // 菜单DOM引用，用于滚动定位

// 合并 props 配置
const config = computed(() => ({
  value: props.props.value || 'value',
  label: props.props.label || 'label',
  children: props.props.children || 'children',
  disabled: props.props.disabled || 'disabled'
}))

// 是否有选中值
const hasValue = computed(() => props.modelValue && props.modelValue.length > 0)

// 获取值的 key
const getValue = (item) => item[config.value.value]
// 获取标签的 key
const getLabel = (item) => item[config.value.label]
// 获取子节点的 key
const getChildren = (item) => item[config.value.children]
// 获取禁用状态的 key
const getDisabled = (item) => item[config.value.disabled] || false
// 判断是否有子节点
const hasChildren = (item) => {
  const children = getChildren(item)
  return children && children.length > 0
}

// 显示的文本
const displayText = computed(() => {
  if (!hasValue.value) return ''
  const labels = findPathLabels(props.modelValue)
  return labels.join(props.separator)
})

/**
 * 根据搜索关键词过滤第一级选项
 */
const filteredFirstLevelOptions = computed(() => {
  if (!searchKeyword.value || !needSearch.value) {
    return props.options
  }
  const keyword = searchKeyword.value.toLowerCase()
  return props.options.filter(item => {
    const label = getLabel(item)
    return label && label.toLowerCase().includes(keyword)
  })
})

// 菜单列表（多级）
const menuList = computed(() => {
  const menus = []
  let currentOptions = filteredFirstLevelOptions.value

  // 第一级菜单
  if (currentOptions && currentOptions.length > 0) {
    menus.push(currentOptions)
  }

  // 根据激活路径生成后续菜单
  for (let i = 0; i < activePath.value.length; i++) {
    const activeItem = activePath.value[i]
    const children = getChildren(activeItem)
    if (children && children.length > 0) {
      menus.push(children)
    }
  }

  return menus
})

// 可见的菜单列表（只显示有内容的菜单）
const visibleMenuList = computed(() => {
  return menuList.value.filter(menu => menu && menu.length > 0)
})

/**
 * 根据值路径查找标签路径
 * @param {Array} valuePath - 值路径数组
 * @returns {Array} - 标签路径数组
 */
const findPathLabels = (valuePath) => {
  const labels = []
  let currentOptions = props.options

  for (const value of valuePath) {
    const item = currentOptions.find(opt => getValue(opt) === value)
    if (item) {
      labels.push(getLabel(item))
      currentOptions = getChildren(item) || []
    } else {
      break
    }
  }

  return labels
}

/**
 * 根据值路径查找节点路径
 * @param {Array} valuePath - 值路径数组
 * @returns {Array} - 节点路径数组
 */
const findPathNodes = (valuePath) => {
  const nodes = []
  let currentOptions = props.options

  for (const value of valuePath) {
    const item = currentOptions.find(opt => getValue(opt) === value)
    if (item) {
      nodes.push(item)
      currentOptions = getChildren(item) || []
    } else {
      break
    }
  }

  return nodes
}

/**
 * 判断节点是否激活
 * @param {Object} item - 节点数据
 * @param {number} level - 层级
 * @returns {boolean}
 */
const isActive = (item, level) => {
  const activeItem = activePath.value[level]
  return activeItem && getValue(activeItem) === getValue(item)
}

/**
 * 处理节点点击
 * @param {Object} item - 节点数据
 * @param {number} level - 层级
 */
const handleNodeClick = (item, level) => {
  if (getDisabled(item)) return

  // 更新激活路径
  const newPath = activePath.value.slice(0, level)
  newPath.push(item)
  activePath.value = newPath

  // 如果没有子节点，则选中并关闭
  if (!hasChildren(item)) {
    const valuePath = newPath.map(node => getValue(node))
    emit('update:modelValue', valuePath)
    emit('change', valuePath)
    closeDropdown()
  } else {
    // 有子节点，面板保持打开，更新下拉面板位置防止断开
    nextTick(() => {
      updateDropdownPosition()
    })
  }
}

/**
 * 切换下拉面板
 */
const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value ? closeDropdown() : openDropdown()
}

/**
 * 清除搜索关键词并还原所有级联内容
 */
const clearSearch = () => {
  searchKeyword.value = ''
  activePath.value = []
}

/**
 * 清除选中数据
 */
const clearSelection = () => {
  emit('update:modelValue', [])
  emit('change', [])
  emit('clear')
  activePath.value = []
  searchKeyword.value = ''
}

/**
 * 打开下拉面板
 */
const openDropdown = () => {
  isOpen.value = true
  // 如果有值，设置激活路径
  if (hasValue.value) {
    activePath.value = findPathNodes(props.modelValue)
  }
  nextTick(() => {
    updateDropdownPosition()
  })
}

/**
 * 关闭下拉面板
 */
const closeDropdown = () => {
  isOpen.value = false
  activePath.value = []
  searchKeyword.value = ''
}

/**
 * 滚动到选中项
 */
const scrollToSelectedItem = () => {
  nextTick(() => {
    // 遍历每一级菜单，滚动到激活的节点
    const menuElements = dropdownRef.value?.querySelectorAll('.cascader-menu')
    if (!menuElements) return

    menuElements.forEach((menuEl, level) => {
      const activeEl = menuEl.querySelector('.cascader-node.is-active')
      if (activeEl) {
        // 将激活节点滚动到可视区域中心
        activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    })
  })
}

/**
 * 更新下拉面板位置
 */
const updateDropdownPosition = () => {
  if (!triggerRef.value || !dropdownRef.value) return

  const triggerRect = triggerRef.value.getBoundingClientRect()
  const windowHeight = window.innerHeight

  // 根据菜单数量计算下拉面板宽度
  const menuCount = visibleMenuList.value.length
  const menuWidth = 216 // 每个菜单固定宽度
  const dropdownWidth = menuCount * menuWidth

  // 固定高度（搜索框40px + 菜单区域300px = 340px，有搜索框时为340px）
  const dropdownHeight = 340

  // 判断下方空间是否足够
  const spaceBelow = windowHeight - triggerRect.bottom
  const spaceAbove = triggerRect.top

  let top, left

  if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
    // 显示在下方
    top = triggerRect.bottom + 8
    left = triggerRect.left
  } else {
    // 显示在上方
    top = triggerRect.top - dropdownHeight - 8
    left = triggerRect.left
  }

  dropdownStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    width: `${dropdownWidth}px`,
    zIndex: 9999
  }
}

/**
 * 点击外部关闭
 * @param {Event} event
 */
const handleClickOutside = (event) => {
  if (
    triggerRef.value && !triggerRef.value.contains(event.target) &&
    dropdownRef.value && !dropdownRef.value.contains(event.target)
  ) {
    closeDropdown()
  }
}

/**
 * 处理滚动事件
 */
const handleScroll = () => {
  if (isOpen.value) {
    updateDropdownPosition()
  }
}

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  if (newVal && newVal.length > 0) {
    activePath.value = findPathNodes(newVal)
  } else {
    activePath.value = []
  }
}, { immediate: true })

// 监听搜索关键词变化，搜索时清空子级数据并更新面板宽度
watch(searchKeyword, (newVal) => {
  if (newVal) {
    activePath.value = []
    // 清空子级后需要更新下拉面板宽度
    nextTick(() => {
      updateDropdownPosition()
    })
  }
})

// 监听菜单数量变化，更新下拉面板宽度
watch(visibleMenuList, () => {
  if (isOpen.value) {
    nextTick(() => {
      updateDropdownPosition()
    })
  }
})

// 监听 dropdown 打开状态，打开时滚动到选中项
watch(isOpen, (newVal) => {
  if (newVal && hasValue.value) {
    nextTick(() => {
      scrollToSelectedItem()
    })
  }
})

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('resize', handleScroll)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleScroll)
})

// 暴露方法
defineExpose({
  openDropdown,
  closeDropdown
})
</script>

<style scoped>
/* 级联选择器容器 */
.custom-cascader-wrapper {
  position: relative;
  display: inline-block;
  width: auto;
  min-width: 120px;
  /* flex: 1; */
}

/* 触发器样式 - 默认状态 */
.custom-cascader-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  min-height: 28px;
  border-radius: 4px;
  /* background-color: #ffffff; */
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  position: relative;
}

.custom-cascader-trigger:hover:not(.is-disabled) {
  background-color: #f5f5f5;
}

.custom-cascader-trigger.is-open {
  background-color: #f5f5f5;
}

.custom-cascader-trigger.is-disabled {
  background-color: #f5f7fa;
  cursor: not-allowed;
  opacity: 0.6;
}

/* 触发器图标 */
.trigger-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  color: #8c8c8c;
  flex-shrink: 0;
  height: 14px;
  line-height: 1;
}

/* 占位文本 */
.placeholder-text {
  color: #8c8c8c;
  font-weight: 400;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 14px;
}

/* 选中文本 - 默认状态 */
.selected-text {
  color: #333;
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 14px;
  padding-right: 18px;
}

/* 选中状态样式 */

.custom-cascader-trigger.has-value .selected-text {
  color: #2260FA;
  font-weight: bold;
}

.custom-cascader-trigger.has-value .trigger-icon {
  color: #2260FA;
}

.custom-cascader-trigger.has-value:hover:not(.is-disabled) {
  background-color: #e0eaff;
}

/* 清除按钮 */
.clear-btn {
  position: absolute;
  top: 1px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #c0c4cc;
  color: #ffffff;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}

.clear-btn:hover {
  background-color: #909399;
}

/* 下拉面板样式 */
.custom-cascader-dropdown {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 340px;
}

/* 搜索框样式 */
.cascader-search-box {
  padding: 8px 12px;
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  position: sticky;
  top: 0;
  z-index: 10;
}

.search-input-wrapper {
  position: relative;
  width: 170px;
}

.search-input {
  width: 100%;
  padding: 6px 32px 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  background-color: #f5f7fa;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #2260FA;
  background-color: #ffffff;
}

.search-input::placeholder {
  color: #c0c4cc;
}

.search-clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background-color: #c0c4cc;
  color: #ffffff;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  line-height: 1;
  padding: 0;
}

.search-clear-btn:hover {
  background-color: #909399;
}

/* 级联菜单容器 */
.cascader-menus {
  display: flex;
  height: 300px;
  overflow: hidden;
}

/* 单个菜单 */
.cascader-menu {
  width: 216px;
  height: 300px;
  overflow-y: auto;
  border-right: 1px solid #e4e7ed;
  padding: 6px 0;
  flex-shrink: 0;
}

.cascader-menu:last-child {
  border-right: none;
}

/* 菜单节点 */
.cascader-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cascader-node:hover {
  background-color: #f5f7fa;
}

.cascader-node.is-active {
  color: #6A70D7;
  font-weight: 500;
  background-color: #f0f2ff;
}

.cascader-node.is-disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.cascader-node.is-disabled:hover {
  background-color: transparent;
}

/* 节点标签 */
.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 节点箭头 */
.node-arrow {
  display: flex;
  align-items: center;
  margin-left: 8px;
  color: #c0c4cc;
  flex-shrink: 0;
}

.cascader-node.is-active .node-arrow {
  color: #6A70D7;
}

/* 下拉面板动画 */
.cascader-dropdown-enter-active,
.cascader-dropdown-leave-active {
  transition: all 0.2s ease;
}

.cascader-dropdown-enter-from,
.cascader-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
