<template>
  <div class="message-popup" @mouseenter="$emit('mouseenter')" @mouseleave="$emit('mouseleave')">
    <div class="popup-arrow"></div>
    <div class="popup-content">
      <div class="popup-title">{{ title }}</div>
      <div class="message-list">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="message-item"
          @click.stop="$emit('click', msg.sessionId)"
        >
          <div class="message-content">{{ msg.content }}</div>
          <div class="message-time">{{ msg.time }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MessagePopup',
  props: {
    title: {
      type: String,
      default: '离线消息'
    },
    messages: {
      type: Array,
      required: true
    }
  }
}
</script>

<style scoped>
.message-popup {
  position: absolute;
  top: 100%;
  right: 200px;
  margin-top: 8px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  width: 300px;
  z-index: 1000;
  transform: translateX(calc(100% - 100px));
}

.popup-arrow {
  position: absolute;
  top: -8px;
  right: 16px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid white;
}

.popup-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.popup-title {
  font-weight: 600;
  color: #333;
  font-size: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.message-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.message-item:hover {
  background-color: #f5f5f5;
}

.message-item:active {
  background-color: #e3f2fd;
  transform: scale(0.98);
  transition: all 0.1s ease;
}

.message-content {
  color: #666;
  font-size: 13px;
  line-height: 1.4;
  word-break: break-word;
}

.message-time {
  font-size: 11px;
  color: #999;
  text-align: right;
}
</style>
