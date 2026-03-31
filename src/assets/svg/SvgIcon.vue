<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="viewBox"
    :class="className"
    :style="iconStyle"
  >
    <path
      v-for="(path, index) in paths"
      :key="index"
      :d="path"
    />
  </svg>
</template>

<script setup>
import { computed } from 'vue'
import { IconPaths } from './IconPaths'

// Props
const props = defineProps({
  name: {
    type: String,
    required: true
  },
  width: {
    type: [String, Number],
    default: 20
  },
  height: {
    type: [String, Number],
    default: 20
  },
  className: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: 'currentColor'
  }
})

// 计算属性
const icon = computed(() => {
  return IconPaths[props.name] || null
})

const paths = computed(() => {
  return icon.value ? icon.value.paths : []
})

const viewBox = computed(() => {
  return icon.value ? icon.value.viewBox : '0 0 24 24'
})

const iconStyle = computed(() => {
  return {
    fill: 'none',
    stroke: props.color,
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  }
})
</script>
