<script setup lang="ts">
import { isAllEmpty } from "@pureadmin/utils";
import { useNav } from "@/layout/hooks/useNav";
import { useI18n } from "vue-i18n";
import LaySearch from "../lay-search/index.vue";
import LayNotice from "../lay-notice/index.vue";
import { ref, toRaw, watch, onMounted, nextTick } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { getParentPaths, findRouteByPath } from "@/router/utils";
import { usePermissionStoreHook } from "@/store/modules/permission";
import LaySidebarExtraIcon from "../lay-sidebar/components/SidebarExtraIcon.vue";
import LaySidebarFullScreen from "../lay-sidebar/components/SidebarFullScreen.vue";
import LaySidebarOverallStyle from "../lay-sidebar/components/SidebarOverallStyle.vue";

// 顶部导航图标（统一为冒号命名在线模式）
const LogoutCircleRLine = "ri:logout-circle-r-line";
const Setting = "ri:settings-3-line";

const menuRef = ref();
const defaultActive = ref(null);

const {
  route,
  device,
  logout,
  onPanel,
  resolvePath,
  username,
  userAvatar,
  getDivStyle,
  avatarsStyle
} = useNav();

/**
 * 获取 i18n t 函数，用于模板中文案的国际化。
 * 注意：使用 common.buttons.logout 与 common.tooltips.openSettings 键。
 */
const { t } = useI18n();

function getDefaultActive(routePath) {
  const wholeMenus = usePermissionStoreHook().wholeMenus;
  /** 当前路由的父级路径 */
  const parentRoutes = getParentPaths(routePath, wholeMenus)[0];
  defaultActive.value = !isAllEmpty(route.meta?.activePath)
    ? route.meta.activePath
    : findRouteByPath(parentRoutes, wholeMenus)?.children[0]?.path;
}

onMounted(() => {
  getDefaultActive(route.path);
});

nextTick(() => {
  menuRef.value?.handleResize();
});

watch(
  () => [route.path, usePermissionStoreHook().wholeMenus],
  () => {
    getDefaultActive(route.path);
  }
);
</script>

<template>
  <div
    v-if="device !== 'mobile'"
    v-loading="usePermissionStoreHook().wholeMenus.length === 0"
    class="horizontal-header"
  >
    <el-menu
      ref="menuRef"
      router
      mode="horizontal"
      popper-class="pure-scrollbar"
      class="horizontal-header-menu"
      :default-active="defaultActive"
    >
      <el-menu-item
        v-for="route in usePermissionStoreHook().wholeMenus"
        :key="route.path"
        :index="resolvePath(route) || route.redirect"
      >
        <template #title>
          <div
            v-if="toRaw(route.meta.icon)"
            :class="['sub-menu-icon', route.meta.icon]"
          >
            <component
              :is="useRenderIcon(route.meta && toRaw(route.meta.icon))"
            />
          </div>
          <div :style="getDivStyle">
            <span class="select-none">
              {{ t(route.meta.title as string) }}
            </span>
            <LaySidebarExtraIcon :extraIcon="route.meta.extraIcon" />
          </div>
        </template>
      </el-menu-item>
    </el-menu>
    <div class="horizontal-header-right">
      <!-- 菜单搜索 -->
      <LaySearch id="header-search" />
      <!-- 全屏 -->
      <LaySidebarFullScreen id="full-screen" />
      <!-- 整体风格 -->
      <LaySidebarOverallStyle id="header-overall" />
      <!-- 消息通知 -->
      <LayNotice id="header-notice" />
      <!-- 退出登录 -->
      <el-dropdown trigger="click">
        <span class="el-dropdown-link navbar-bg-hover select-none">
          <img :src="userAvatar" :style="avatarsStyle" />
          <p v-if="username" class="dark:text-white">{{ username }}</p>
        </span>
        <template #dropdown>
          <el-dropdown-menu class="logout">
            <el-dropdown-item @click="logout">
              <IconifyIconOnline
                :icon="LogoutCircleRLine"
                style="margin: 5px"
              />
              {{ t("common.buttons.logout") }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <span
        class="set-icon navbar-bg-hover"
        :title="t('common.tooltips.openSettings')"
        @click="onPanel"
      >
        <IconifyIconOnline :icon="Setting" />
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-loading-mask) {
  opacity: 0.45;
}

.logout {
  width: 120px;

  ::v-deep(.el-dropdown-menu__item) {
    display: inline-flex;
    flex-wrap: wrap;
    min-width: 100%;
  }
}
</style>
