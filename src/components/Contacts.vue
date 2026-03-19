<template>
  <div class="contacts">
    <ContactsHeader
    @search="handleSearch"
    @clear-search="clearSearch"
    @create-new-session="$emit('create-new-session')"
  />
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
import ContactsHeader from './ContactsHeader.vue'

export default {
  name: 'Contacts',
  components: {
    SvgIcon,
    ContactsHeader
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
    /**
     * 选择联系人
     * @param {number} contactId - 联系人ID
     */
    selectContact(contactId) {
      this.$emit('select', contactId)
    },
    /**
     * 滚动到底部
     */
    scrollToBottom() {
      setTimeout(() => {
        const contactsList = this.$refs.contactsList
        if (contactsList) {
          contactsList.scrollTop = contactsList.scrollHeight
        }
      }, 100)
    },
    /**
     * 清除搜索
     */
    clearSearch() {
      this.searchQuery = ''
    },
    /**
     * 处理搜索
     * @param {string} query - 搜索关键词
     */
    handleSearch(query) {
      this.searchQuery = query
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
