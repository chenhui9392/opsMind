<script setup lang="ts">
import type { Contact } from '../types'

interface Props {
  contacts: Contact[]
  currentContact: Contact | null
}

defineProps<Props>()
const emit = defineEmits<{
  select: [contact: Contact]
}>()

const handleSelect = (contact: Contact) => {
  emit('select', contact)
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'online':
      return 'status-online'
    case 'busy':
      return 'status-busy'
    default:
      return 'status-offline'
  }
}
</script>

<template>
  <div class="contact-list">
    <div class="contact-header">
      <h3>历史会话</h3>
    </div>
    <div class="contact-items">
      <div
        v-for="contact in contacts"
        :key="contact.id"
        class="contact-item"
        :class="{ active: currentContact?.id === contact.id }"
        @click="handleSelect(contact)"
      >
        <div class="contact-avatar">
          <div class="avatar-placeholder">
            {{ contact.name.charAt(0) }}
          </div>
          <span class="status-dot" :class="getStatusClass(contact.status)"></span>
        </div>
        <div class="contact-info">
          <div class="contact-name-row">
            <span class="contact-name">{{ contact.name }}</span>
            <span class="contact-time">{{ contact.lastTime }}</span>
          </div>
          <div class="contact-message">{{ contact.lastMessage }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contact-list {
  width: 280px;
  background-color: #fff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.contact-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.contact-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.contact-items {
  flex: 1;
  overflow-y: auto;
}

.contact-item {
  display: flex;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.contact-item:hover {
  background-color: #f5f5f5;
}

.contact-item.active {
  background-color: #e6f7ff;
}

.contact-avatar {
  position: relative;
  margin-right: 12px;
}

.avatar-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  font-weight: 600;
}

.status-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid #fff;
}

.status-online {
  background-color: #52c41a;
}

.status-busy {
  background-color: #faad14;
}

.status-offline {
  background-color: #bfbfbf;
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.contact-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.contact-time {
  font-size: 12px;
  color: #999;
}

.contact-message {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>