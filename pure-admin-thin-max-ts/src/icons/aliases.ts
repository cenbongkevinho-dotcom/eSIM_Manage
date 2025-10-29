/**
 * 图标别名集中管理：
 * - 将业务语义（如 subscriptions、activationCodes）映射到具体图标字符串；
 * - 统一使用在线“冒号风格”字符串（如 ep:home-filled、ri:book-open-line），便于直接通过 Iconify API 加载；
 * - 如需切换样式或品牌，只需在此修改映射，无需全局替换调用；
 */
export type IconAlias =
  | "home"
  | "subscriptions"
  | "activationCodes"
  | "operators"
  | "settings"
  | "calendar"
  | "add";

const iconAliases: Record<IconAlias, string> = {
  home: "ep:home-filled",
  subscriptions: "ri:book-open-line",
  activationCodes: "ri:vip-diamond-line",
  operators: "ri:user-heart-line",
  settings: "ri:settings-3-line",
  calendar: "ep:calendar",
  add: "ri:add-large-line"
};

/**
 * 根据别名获取统一的图标字符串
 * @param alias 业务语义别名，如 'subscriptions'
 * @returns 在线冒号风格图标名，如 'ri:book-open-line'
 */
export function getIconName(alias: IconAlias): string {
  return iconAliases[alias];
}
