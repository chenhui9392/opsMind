<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="viewBox"
    :class="className"
    :style="iconStyle"
  >
    <path
      v-for="(path, index) in paths"
      :key="index"
      :d="path"
    />
  </svg>
</template>

<script>
import { IconPaths } from './IconPaths';

export default {
  name: 'SvgIcon',
  props: {
    name: {
      type: String,
      required: true
    },
    width: {
      type: [String, Number],
      default: 20
    },
    height: {
      type: [String, Number],
      default: 20
    },
    className: {
      type: String,
      default: ''
    },
    color: {
      type: String,
      default: 'currentColor'
    }
  },
  computed: {
    icon() {
      return IconPaths[this.name] || null;
    },
    paths() {
      return this.icon ? this.icon.paths : [];
    },
    viewBox() {
      return this.icon ? this.icon.viewBox : '0 0 24 24';
    },
    iconStyle() {
      return {
        fill: 'none',
        stroke: this.color,
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      };
    }
  }
};
</script>
