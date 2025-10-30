<script setup lang="ts">
import { computed } from "vue";
import { useGlobal } from "@pureadmin/utils";
import { useNav } from "@/layout/hooks/useNav";
import { useI18n } from "vue-i18n";

// 中部折叠图标（统一为冒号命名在线模式）
const ArrowLeft = "ep:arrow-left-bold";

interface Props {
  isActive?: boolean;
}

withDefaults(defineProps<Props>(), {
  isActive: false
});

const { tooltipEffect } = useNav();

const iconClass = computed(() => {
  return ["w-[16px]", "h-[16px]"];
});

const { $storage } = useGlobal<GlobalPropertiesApi>();
const themeColor = computed(() => $storage.layout?.themeColor);

const emit = defineEmits<{
  (e: "toggleClick"): void;
}>();

/**
 * 切换中部折叠按钮状态
 * 说明：向父组件派发 toggleClick，控制布局折叠/展开
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
  <div
    v-tippy="{
      content: isActive
        ? t('common.tooltips.clickToFold')
        : t('common.tooltips.clickToExpand'),
      theme: tooltipEffect,
      hideOnClick: 'toggle',
      placement: 'right'
    }"
    class="center-collapse"
    @click="toggleClick"
  >
    <SmartIcon
      :icon="ArrowLeft"
      :class="[iconClass, themeColor === 'light' ? '' : 'text-primary']"
      :style="{ transform: isActive ? 'none' : 'rotateY(180deg)' }"
    />
  </div>
</template>

<style lang="scss" scoped>
.center-collapse {
  position: absolute;
  top: 50%;
  right: 2px;
  z-index: 1002;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 34px;
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--pure-border-color);
  border-radius: 4px;
  transform: translate(12px, -50%);
}
</style>
