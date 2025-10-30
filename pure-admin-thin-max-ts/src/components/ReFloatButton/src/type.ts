/**
 * 说明：浮动按钮类型定义
 * 推荐使用冒号风格的图标名（例如：`ri:search-line`、`ep:close`）。运行时由 SmartIcon/useRenderIcon 离线优先渲染，
 * 未命中离线键名时自动在线回退；若需增强离线覆盖，可在 offlineIcon.ts 中按斜杠风格预注册常用图标。
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
