<template>
  <div class="chat-header">
    <div class="chat-title">
      <!-- 左侧：收起/展开按钮 + 标题 -->
      <div class="header-left">
        <button
          class="sidebar-toggle-btn"
          @click="toggleSidebar"
          :title="isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'"
        >
          <SvgIcon
            :name="isSidebarCollapsed ? 'chevronRight' : 'chevronLeft'"
            width="18"
            height="18"
          />
        </button>

        <button class="new-session-button" @click="createNewSession" title="新建会话">
          <SvgIcon name="plus" width="16" height="16" />
        </button>

        <div class="header-info">
          <span class="chat-name" :title="displayTitle">
            {{ truncatedTitle }}
          </span>
        </div>
      </div>

      <!-- 右侧：下载按钮 -->
      <div class="header-right">
        <button class="download-btn" @click="handleDownload" title="下载会话">
          <SvgIcon name="download" width="18" height="18" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SvgIcon from '../../assets/svg/SvgIcon.vue'

// Props
const props = defineProps({
  /**
   * 侧边栏是否收起
   */
  isSidebarCollapsed: {
    type: Boolean,
    default: false
  },
  /**
   * 当前会话的第一条用户消息（用于显示标题）
   */
  firstUserMessage: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits([
  'create-new-session',
  'toggle-sidebar',
  'download-session'
])

// 计算属性
const displayTitle = computed(() => {
  // 如果有第一条用户消息，使用它作为标题
  return props.firstUserMessage || '新建会话'
})

const truncatedTitle = computed(() => {
  const title = displayTitle.value
  // 限制标题长度为20个字符
  if (title.length > 20) {
    return title.substring(0, 20) + '...'
  }
  return title
})

// 方法
const createNewSession = () => {
  emit('create-new-session')
}

/**
 * 切换侧边栏收起/展开
 */
const toggleSidebar = () => {
  emit('toggle-sidebar')
}

/**
 * 处理下载会话
 */
const handleDownload = () => {
  emit('download-session')
}
</script>

<style scoped>
.chat-header {
  padding: 0 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #ffffff;
  color: #333;
  height: 56px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
}

.chat-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* 左侧区域 */
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

/* 侧边栏切换按钮 */
.sidebar-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background-color: transparent;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.sidebar-toggle-btn:hover {
  background-color: #f5f5f5;
  color: #333;
}

.header-info {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.chat-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 右侧区域 */
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 新建会话按钮 */
.new-session-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background-color: transparent;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.new-session-button:hover {
  background-color: #f5f5f5;
  color: #333;
}

/* 下载按钮 */
.download-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background-color: transparent;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
}

.download-btn:hover {
  background-color: #f5f5f5;
  color: #333;
}
</style>
