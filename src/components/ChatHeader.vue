<template>
  <div class="chat-header">
    <div class="chat-title">
      <div class="avatar">
        <div class="avatar-icon">🤖</div>
      </div>
      <div class="header-info">
        <span class="chat-name">{{ title }}</span>
        <span class="chat-status">{{ status }}</span>
      </div>
      <div class="user-info" v-if="userName">
        <span class="user-name">{{ userName }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChatHeader',
  props: {
    title: {
      type: String,
      default: '智能助手'
    },
    status: {
      type: String,
      default: '在线'
    },
    userName: {
      type: String,
      default: ''
    }
  }
}
</script>

<style scoped>
.chat-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.chat-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.avatar {
  margin-right: 12px;
}

.avatar-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.header-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.chat-name {
  font-weight: bold;
  color: white;
  margin-right: 0;
  margin-bottom: 4px;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-name {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  padding: 4px 12px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

.chat-status {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
}

.chat-status::before {
  content: '';
  width: 8px;
  height: 8px;
  background-color: #4caf50;
  border-radius: 50%;
  margin-right: 4px;
}
</style>
