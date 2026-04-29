<!--
 * @Author: hui.chenn
 * @Description:
 * @Date: 2026-04-27 16:12:24
 * @LastEditTime: 2026-04-27 16:12:51
 * @LastEditors: hui.chenn
-->
<template>
  <div class="satisfaction-bar">
    <span class="satisfaction-bar__title">您对我的回答满意吗？</span>
    <div class="satisfaction-bar__list">
      <div
        v-for="item in satisfactionList"
        :key="item.value"
        :class="['satisfaction-bar__item', { 'is-active': selectedValue === item.value, 'is-disabled': props.disabled }]"
        @click="handleClick(item.value)"
      >
        <img
          class="satisfaction-bar__icon"
          :src="selectedValue === item.value ? item.activeIcon : item.icon"
          :alt="item.label"
        />
        <span class="satisfaction-bar__label">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import icon01 from '../../assets/evaluation/evaluation_01.png'
import icon02 from '../../assets/evaluation/evaluation_02.png'
import icon03 from '../../assets/evaluation/evaluation_03.png'
import icon04 from '../../assets/evaluation/evaluation_04.png'
import icon05 from '../../assets/evaluation/evaluation_05.png'
import icon01Active from '../../assets/evaluation/evaluation_01_active.png'
import icon02Active from '../../assets/evaluation/evaluation_02_active.png'
import icon03Active from '../../assets/evaluation/evaluation_03_active.png'
import icon04Active from '../../assets/evaluation/evaluation_04_active.png'
import icon05Active from '../../assets/evaluation/evaluation_05_active.png'
import { updateOrder } from '../../api'

const props = defineProps({
  conversationId: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  customerSatisfaction: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['change'])

const selectedValue = ref(null)

// 满意度字符串与数值的反向映射
const satisfactionReverseMap = {
  'VERY_DISSATISFIED': 1,
  'DISSATISFIED': 2,
  'NEUTRAL': 3,
  'SATISFIED': 4,
  'VERY_SATISFIED': 5
}

const satisfactionList = [
  { value: 1, label: '很不满', icon: icon01, activeIcon: icon01Active },
  { value: 2, label: '不满', icon: icon02, activeIcon: icon02Active },
  { value: 3, label: '一般', icon: icon03, activeIcon: icon03Active },
  { value: 4, label: '满意', icon: icon04, activeIcon: icon04Active },
  { value: 5, label: '非常满意', icon: icon05, activeIcon: icon05Active }
]

const satisfactionMap = {
  1: 'VERY_DISSATISFIED',
  2: 'DISSATISFIED',
  3: 'NEUTRAL',
  4: 'SATISFIED',
  5: 'VERY_SATISFIED'
}

const handleClick = (value) => {
  if (props.disabled) return
  selectedValue.value = value
  emit('change', value)
  submitSatisfaction(value)
}

// 初始化：如果传入了历史满意度值，自动选中
if (props.customerSatisfaction && satisfactionReverseMap[props.customerSatisfaction]) {
  selectedValue.value = satisfactionReverseMap[props.customerSatisfaction]
}

/**
 * 提交满意度评价
 * @param {number} value - 评分值
 */
const submitSatisfaction = async (value) => {
  const satisfaction = satisfactionMap[value]
  if (!satisfaction || !props.conversationId) return
  try {
    await updateOrder({
      id: props.conversationId,
      customerSatisfaction: satisfaction
    })
  } catch (error) {
    console.error('提交满意度失败:', error)
  }
}
</script>

<style scoped>
.satisfaction-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 16px 0;
  background: #f8f8fb;
  border-radius: 8px;
}

.satisfaction-bar__title {
  font-size: 14px;
  font-weight: 400;
  color: #333333;
  white-space: nowrap;
  flex-shrink: 0;
}

.satisfaction-bar__list {
  display: flex;
  align-items: center;
  gap: 16px;
}

.satisfaction-bar__item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.satisfaction-bar__item:hover {
  transform: scale(1.05);
}

.satisfaction-bar__item.is-disabled {
  cursor: pointer;
}

.satisfaction-bar__item.is-disabled:hover {
  transform: none;
}

.satisfaction-bar__item.is-active .satisfaction-bar__label {
  color: #333333;
  font-weight: 500;
}

.satisfaction-bar__icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.satisfaction-bar__label {
  font-size: 12px;
  color: #999999;
  line-height: 1;
  white-space: nowrap;
}
</style>
