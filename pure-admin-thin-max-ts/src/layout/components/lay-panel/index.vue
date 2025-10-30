<script setup lang="ts">
import { emitter } from "@/utils/mitt";
import { onClickOutside } from "@vueuse/core";
import { ref, computed, onMounted, onBeforeUnmount, toRefs } from "vue";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { useI18n } from "vue-i18n";
// 面板关闭图标（统一为冒号命名在线模式）
const CloseIcon = "ep:close";

const target = ref(null);
const show = ref<Boolean>(false);

/**
 * 组件入参
 * - channel: 可选的事件通道标识；当设置后，仅响应带有相同 channel 的 openPanel 事件
 *   设计目的：避免页面存在多个 LayPanel 时，统一的全局事件导致“同时打开”的副作用。
 */
const props = defineProps<{ channel?: string }>();

const iconClass = computed(() => {
  return [
    "w-[22px]",
    "h-[22px]",
    "flex",
    "justify-center",
    "items-center",
    "outline-hidden",
    "rounded-[4px]",
    "cursor-pointer",
    "transition-colors",
    "hover:bg-[#0000000f]",
    "dark:hover:bg-[#ffffff1f]",
    "dark:hover:text-[#ffffffd9]"
  ];
});

const { onReset } = useDataThemeChange();

onClickOutside(target, (event: any) => {
  if (event.clientX > target.value.offsetLeft) return;
  show.value = false;
});

/**
 * 处理 openPanel 事件
 * - 兼容历史入参：无参（默认打开）、布尔（true/false）
 * - 新增入参对象：{ open?: boolean; visible?: boolean; value?: boolean; channel?: string }
 *   当组件声明了 props.channel 时，仅当 payload.channel 与之相等时才处理；
 *   当组件未声明 channel 时，仅处理无 channel 的事件（保持旧行为）。
 */
function handleOpenPanel(payload?: unknown) {
  // 解析下一状态与事件通道
  let nextOpen: boolean | undefined;
  let payloadChannel: string | undefined;

  if (typeof payload === "object" && payload !== null) {
    const anyPayload = payload as Record<string, unknown>;
    const candidates = [anyPayload.open, anyPayload.visible, anyPayload.value];
    for (const c of candidates) {
      if (typeof c === "boolean") {
        nextOpen = c;
        break;
      }
    }
    if (typeof anyPayload.channel === "string")
      payloadChannel = anyPayload.channel as string;
  } else if (typeof payload === "boolean") {
    nextOpen = payload;
  } else if (typeof payload === "undefined") {
    nextOpen = true;
  }

  // 通道隔离：
  // - 当本组件声明了 channel，仅响应带同名 channel 的事件；
  // - 当本组件未声明 channel，仅响应“无 channel”的事件（向后兼容旧的全局行为）。
  if (props.channel) {
    if (payloadChannel !== props.channel) return;
  } else {
    if (payloadChannel) return;
  }

  show.value = typeof nextOpen === "boolean" ? nextOpen : true;
}

onMounted(() => {
  emitter.on("openPanel", handleOpenPanel);
});

onBeforeUnmount(() => {
  // 解绑`openPanel`公共事件，防止多次触发
  // 注意：mitt.off 需要传入同一个 handler 才能精确移除
  emitter.off("openPanel", handleOpenPanel);
});

/**
 * 获取 i18n t 函数，用于面板内文案国际化。
 * 包含面板标题、关闭提示、清空缓存提示与按钮文本。
 */
const { t } = useI18n();

/**
 * open
 * 以编程方式打开面板（不依赖全局事件）。
 */
function open() {
  show.value = true;
}

/**
 * close
 * 以编程方式关闭面板（不依赖全局事件）。
 */
function close() {
  show.value = false;
}

/**
 * toggle
 * 切换面板可见性；当传入布尔值时按给定值切换，否则在当前状态上取反。
 * @param next 目标显隐状态（可选）
 */
function toggle(next?: boolean) {
  show.value = typeof next === "boolean" ? next : !show.value;
}

// 向父组件暴露编程式控制方法，便于在特定页面避免使用全局 emitter
defineExpose({ open, close, toggle });
</script>

<template>
  <div
    :class="{ show }"
    data-testid="lay-panel-root"
    :data-open="String(show)"
    :data-channel="props.channel || 'default'"
  >
    <div class="right-panel-background" />
    <div ref="target" class="right-panel bg-bg_color" data-testid="lay-panel">
      <div
        class="project-configuration border-0 border-b-[1px] border-solid border-[var(--pure-border-color)]"
      >
        <h4 class="dark:text-white">
          {{ t("common.sections.systemSettings") }}
        </h4>
        <span
          v-tippy="{
            content: t('common.buttons.closeSettings'),
            placement: 'bottom-start',
            zIndex: 41000
          }"
          :class="iconClass"
          data-testid="panel-close-btn"
          @click="show = false"
        >
          <!-- 关闭图标改为 SmartIcon（离线优先 + 在线回退），保持 data-testid 不变以保证测试稳健 -->
          <SmartIcon
            class="dark:text-white"
            width="18px"
            height="18px"
            :icon="CloseIcon"
            aria-hidden="false"
          />
        </span>
      </div>
      <el-scrollbar>
        <slot />
      </el-scrollbar>

      <div
        class="flex justify-end p-3 border-0 border-t-[1px] border-solid border-[var(--pure-border-color)]"
      >
        <el-button
          v-tippy="{
            content: t('common.tooltips.clearCacheAndBackToLogin'),
            placement: 'left-start',
            zIndex: 41000
          }"
          type="danger"
          text
          bg
          @click="onReset"
        >
          {{ t("common.buttons.clearCache") }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-scrollbar) {
  height: calc(100vh - 110px);
}

.right-panel-background {
  position: fixed;
  top: 0;
  left: 0;
  z-index: -1;
  background: rgb(0 0 0 / 20%);
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.7, 0.3, 0.1, 1);
}

.right-panel {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 40000;
  width: 100%;
  max-width: 280px;
  box-shadow: 0 0 15px 0 rgb(0 0 0 / 5%);
  transform: translate(100%);
  transition: all 0.25s cubic-bezier(0.7, 0.3, 0.1, 1);
}

.show {
  transition: all 0.3s cubic-bezier(0.7, 0.3, 0.1, 1);

  .right-panel-background {
    z-index: 20000;
    width: 100%;
    height: 100%;
    opacity: 1;
  }

  .right-panel {
    transform: translate(0);
  }
}

.project-configuration {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
}
</style>
