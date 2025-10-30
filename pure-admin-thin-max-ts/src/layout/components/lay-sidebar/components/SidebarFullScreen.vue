<script setup lang="ts">
import { ref, watch } from "vue";
import { useNav } from "@/layout/hooks/useNav";

const screenIcon = ref();
const { toggle, isFullscreen, Fullscreen, ExitFullscreen } = useNav();

isFullscreen.value = !!(
  document.fullscreenElement ||
  document.webkitFullscreenElement ||
  document.mozFullScreenElement ||
  document.msFullscreenElement
);

watch(
  isFullscreen,
  full => {
    screenIcon.value = full ? ExitFullscreen : Fullscreen;
  },
  {
    immediate: true
  }
);
</script>

<template>
  <span
    class="fullscreen-icon navbar-bg-hover"
    data-testid="navbar-fullscreen-toggle"
    @click="toggle"
  >
    <!-- 全屏/退出全屏图标使用 SmartIcon（离线优先 + 在线回退）以提升云端稳定性 -->
    <SmartIcon :icon="screenIcon" />
  </span>
</template>
