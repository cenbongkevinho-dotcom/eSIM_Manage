<script setup lang="ts">
import type { optionsItem } from "../types";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
// 统一使用冒号风格命名，运行时由 SmartIcon/useRenderIcon 离线优先 + 在线回退渲染
const StarIcon = "ep:star";
const CloseIcon = "ep:close";

interface Props {
  item: optionsItem;
}

interface Emits {
  (e: "collectItem", val: optionsItem): void;
  (e: "deleteItem", val: optionsItem): void;
}

const emit = defineEmits<Emits>();
withDefaults(defineProps<Props>(), {});

/**
 * 收藏一条历史项
 * @param item 历史项数据
 */
function handleCollect(item) {
  emit("collectItem", item);
}

/**
 * 删除一条历史项
 * @param item 历史项数据
 */
function handleDelete(item) {
  emit("deleteItem", item);
}
</script>

<template>
  <component :is="useRenderIcon(item.meta?.icon)" />
  <span class="history-item-title">
    {{ item.meta?.title }}
  </span>
  <SmartIcon
    v-show="item.type === 'history'"
    :icon="StarIcon"
    class="w-[18px] h-[18px] mr-2 hover:text-[#d7d5d4]"
    @click.stop="handleCollect(item)"
  />
  <SmartIcon
    :icon="CloseIcon"
    class="w-[18px] h-[18px] hover:text-[#d7d5d4] cursor-pointer"
    @click.stop="handleDelete(item)"
  />
</template>

<style lang="scss" scoped>
.history-item-title {
  display: flex;
  flex: 1;
  margin-left: 5px;
}
</style>
