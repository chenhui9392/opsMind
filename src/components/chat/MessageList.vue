<!--
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-03-30 14:51:28
 * @LastEditTime: 2026-03-30 14:51:34
 * @LastEditors: hui.chenn
-->
<template>
  <div class="message-list">
    <!-- 空状态提示 -->
    <div class="empty-state" v-if="messages.length === 0">
      <div class="empty-icon">
        <SvgIcon name="inbox" width="64" height="64" />
      </div>
      <div class="empty-text">暂无消息记录</div>
      <div class="empty-subtext">工单详情将在这里展示</div>
    </div>

    <!-- 消息列表 -->
    <div v-else class="messages-container">
      <MessageItem
        v-for="(message, index) in messages"
        :key="index"
        :message="message"
        @image-click="handleImageClick"
        @file-click="handleFileClick"
      />
    </div>

    <!-- 图片预览模态框 -->
    <ImagePreview
      :show="imagePreview.show"
      :images="imagePreview.images"
      :currentIndex="imagePreview.currentIndex"
      @close="closeImagePreview"
      @navigate="handleNavigateImage"
    />
  </div>
</template>

<script>
import SvgIcon from '../../assets/svg/SvgIcon.vue'
import MessageItem from './MessageItem.vue'
import ImagePreview from '../common/ImagePreview.vue'

export default {
  name: 'MessageList',
  components: {
    SvgIcon,
    MessageItem,
    ImagePreview
  },
  props: {
    messages: {
      type: Array,
      default: () => []
    }
  },
  emits: ['file-click'],
  data() {
    return {
      imagePreview: {
        show: false,
        images: [],
        currentIndex: 0
      }
    }
  },
  methods: {
    /**
     * 处理图片点击
     * @param {string} image - 当前图片
     * @param {Array} images - 图片数组
     * @param {number} index - 当前索引
     */
    handleImageClick(image, images, index) {
      this.imagePreview = {
        show: true,
        images: images,
        currentIndex: index
      }
    },
    /**
     * 关闭图片预览
     */
    closeImagePreview() {
      this.imagePreview.show = false
    },
    /**
     * 导航图片
     * @param {number} index - 图片索引
     */
    handleNavigateImage(index) {
      this.imagePreview.currentIndex = index
    },
    /**
     * 处理文件点击
     * @param {Object} file - 文件对象
     */
    handleFileClick(file) {
      this.$emit('file-click', file)
    }
  }
}
</script>

<style scoped>
.message-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #fafafa;
  padding-bottom: 100px;
}

.messages-container {
  display: flex;
  flex-direction: column;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
  margin-top: 100px;
}

.empty-icon {
  color: #d1c4e9;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: #999;
  font-weight: 500;
}

.empty-subtext {
  font-size: 13px;
  color: #bbb;
}
</style>
