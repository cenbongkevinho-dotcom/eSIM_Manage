<template>
  <div class="icon-audit">
    <h2>Icon 校验（在线冒号风格优先）</h2>
    <p class="desc">
      本页集中展示 Navbar、Settings、Panel 与 Schedule 相关的在线图标（冒号风格）。
      若均能正常显示，则说明在线图标渲染链路工作正常；离线斜杠风格仅用作 offlineIcon.ts 的兜底注册，不在业务代码中直接使用。
    </p>

    <!-- 交互演示：便于直接点验图标与行为 -->
    <section class="interactive">
      <h3>交互演示</h3>
      <div class="demo-cards">
        <!-- Navbar 全屏切换（真实组件） -->
        <div class="demo-card">
          <div class="card-head">Navbar 全屏切换（点击图标切换）</div>
          <div class="card-body">
            <LaySidebarFullScreen />
          </div>
        </div>

        <!-- Panel 面板（真实组件） -->
        <div class="demo-card" data-testid="panel-demo-card">
          <div class="card-head">Panel 面板（点击按钮打开，右上角 ep:close 关闭）</div>
          <div class="card-body">
            <el-button type="primary" data-testid="open-panel-btn" @click="openPanel">打开 Panel</el-button>
            <!-- 通过 channel="icon-audit" 隔离（同时支持编程式控制以避免全局事件干扰） -->
            <LayPanel ref="panelRef" channel="icon-audit">
              <div class="panel-slot">
                <IconifyIconOnline icon="ep:close" class="mr-1" />
                这里是 Panel 内部自测内容占位（可点击右上角关闭图标验证 ep:close 在线渲染）。
              </div>
            </LayPanel>
          </div>
        </div>

        <!-- Settings 箭头与勾选（交互模拟） -->
        <div class="demo-card">
          <div class="card-head">Settings 面板图标（箭头切换与勾选图标）</div>
          <div class="card-body flex-center gap-12">
            <div class="inline-flex items-center gap-2">
              <span>折叠状态：</span>
              <el-switch v-model="arrowCollapsed" inline-prompt :active-text="'是'" :inactive-text="'否'" />
            </div>
            <div class="inline-flex items-center gap-2">
              <span>箭头预览：</span>
              <span class="icon-swap" @click="toggleArrow">
                <span data-testid="settings-arrow-icon" :data-icon="arrowIcon">
                  <IconifyIconOnline :icon="arrowIcon" class="demo-icon" />
                </span>
              </span>
            </div>
            <div class="inline-flex items-center gap-2">
              <span>勾选：</span>
              <span data-testid="settings-check-icon" data-icon="ep:check">
                <IconifyIconOnline icon="ep:check" class="demo-icon" />
              </span>
            </div>
          </div>
        </div>

        <!-- Schedule 新增按钮与空态（交互模拟） -->
        <div class="demo-card" data-testid="schedule-demo-card">
          <div class="card-head">Schedule 图标（新增按钮与空态）</div>
          <div class="card-body">
            <el-button circle data-testid="schedule-add-btn">
              <template #icon>
                <IconifyIconOnline icon="ri:add-large-line" data-testid="schedule-add-icon" />
              </template>
            </el-button>
            <div class="empty-block" data-testid="schedule-empty-block">
              <IconifyIconOnline icon="ep:calendar" data-testid="schedule-empty-icon" />
              <span class="empty-text">暂无排班</span>
            </div>
          </div>
        </div>

        <!-- SmartIcon 离线能力演示（对照：在线 vs SmartIcon，不影响在线测试） -->
        <div class="demo-card" data-testid="smarticon-demo-card">
          <div class="card-head">SmartIcon 离线能力演示（在线 vs SmartIcon 对照）</div>
          <div class="card-body">
            <div class="compare-row">
              <span class="compare-label">在线：</span>
              <div class="icons">
                <div class="icon-item">
                  <IconifyIconOnline icon="ri:add-large-line" data-testid="smarticon-online-add" class="demo-icon" />
                  <span class="label">ri:add-large-line</span>
                </div>
                <div class="icon-item">
                  <IconifyIconOnline icon="ep:calendar" data-testid="smarticon-online-calendar" class="demo-icon" />
                  <span class="label">ep:calendar</span>
                </div>
              </div>
            </div>
            <div class="compare-row">
              <span class="compare-label">SmartIcon：</span>
              <div class="icons">
                <div class="icon-item">
                  <!-- SmartIcon：离线优先 + 在线回退 -->
                  <SmartIcon icon="ri:add-large-line" data-testid="smarticon-smart-add" class="demo-icon" />
                  <span class="label">ri:add-large-line</span>
                </div>
                <div class="icon-item">
                  <!-- SmartIcon：离线优先 + 在线回退 -->
                  <SmartIcon icon="ep:calendar" data-testid="smarticon-smart-calendar" class="demo-icon" />
                  <span class="label">ep:calendar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-for="group in groups" :key="group.title" class="group">
      <h3>{{ group.title }}</h3>
      <div class="icons">
        <div v-for="it in group.icons" :key="it" class="icon-item">
          <IconifyIconOnline :icon="it" class="demo-icon" />
          <span class="label">{{ it }}</span>
        </div>
      </div>
    </section>
  </div>
  
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { emitter } from "@/utils/mitt";
import LaySidebarFullScreen from "@/layout/components/lay-sidebar/components/SidebarFullScreen.vue";
import LayPanel from "@/layout/components/lay-panel/index.vue";

/**
 * 图标分组项
 */
interface IconGroup {
  /** 分组标题 */
  title: string;
  /** 图标名（在线冒号风格） */
  icons: string[];
}

/**
 * 构造用于展示的图标分组
 * - 推荐仅使用在线冒号风格，如 "ri:fullscreen-fill"、"ep:close"
 * - 离线斜杠风格示例仅存在于 offlineIcon.ts（兜底注册），不在业务代码中直接使用
 */
function useIconGroups() {
  const data = ref<IconGroup[]>([
    {
      title: "Navbar 全屏切换",
      icons: ["ri:fullscreen-fill", "ri:fullscreen-exit-fill"]
    },
    {
      title: "Settings 面板（勾选与折叠箭头）",
      icons: ["ep:check", "ri:arrow-left-s-line", "ri:arrow-right-s-line"]
    },
    {
      title: "Panel 面板（关闭）",
      icons: ["ep:close"]
    },
    {
      title: "Schedule 页面（新增与空态）",
      icons: ["ri:add-large-line", "ep:calendar"]
    }
  ]);
  return { data };
}

/**
 * 初始化页面状态并暴露图标分组
 */
function setupPage() {
  const { data } = useIconGroups();
  // Settings 箭头交互示例所需状态
  const arrowCollapsed = ref(false);
  const arrowIcon = computed(() =>
    arrowCollapsed.value ? "ri:arrow-right-s-line" : "ri:arrow-left-s-line"
  );

  // 引用 LayPanel，使用编程式方式避免全局 emitter 干扰
  const panelRef = ref<InstanceType<typeof LayPanel> | null>(null);

  /**
   * 打开 Panel 面板
   * - 通过编程式方式 panelRef.value?.open() 打开，完全隔离全局 openPanel 事件
   * - 仍保留 channel 属性以与组件事件兼容（但本页不再依赖 emitter）
   */
  function openPanel() {
    // 为避免全局“布局设置”面板（layout-setting）遮挡，打开本面板前先显式关闭之
    // 说明：这不会影响其它 LayPanel，因我们在 lay-panel 中实现了 channel 隔离
    emitter.emit("openPanel", { open: false, channel: "layout-setting" });
    panelRef.value?.open?.();
  }

  /**
   * 切换 Settings 面板折叠箭头演示
   * - 折叠时展示 ri:arrow-right-s-line
   * - 展开时展示 ri:arrow-left-s-line
   */
  function toggleArrow() {
    arrowCollapsed.value = !arrowCollapsed.value;
  }

  return { groups: data, arrowCollapsed, arrowIcon, openPanel, toggleArrow, panelRef };
}

// 暴露给模板使用的响应式数据与方法
// 注意：必须完整解构，否则模板中引用的变量将是 undefined，导致渲染异常
const { groups, arrowCollapsed, arrowIcon, openPanel, toggleArrow, panelRef } = setupPage();

// 为避免布局设置面板干扰（尤其是 E2E 初始化阶段），页面挂载后主动将其关闭
onMounted(() => {
  // 显式仅关闭 layout-setting 通道的 LayPanel，不影响其他页面上的面板
  emitter.emit("openPanel", { open: false, channel: "layout-setting" });
});
</script>

<style scoped>
.icon-audit {
  padding: 16px;
}
.desc {
  color: var(--el-text-color-secondary);
  margin: 4px 0 16px;
}
.interactive {
  margin: 12px 0 24px;
}
.demo-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}
.demo-card {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
}
.demo-card .card-head {
  padding: 10px 12px;
  font-weight: 600;
  background: var(--el-fill-color-light);
}
.demo-card .card-body {
  padding: 12px;
}
.panel-slot {
  padding: 8px 12px;
}
.empty-block {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 100px;
  margin-left: 8px;
  color: rgba(0, 0, 0, 0.45);
}
.empty-text {
  margin-top: 6px;
  font-size: 12px;
}
.flex-center {
  display: flex;
  align-items: center;
}
.gap-12 {
  gap: 12px;
}
.group {
  margin-bottom: 20px;
}
.icons {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.icon-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
}
.demo-icon {
  font-size: 20px;
}
.label {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
}
.compare-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.compare-label {
  width: 80px;
  color: var(--el-text-color-secondary);
}
</style>
