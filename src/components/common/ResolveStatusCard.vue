<template>
  <div class="resolve-status-card">
    <div class="resolve-status-card__content">
      <div class="resolve-status-card__title">当前内容是否已解决您的问题？</div>
      <div class="resolve-status-card__subtitle">您的反馈帮助我们不断优化服务质量</div>
      <div class="resolve-status-card__buttons">
        <button
          type="button"
          class="status-btn status-btn--resolved"
          :class="{ 'is-disabled': disabled }"
          :disabled="disabled"
          @click="handleResolvedClick"
        >
          <img :src="iconResolvedImg" class="bot-avatar-img" />
          <span>已解决</span>
        </button>
        <button
          type="button"
          class="status-btn status-btn--unresolved"
          :class="{ 'is-disabled': disabled }"
          :disabled="disabled"
          @click="handleUnresolvedClick"
        >
          <img :src="iconUnresolvedImg" class="bot-avatar-img" />
          <span>未解决</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import iconResolvedImg from '../../assets/icon_resolved.png'
import iconUnresolvedImg from '../../assets/icon_unresolved.png'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['resolved', 'unresolved'])

const handleResolvedClick = () => {
  if (props.disabled) return
  emit('resolved')
}

const handleUnresolvedClick = () => {
  if (props.disabled) return
  emit('unresolved')
}
</script>

<style scoped>
.resolve-status-card {
  display: flex;
  gap: 12px;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.resolve-status-card__avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #1e6fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.resolve-status-card__avatar img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.resolve-status-card__content {
  flex: 1;
  min-width: 0;
}

.resolve-status-card__title {
  font-size: 16px;
  color: #333333;
  line-height: 1.5;
  font-weight: bold;
}

.resolve-status-card__subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: #999999;
  line-height: 1.5;
}

.resolve-status-card__buttons {
  display: flex;
  margin-top: 16px;
}

.status-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 24px;
  padding: 16px 24px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 400;
  line-height: 1;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  outline: none;
}

.status-btn__icon {
  width: 14px;
  height: 14px;
}

.status-btn--resolved {
  color: #018f75;
  background: #ecfbf9;
  border-color: #c2f0e7;
  margin-right: 24px;

}

.status-btn--unresolved {
  color: #E0640C;
  background: #FAF1EB;
}

.status-btn.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(100%);
}

.bot-avatar-img{
  width: 16px;
  height: 16px;
}
</style>
