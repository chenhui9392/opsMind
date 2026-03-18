<!--
 * @Author: hui.chenn
 * @Description: 
 * @Date: 2026-03-17 18:17:55
 * @LastEditTime: 2026-03-18 08:52:31
 * @LastEditors: hui.chenn
-->
<template>
  <div>
    <SvgIcons />
    <MainApp />
  </div>
</template>

<script>
import MainApp from './components/MainApp.vue'
import SvgIcons from './components/SvgIcons.vue'

export default {
  name: 'App',
  components: {
    MainApp,
    SvgIcons
  }
}
</script>
