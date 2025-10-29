<script setup lang="ts">
import { getTopMenu } from "@/router/utils";
import { useNav } from "@/layout/hooks/useNav";
// 使用 Iconify 在线图标，支持加载所有图标（无需预注册）
// Iconify 在线组件全局在 main.ts 已注册为 <IconifyIconOnline/>

defineProps({
  collapse: Boolean
});

const { title, getLogo } = useNav();

/**
 * 获取侧边栏 Logo 图标（Iconify 在线）
 * @description 改为在线版：直接使用 Remix 的水滴图标（ri:drop-fill），无需预注册，可在线加载所有 Iconify 图标；
 * 在线渲染使用冒号命名（prefix:name），例如："ri:drop-fill"。
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
        <!-- 使用 Iconify 在线图标，统一渲染方案，支持加载所有图标（无需注册） -->
        <IconifyIconOnline
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
        <!-- 使用 Iconify 在线图标，统一渲染方案，支持加载所有图标（无需注册） -->
        <IconifyIconOnline
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
