<template>
  <div class="back-to-current" @click="handleClick">
    <div class="back-to-current-text">回到当前聊天</div>
    <div class="back-to-current-icon">
      <SvgIcon name="arrow" width="16" height="16" />
    </div>
  </div>
</template>

<script setup>
import SvgIcon from '../../assets/svg/SvgIcon.vue'

// Emits
const emit = defineEmits(['click'])

/**
 * 处理点击事件
 */
const handleClick = () => {
  emit('click')
}
</script>

<style scoped>
.back-to-current {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.back-to-current:hover {
  background: linear-gradient(135deg, #e1bee7 0%, #ce93d8 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.back-to-current-icon {
  font-size: 16px;
  color: #673ab7;
}

.back-to-current-text {
  font-size: 14px;
  color: #673ab7;
  font-weight: 600;
  flex: 1;
}
</style>
