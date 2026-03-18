<template>
  <div class="contacts-header">
    <h2>{{ title }}</h2>
    <div class="search-container">
      <input
        type="text"
        v-model="searchQuery"
        class="search-input"
        :placeholder="placeholder"
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
</template>

<script>
import SvgIcon from '../assets/svg/SvgIcon.vue'

export default {
  name: 'ContactsHeader',
  components: {
    SvgIcon
  },
  props: {
    title: {
      type: String,
      default: '历史会话'
    },
    placeholder: {
      type: String,
      default: '搜索会话...'
    }
  },
  data() {
    return {
      searchQuery: ''
    }
  },
  methods: {
    clearSearch() {
      this.searchQuery = ''
      this.$emit('clear-search')
    }
  },
  watch: {
    searchQuery(newValue) {
      this.$emit('search', newValue)
    }
  }
}
</script>

<style scoped>
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
</style>
