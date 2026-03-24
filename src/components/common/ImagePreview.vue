<template>
  <div v-if="show" class="image-preview-overlay" @click="close">
    <button class="preview-close" @click="close">×</button>
    <button
        class="preview-nav preview-prev"
        @click.stop="navigate(-1)"
        :disabled="currentIndex <= 0"
    >
      ←
    </button>
    <div class="image-preview-content" @click.stop>
      <div class="image-container" :style="{ transform: `scale(${scale})` }">
        <img :src="images[currentIndex]" class="preview-image" />
      </div>
    </div>
    <button
        class="preview-nav preview-next"
        @click.stop="navigate(1)"
        :disabled="currentIndex >= images.length - 1"
    >
      →
    </button>
    <div class="preview-btn">
      <button class="control-button" @click.stop="zoomIn">+</button>
      <button class="control-button" @click.stop="zoomOut">-</button>
      <button class="control-button" @click.stop="resetZoom">1:1</button>
      <div class="preview-indicator">
        {{ currentIndex + 1 }} / {{ images.length }}
      </div>
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
  data() {
    return {
      scale: 1
    }
  },
  methods: {
    close() {
      this.scale = 1
      this.$emit('close')
    },
    navigate(direction) {
      const newIndex = this.currentIndex + direction
      if (newIndex >= 0 && newIndex < this.images.length) {
        this.$emit('navigate', newIndex)
      }
    },
    zoomIn() {
      if (this.scale < 3) {
        this.scale += 0.2
      }
    },
    zoomOut() {
      if (this.scale > 0.5) {
        this.scale -= 0.2
      }
    },
    resetZoom() {
      this.scale = 1
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
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.image-preview-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-close {
  position: absolute;
  top: 50px;
  right: 50px;
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid #ffffff;
  border-radius: 50%;
  color: #000000;
  font-size: 24px;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
  z-index: 10;
}

.preview-close:hover {
  background: #ffffff;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.preview-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 50%;
  font-size: 24px;
  width: 50px;
  height: 50px;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
  background: #ffffff;
  color: #000000;
}

.preview-nav:hover {
  background: #ffffff;
  border-color: #ffffff;
  transform: translateY(-50%) scale(1.1);
}

.preview-prev {
  left: 60px;
}

.preview-next {
  right: 60px;
}

.preview-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.image-container {
  transition: transform 0.3s ease;
  max-width: 100%;
  max-height: 80vh;
  z-index: 1;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.preview-btn{
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.control-button {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
  width: 40px;
  height: 40px;
  cursor: pointer;
  margin-right: 20px;
  transition: all 0.2s;
  z-index: 10;
}

.control-button:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: #ffffff;
  transform: scale(1.1);
}

.preview-indicator {
  color: #ffffff;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.5);
  padding: 6px 12px;
  border-radius: 12px;
}
</style>
