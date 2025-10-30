<script setup lang="ts">
import { useI18n } from "vue-i18n";
// 侧边栏折叠/展开图标（统一使用 Iconify 冒号命名以走在线模式）
const MenuFold = "ri:menu-fold-fill";
const MenuUnfold = "ri:menu-unfold-fill";

interface Props {
  isActive?: boolean;
}

withDefaults(defineProps<Props>(), {
  isActive: false
});

const emit = defineEmits<{
  (e: "toggleClick"): void;
}>();

/**
 * 切换折叠/展开状态
 * 说明：向父组件派发 toggleClick 事件，用于切换侧边栏折叠状态
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
    class="px-3 mr-1 navbar-bg-hover"
    :title="
      isActive
        ? t('common.tooltips.clickToFold')
        : t('common.tooltips.clickToExpand')
    "
    @click="toggleClick"
  >
    <SmartIcon
      :icon="isActive ? MenuFold : MenuUnfold"
      class="inline-block! align-middle hover:text-primary dark:hover:text-white!"
    />
  </div>
</template>
