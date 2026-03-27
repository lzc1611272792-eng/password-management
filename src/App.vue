<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-wrapper">
    <!-- 背景装饰光球 -->
    <div class="bg-orbs">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>
    <RouterView />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #09090b;
  overflow-x: hidden;
}

html, body, #app {
  height: 100%;
}

/* 全局背景容器 */
.app-wrapper {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

/* 背景装饰光球 */
.bg-orbs {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  will-change: transform;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: rgba(124, 58, 237, 0.12);
  top: -100px;
  left: -100px;
  animation: orb-drift 20s ease-in-out infinite;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: rgba(167, 139, 250, 0.08);
  top: 30%;
  right: -80px;
  animation: orb-drift 25s ease-in-out infinite reverse;
}

.orb-3 {
  width: 250px;
  height: 250px;
  background: rgba(245, 158, 11, 0.06);
  bottom: -50px;
  left: 30%;
  animation: orb-drift 22s ease-in-out infinite 3s;
}
</style>
