<template>
  <div v-if="show" class="image-preview-overlay" @click="close">
    <div class="image-preview-content" @click.stop>
      <button class="preview-close" @click="close">×</button>
      <button 
        class="preview-nav preview-prev" 
        @click="navigate(-1)"
        :disabled="currentIndex <= 0"
      >
        ←
      </button>
      <img :src="images[currentIndex]" class="preview-image" />
      <button 
        class="preview-nav preview-next" 
        @click="navigate(1)"
        :disabled="currentIndex >= images.length - 1"
      >
        →
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImagePreview',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    images: {
      type: Array,
      default: () => []
    },
    currentIndex: {
      type: Number,
      default: 0
    }
  },
  methods: {
    close() {
      this.$emit('close')
    },
    navigate(direction) {
      const newIndex = this.currentIndex + direction
      if (newIndex >= 0 && newIndex < this.images.length) {
        this.$emit('navigate', newIndex)
      }
    }
  }
}
</script>

<style scoped>
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.image-preview-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.preview-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: #ffffff;
  font-size: 32px;
  cursor: pointer;
}

.preview-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  border: none;
  color: #ffffff;
  font-size: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-prev {
  left: -50px;
}

.preview-next {
  right: -50px;
}

.preview-nav:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
  border-radius: 8px;
}
</style>
