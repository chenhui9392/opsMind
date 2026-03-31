<template>
  <div class="search-box">
    <div class="search-container">
      <input
        type="text"
        :value="modelValue"
        @input="handleInput"
        class="search-input"
        :placeholder="placeholder"
      />
      <button
        v-if="modelValue"
        class="search-clear-button"
        @click="clearSearch"
      >
        <SvgIcon name="clear" width="14" height="14" />
      </button>
    </div>
  </div>
</template>

<script setup>
import SvgIcon from '../../assets/svg/SvgIcon.vue'

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '搜索...'
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'search', 'clear'])

/**
 * 处理输入
 * @param {Event} event - 输入事件
 */
const handleInput = (event) => {
  const value = event.target.value
  emit('update:modelValue', value)
  emit('search', value)
}

/**
 * 清除搜索
 */
const clearSearch = () => {
  emit('update:modelValue', '')
  emit('clear')
  emit('search', '')
}
</script>

<style scoped>
.search-box {
  padding: 12px 16px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.search-container {
  width: 100%;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  background-color: white;
  color: #333;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #673ab7;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
}

.search-input::placeholder {
  color: #999;
}

.search-clear-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background-color: #e0e0e0;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.search-clear-button:hover {
  background-color: #d0d0d0;
  transform: translateY(-50%) scale(1.1);
}
</style>
