/**
 * 图标别名集中管理：
 * - 将业务语义（如 subscriptions、activationCodes）映射到具体图标字符串；
 * - 统一使用“冒号风格”字符串（如 ep:home-filled、ri:book-open-line），由 useRenderIcon/SmartIcon 在运行时优先尝试离线键名渲染，未命中时在线回退；
 * - 如需切换样式或品牌，只需在此修改映射，无需全局替换调用；
 */
export type IconAlias =
  | "home"
  | "subscriptions"
  | "activationCodes"
  | "operators"
  | "settings"
  | "calendar"
  | "add"
  | "analytics";

const iconAliases: Record<IconAlias, string> = {
  home: "ep:home-filled",
  subscriptions: "ri:book-open-line",
  activationCodes: "ri:vip-diamond-line",
  operators: "ri:user-heart-line",
  settings: "ri:settings-3-line",
  calendar: "ep:calendar",
  add: "ri:add-large-line",
  analytics: "ri:bar-chart-line"
};

/**
 * 根据别名获取统一的图标字符串
 * @param alias 业务语义别名，如 'subscriptions'
 * @returns 冒号风格图标名，如 'ri:book-open-line'（运行时离线优先 + 在线回退）
 */
export function getIconName(alias: IconAlias): string {
  return iconAliases[alias];
}
