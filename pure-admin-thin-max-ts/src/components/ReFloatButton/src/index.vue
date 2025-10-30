<script setup lang="ts">
import { ref } from "vue";
import type { floatBtnsType } from "./type";
import { isUrl, openLink } from "@pureadmin/utils";

// 改为传入字符串图标名称，统一使用 Iconify 在线组件，采用冒号命名
const Open = "ri:open-arm-line";
const Close = "ep:close";

defineOptions({
  name: "ReFloatButton"
});

const props = defineProps({
  floatBtns: {
    type: Array as PropType<floatBtnsType>,
    default: () => []
  }
});

const isOpen = ref(false);
const mergeFloatBtns = ref<Array<floatBtnsType>>(
  props.floatBtns.concat({
    icon: Open,
    show: true
  })
);

/**
 * 切换浮动按钮显示与图标
 * @param btn 当前点击的按钮对象
 * @param index 当前按钮在合并数组中的索引
 * 说明：
 * - 若按钮包含外链（`link`）且为合法 URL，则直接打开链接；
 * - 当点击最后一个按钮时，切换其它按钮的显示状态；
 * - 同时根据展开状态切换最后一个按钮的图标（Open/Close）。
 */
/**
 * 切换浮动按钮显示与图标
 * @param btn 当前点击的按钮对象
 * @param index 当前按钮在合并数组中的索引
 * 说明：
 * - 若按钮包含外链（link）且为合法 URL，则直接打开链接；
 * - 当点击最后一个按钮时，切换其它按钮的显示状态；
 * - 同时根据展开状态切换最后一个按钮的图标（Open/Close）。
 */
function onShow(btn: floatBtnsType, index: number) {
  if (isUrl(btn?.link)) openLink(btn.link);
  const length = mergeFloatBtns.value.length - 1;
  if (index === length) {
    isOpen.value = !isOpen.value;
    Array.from({ length }).forEach((_, k) => {
      mergeFloatBtns.value[k].show = !mergeFloatBtns.value[k].show;
    });
    mergeFloatBtns.value[index].icon = isOpen.value ? Close : Open;
  } else {
    return;
  }
}
</script>

<template>
  <div class="pure-float-btn-group">
    <div v-for="(btn, index) in mergeFloatBtns" :key="index">
      <button
        v-if="btn.show"
        v-tippy="{
          content: btn?.tip,
          placement: 'left'
        }"
        v-motion-slide-bottom
        class="pure-float-btn"
        type="button"
        :delay="20 * index"
        @click="onShow(btn, index)"
      >
        <SmartIcon :icon="btn.icon" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.pure-float-btn-group {
  position: fixed;
  right: 10px;
  bottom: 60px;

  .pure-float-btn {
    width: 40px;
    height: 40px;
    margin-top: 10px;
    cursor: pointer;
    background: #fff;
    border: none;
    border-radius: 50%;
    box-shadow:
      0 6px 16px 0 rgb(0 0 0 / 8%),
      0 3px 6px -4px rgb(0 0 0 / 12%),
      0 9px 28px 8px rgb(0 0 0 / 5%);

    svg {
      margin: 0 auto;
      font-size: 20px;
      color: rgb(0 0 0 / 88%);
    }

    &:hover {
      background: var(--el-border-color-extra-light);
    }
  }
}
</style>
