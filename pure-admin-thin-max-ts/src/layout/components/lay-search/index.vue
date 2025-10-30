<script setup lang="ts">
import { useBoolean } from "../../hooks/useBoolean";
import SearchModal from "./components/SearchModal.vue";

const { bool: show, toggle } = useBoolean();
function handleSearch() {
  toggle();
}
</script>

<template>
  <div>
    <div
      class="search-container w-[40px] h-[48px] flex-c cursor-pointer navbar-bg-hover"
      @click="handleSearch"
    >
      <!-- 使用 SmartIcon 提升离线稳定性，保留交互与样式 -->
      <SmartIcon icon="ri:search-line" />
    </div>
    <SearchModal v-model:value="show" />
  </div>
</template>
