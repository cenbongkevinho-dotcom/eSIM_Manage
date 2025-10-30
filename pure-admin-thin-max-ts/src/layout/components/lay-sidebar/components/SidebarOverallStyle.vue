<script setup lang="ts">
import { useGlobal } from "@pureadmin/utils";
import { computed, watch, shallowRef } from "vue";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

// 整体风格（日/夜）图标，统一为冒号命名以走在线模式
const DayIcon = "ri:sun-fill";
const DarkIcon = "ri:moon-fill";

const styleIcon = shallowRef();
const { $storage } = useGlobal<GlobalPropertiesApi>();
const { dataTheme, dataThemeChange } = useDataThemeChange();
const overallStyle = computed(() => $storage?.layout?.overallStyle);

function onToggle() {
  if (overallStyle.value === "light") {
    dataTheme.value = true;
    dataThemeChange("dark");
  } else {
    dataTheme.value = false;
    dataThemeChange("light");
  }
}

/**
 * 监听整体风格变化，实时切换图标（浅色显示月亮，深色显示太阳）
 */
watch(
  overallStyle,
  style => {
    styleIcon.value = style === "light" ? DarkIcon : DayIcon;
  },
  {
    immediate: true
  }
);
</script>

<template>
  <span class="overall-style-icon navbar-bg-hover" @click="onToggle">
    <!-- 使用 SmartIcon（离线优先 + 在线回退），避免受限网络下图标加载失败 -->
    <SmartIcon :icon="styleIcon" />
  </span>
</template>
