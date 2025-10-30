<script setup lang="ts">
import { getTopMenu } from "@/router/utils";
import { useNav } from "@/layout/hooks/useNav";
// 使用 SmartIcon 统一渲染（离线优先 + 在线回退），支持加载所有图标（业务层无需预注册）
// SmartIcon 全局在 main.ts 已注册为 <SmartIcon/>

defineProps({
  collapse: Boolean
});

const { title, getLogo } = useNav();

/**
 * 获取侧边栏 Logo 图标（冒号风格字符串）
 * @description 使用 Remix 的水滴图标（ri:drop-fill）。运行时由 SmartIcon 离线优先渲染，未命中时在线回退；
 * 业务层使用冒号命名（prefix:name），例如："ri:drop-fill"。
 * @returns 图标名称字符串，格式为 "prefix:name"
 */
function getSidebarLogoIcon(): string {
  return "ri:drop-fill";
}

// 侧边栏 Logo 图标名（在线）
const LogoIcon = getSidebarLogoIcon();
</script>

<template>
  <div class="sidebar-logo-container" :class="{ collapses: collapse }">
    <transition name="sidebarLogoFade">
      <router-link
        v-if="collapse"
        key="collapse"
        :title="title"
        class="sidebar-logo-link"
        :to="getTopMenu()?.path ?? '/'"
      >
        <!-- 使用 SmartIcon（离线优先 + 在线回退），统一渲染方案，支持加载所有图标（无需注册） -->
        <SmartIcon
          :icon="LogoIcon"
          style="margin-right: 8px; font-size: 24px"
        />
        <img :src="getLogo()" alt="logo" />
        <span class="sidebar-title">{{ title }}</span>
      </router-link>
      <router-link
        v-else
        key="expand"
        :title="title"
        class="sidebar-logo-link"
        :to="getTopMenu()?.path ?? '/'"
      >
        <!-- 使用 SmartIcon（离线优先 + 在线回退），统一渲染方案，支持加载所有图标（无需注册） -->
        <SmartIcon
          :icon="LogoIcon"
          style="margin-right: 8px; font-size: 24px"
        />
        <img :src="getLogo()" alt="logo" />
        <span class="sidebar-title">{{ title }}</span>
      </router-link>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 48px;
  overflow: hidden;

  .sidebar-logo-link {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    height: 100%;
    padding-left: 10px;

    img {
      display: inline-block;
      height: 32px;
    }

    .sidebar-title {
      display: inline-block;
      height: 32px;
      margin: 2px 0 0 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 18px;
      font-weight: 600;
      line-height: 32px;
      color: var(--pure-theme-sub-menu-active-text);
      white-space: nowrap;
    }
  }
}
</style>
