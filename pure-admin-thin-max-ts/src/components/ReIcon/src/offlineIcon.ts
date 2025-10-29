// 这里存放本地图标，在 src/layout/index.vue 或 main.ts 中加载，避免在首启动加载
// 使用说明（推荐在线冒号风格，保留离线兼容）：
// - 在线图标：推荐在业务代码中使用 Iconify 冒号风格（如 "ep:close"、"ri:search-line"），无需预注册，统一通过 IconifyIconOnline 加载。
// - 离线图标：为保障内网/无网络场景，仍在此文件中按斜杠风格（如 "ep/close"、"ri/search-line"）进行 addIcon 预注册，
//   并由 IconifyIconOffline 组件渲染。此方式仅在显式选择离线渲染或自动离线回退时生效。
// - 结论：业务层统一写冒号风格字符串更简洁；离线注册用于兜底，不影响在线渲染路径。
import { addIcon } from "@iconify/vue/dist/offline";
// 直接使用 iconify-json 提供的离线图标数据，避免通过 unplugin-icons 虚拟模块加载
// Element Plus Icons: https://github.com/element-plus/element-plus-icons
import epIcons from "@iconify-json/ep/icons.json";
// Remix Icons: https://github.com/Remix-Design/RemixIcon
import riIcons from "@iconify-json/ri/icons.json";

const icons = [
  // Element Plus Icon: https://github.com/element-plus/element-plus-icons
  ["ep/home-filled", epIcons.icons["home-filled"]],
  // Tag 操作与功能按钮涉及的刷新图标（向右）
  ["ep/refresh-right", epIcons.icons["refresh-right"]],
  // Remix Icon: https://github.com/Remix-Design/RemixIcon
  ["ri/search-line", riIcons.icons["search-line"]],
  ["ri/information-line", riIcons.icons["information-line"]],
  ["ri/user-heart-line", riIcons.icons["user-heart-line"]],
  ["ri/book-open-line", riIcons.icons["book-open-line"]],
  ["ri/vip-diamond-line", riIcons.icons["vip-diamond-line"]],
  // Used by FloatButton and dialogs
  ["ep/close", epIcons.icons["close"]],
  ["ri/open-arm-line", riIcons.icons["open-arm-line"]],
  ["ri/fullscreen-fill", riIcons.icons["fullscreen-fill"]],
  ["ri/fullscreen-exit-fill", riIcons.icons["fullscreen-exit-fill"]],
  // Common arrows used in tags/navigation
  ["ri/arrow-down-s-line", riIcons.icons["arrow-down-s-line"]],
  ["ri/arrow-right-s-line", riIcons.icons["arrow-right-s-line"]],
  ["ri/arrow-left-s-line", riIcons.icons["arrow-left-s-line"]],
  // Tag 右键菜单与批量操作相关图标
  ["ri/subtract-line", riIcons.icons["subtract-line"]],
  ["ri/text-spacing", riIcons.icons["text-spacing"]],
  ["ri/text-direction-l", riIcons.icons["text-direction-l"]],
  ["ri/text-direction-r", riIcons.icons["text-direction-r"]],
  // Additional commonly used icons across layout and pages
  ["ep/check", epIcons.icons["check"]],
  ["ep/bell", epIcons.icons["bell"]],
  // Schedule page icons
  ["ep/calendar", epIcons.icons["calendar"]],
  ["ri/add-large-line", riIcons.icons["add-large-line"]],
  ["ri/arrow-left-double-fill", riIcons.icons["arrow-left-double-fill"]],
  ["ep/delete", epIcons.icons["delete"]],
  ["ep/edit-pen", epIcons.icons["edit-pen"]],
  ["ep/refresh", epIcons.icons["refresh"]],
  ["ep/menu", epIcons.icons["menu"]],
  ["ri/add-circle-line", riIcons.icons["add-circle-line"]],
  ["ri/arrow-up-line", riIcons.icons["arrow-up-line"]],
  ["ri/arrow-down-line", riIcons.icons["arrow-down-line"]],
  ["ep/arrow-up-bold", epIcons.icons["arrow-up-bold"]],
  ["ep/arrow-down-bold", epIcons.icons["arrow-down-bold"]],
  ["ep/arrow-left-bold", epIcons.icons["arrow-left-bold"]],
  ["ep/arrow-right-bold", epIcons.icons["arrow-right-bold"]],
  ["ri/logout-circle-r-line", riIcons.icons["logout-circle-r-line"]],
  ["ri/settings-3-line", riIcons.icons["settings-3-line"]],
  // 多语言切换图标
  ["ri/translate-2", riIcons.icons["translate-2"]],
  ["ri/sun-fill", riIcons.icons["sun-fill"]],
  ["ri/moon-fill", riIcons.icons["moon-fill"]],
  ["ep/star", epIcons.icons["star"]],
  ["ri/menu-fold-fill", riIcons.icons["menu-fold-fill"]],
  ["ri/menu-unfold-fill", riIcons.icons["menu-unfold-fill"]],
  ["ri/user-3-fill", riIcons.icons["user-3-fill"]],
  ["ri/lock-fill", riIcons.icons["lock-fill"]],
  ["ri/home-gear-line", riIcons.icons["home-gear-line"]]
];

// 开发/演示所需的额外图标（来自模拟路由与设置面板）
icons.push(["ep/lollipop", epIcons.icons["lollipop"]]);
icons.push(["ri/calendar-todo-line", riIcons.icons["calendar-todo-line"]]);
icons.push(["ri/book-2-line", riIcons.icons["book-2-line"]]);
icons.push(["ri/list-check", riIcons.icons["list-check"]]);
icons.push(["ri/file-paper-line", riIcons.icons["file-paper-line"]]);
// 表格工具栏列拖拽手柄（改造为 Remix 图标，避免本地 svg 组件依赖）
icons.push(["ri/drag-move-2-fill", riIcons.icons["drag-move-2-fill"]]);
// 侧边栏 Logo 统一：使用 Remix 水滴填充图标
icons.push(["ri/drop-fill", riIcons.icons["drop-fill"]]);

/**
 * 注册离线图标到 Iconify 的运行时（addIcon）
 * 说明：
 * - 在线模式（推荐）：业务代码书写冒号风格（如 "ep:close"、"ri:search-line"），由 IconifyIconOnline 直接远程加载，无需在此处预注册。
 * - 离线模式（兜底）：此处以斜杠风格键名（如 "ep/close"、"ri/search-line"）注册常用图标，
 *   当组件选择使用 IconifyIconOffline 时，可在无网络环境下正常渲染。
 * - 两种模式相互独立：在线/离线互不干扰，统一为项目提供更稳健的图标加载体验。
 */
icons.forEach(([name, icon]) => {
  addIcon(name as string, icon as any);
});
