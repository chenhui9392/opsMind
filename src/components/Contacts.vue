<template>
  <div class="contacts">
    <div class="contacts-header">
      <h2>历史会话</h2>
      <div class="search-container">
        <input
          type="text"
          v-model="searchQuery"
          class="search-input"
          placeholder="搜索会话..."
        />
        <button 
          v-if="searchQuery" 
          class="search-clear-button" 
          @click="clearSearch"
        >
          <SvgIcon name="clear" width="14" height="14" />
        </button>
      </div>
    </div>
    <div class="back-to-current" v-if="!isCurrentChatSelected" @click="$emit('back-to-current')">
      <div class="back-to-current-text">回到当前聊天</div>
      <div class="back-to-current-icon">
        <SvgIcon name="arrow" width="16" height="16" />
      </div>
    </div>
    <div class="contacts-list" ref="contactsList">
      <div
        v-for="contact in filteredContacts"
        :key="contact.id"
        class="contact-item"
        :class="{ active: selectedContact === contact.id }"
        @click="selectContact(contact.id)"
      >
<!--        <div class="contact-avatar">-->
<!--          <div class="avatar-icon">👤</div>-->
<!--        </div>-->
        <div class="contact-content">
          <div class="contact-info">
            <div class="contact-name">{{ contact.name }}</div>
            <div class="contact-time">{{ contact.time }}</div>
          </div>
          <div class="contact-message">{{ contact.lastMessage }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SvgIcon from '../assets/svg/SvgIcon.vue'

export default {
  name: 'Contacts',
  components: {
    SvgIcon
  },
  props: {
    contacts: {
      type: Array,
      default: () => []
    },
    selectedContact: {
      type: Number,
      default: 1
    },
    currentChatSession: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      searchQuery: ''
    }
  },
  computed: {
    filteredContacts() {
      if (!this.searchQuery) {
        return this.contacts
      }
      const query = this.searchQuery.toLowerCase()
      return this.contacts.filter(contact =>
        contact.name.toLowerCase().includes(query) ||
        contact.lastMessage.toLowerCase().includes(query)
      )
    },
    isCurrentChatSelected() {
      return this.selectedContact === this.currentChatSession
    }
  },
  methods: {
    selectContact(contactId) {
      this.$emit('select', contactId)
    },
    scrollToBottom() {
      setTimeout(() => {
        const contactsList = this.$refs.contactsList
        if (contactsList) {
          contactsList.scrollTop = contactsList.scrollHeight
        }
      }, 100)
    },
    clearSearch() {
      this.searchQuery = ''
    }
  }
}
</script>

<style scoped>
.contacts {
  width: 100%;
  border-right: 1px solid #e0e0e0;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.contacts-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.contacts-header h2 {
  margin: 0;
  font-size: 18px;
  color: white;
  font-weight: 600;
}

.search-container {
  width: 100%;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 16px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  transition: background-color 0.3s ease;
}

.search-input:focus {
  background-color: rgba(255, 255, 255, 0.3);
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
  background-color: rgba(255, 255, 255, 0.3);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.search-clear-button:hover {
  background-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-50%) scale(1.1);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

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

.contacts-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.contact-item {
  padding: 14px 16px;
  border: none;
  border-radius: 12px;
  margin: 0 8px 8px;
  cursor: pointer;
  background-color: #ffffff;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.contact-item:hover {
  background-color: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.contact-item.active {
  background-color: #ede7f6;
  border-left: 4px solid #673ab7;
}

.contact-avatar {
  flex-shrink: 0;
}

.avatar-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.contact-content {
  flex: 1;
  min-width: 0;
}

.contact-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.contact-name {
  font-weight: 600;
  color: #333;
  margin-right: 8px;
  font-size: 15px;
}

.contact-time {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

.contact-message {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

/* 滚动条样式 */
.contacts-list::-webkit-scrollbar {
  width: 6px;
}

.contacts-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.contacts-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.contacts-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
