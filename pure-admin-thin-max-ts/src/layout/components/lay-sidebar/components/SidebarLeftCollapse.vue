<script setup lang="ts">
import { computed } from "vue";
import { useGlobal } from "@pureadmin/utils";
import { useNav } from "@/layout/hooks/useNav";
import { useI18n } from "vue-i18n";

// 左侧折叠图标（统一为冒号命名在线模式）
const MenuFold = "ri:menu-fold-fill";

interface Props {
  isActive?: boolean;
}

withDefaults(defineProps<Props>(), {
  isActive: false
});

const { tooltipEffect } = useNav();

const iconClass = computed(() => {
  return [
    "ml-4",
    "mb-1",
    "w-[16px]",
    "h-[16px]",
    "inline-block!",
    "align-middle",
    "cursor-pointer",
    "duration-[100ms]"
  ];
});

const { $storage } = useGlobal<GlobalPropertiesApi>();
const themeColor = computed(() => $storage.layout?.themeColor);

const emit = defineEmits<{
  (e: "toggleClick"): void;
}>();

/**
 * 切换左侧折叠状态
 * 说明：向父组件派发 toggleClick 事件，触发侧边栏折叠/展开
 */
const toggleClick = () => {
  emit("toggleClick");
};

/**
 * 引入 i18n t 函数，用于折叠/展开提示文案国际化。
 */
const { t } = useI18n();
</script>

<template>
  <div class="left-collapse">
    <SmartIcon
      v-tippy="{
        content: isActive
          ? t('common.tooltips.clickToFold')
          : t('common.tooltips.clickToExpand'),
        theme: tooltipEffect,
        hideOnClick: 'toggle',
        placement: 'right'
      }"
      :icon="MenuFold"
      :class="[iconClass, themeColor === 'light' ? '' : 'text-primary']"
      :style="{ transform: isActive ? 'none' : 'rotateY(180deg)' }"
      @click="toggleClick"
    />
  </div>
</template>

<style lang="scss" scoped>
.left-collapse {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 40px;
  line-height: 40px;
  box-shadow: 0 0 6px -3px var(--el-color-primary);
}
</style>
