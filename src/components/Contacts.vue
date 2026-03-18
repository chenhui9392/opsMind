<template>
  <div class="contacts">
    <div class="contacts-header">
      <h2>历史会话</h2>
    </div>
    <div class="contacts-list">
      <div 
        v-for="contact in contacts" 
        :key="contact.id"
        class="contact-item"
        :class="{ active: selectedContact === contact.id }"
        @click="selectContact(contact.id)"
      >
        <div class="contact-info">
          <div class="contact-name">{{ contact.name }}</div>
          <div class="contact-time">{{ contact.time }}</div>
        </div>
        <div class="contact-status" :class="contact.status">{{ contact.statusText }}</div>
        <div class="contact-message">{{ contact.lastMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Contacts',
  props: {
    contacts: {
      type: Array,
      default: () => []
    },
    selectedContact: {
      type: Number,
      default: 1
    }
  },
  methods: {
    selectContact(contactId) {
      this.$emit('select', contactId)
    }
  }
}
</script>

<style scoped>
.contacts {
  width: 300px;
  border-right: 1px solid #e0e0e0;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.contacts-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #ffffff;
}

.contacts-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
}

.contact-item {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  background-color: #ffffff;
  transition: background-color 0.2s;
}

.contact-item:hover {
  background-color: #f0f0f0;
}

.contact-item.active {
  background-color: #e3f2fd;
}

.contact-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.contact-name {
  font-weight: bold;
  color: #333;
}

.contact-time {
  font-size: 12px;
  color: #999;
}

.contact-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  margin-bottom: 8px;
}

.contact-status.completed {
  background-color: #e8f5e8;
  color: #4caf50;
}

.contact-status.processing {
  background-color: #fff3e0;
  color: #ff9800;
}

.contact-status.pending {
  background-color: #f3e5f5;
  color: #9c27b0;
}

.contact-message {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
