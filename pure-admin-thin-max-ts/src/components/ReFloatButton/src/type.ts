/**
 * 说明：浮动按钮类型定义
 * 推荐使用 Iconify 在线冒号风格的图标名（例如：`ri:search-line`、`ep:close`），无需预注册即可渲染。
 * 若需要在无网络环境下使用离线渲染，可在 offlineIcon.ts 中按斜杠风格（如 `ri/search-line`）预注册，
 * 并在渲染层选择 IconifyIconOffline 组件达到兜底效果。
 */

export interface floatBtnsType {
  /** 提示信息 */
  tip?: string;
  /** 图标 */
  icon: string;
  /** 链接 */
  link?: string;
  /** 是否显示 */
  show: boolean;
}
