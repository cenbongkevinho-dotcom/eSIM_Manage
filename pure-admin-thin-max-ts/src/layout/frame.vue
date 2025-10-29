<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref, unref, watch, onMounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";

defineOptions({
  name: "LayFrame"
});

const props = defineProps<{
  frameInfo?: {
    frameSrc?: string;
    fullPath?: string;
  };
}>();

const loading = ref(true);
const currentRoute = useRoute();
const frameSrc = ref<string>("");
const frameRef = ref<HTMLElement | null>(null);
if (unref(currentRoute.meta)?.frameSrc) {
  frameSrc.value = unref(currentRoute.meta)?.frameSrc as string;
}
unref(currentRoute.meta)?.frameLoading === false && hideLoading();

function hideLoading() {
  loading.value = false;
}

function init() {
  nextTick(() => {
    const iframe = unref(frameRef);
    if (!iframe) return;
    const _frame = iframe as any;
    if (_frame.attachEvent) {
      _frame.attachEvent("onload", () => {
        hideLoading();
      });
    } else {
      iframe.onload = () => {
        hideLoading();
      };
    }
  });
}

watch(
  () => currentRoute.fullPath,
  path => {
    if (
      currentRoute.name === "Redirect" &&
      path.includes(props.frameInfo?.fullPath)
    ) {
      frameSrc.value = path; // redirect时，置换成任意值，待重定向后 重新赋值
      loading.value = true;
    }
    // 重新赋值
    if (props.frameInfo?.fullPath === path) {
      frameSrc.value = props.frameInfo?.frameSrc;
    }
  }
);

onMounted(() => {
  init();
});

/**
 * 获取 i18n t 函数，用于模板中文案的国际化。
 * 当前用于 el-loading 的文本。
 */
const { t } = useI18n();
</script>

<template>
  <div
    v-loading="loading"
    class="frame"
    :element-loading-text="t('common.loading')"
  >
    <iframe ref="frameRef" :src="frameSrc" class="frame-iframe" />
  </div>
</template>

<style lang="scss" scoped>
.frame {
  position: absolute;
  inset: 0;

  .frame-iframe {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border: 0;
  }
}

.main-content {
  margin: 2px 0 0 !important;
}
</style>
