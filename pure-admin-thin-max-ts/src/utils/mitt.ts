import type { Emitter } from "mitt";
import mitt from "mitt";

/**
 * 全局事件总线（mitt）事件类型声明
 * - openPanel：历史上为 string，这里放宽为布尔或对象，便于按通道(channel)与显隐(open/visible/value)控制
 */
type Events = {
  /**
   * 打开/关闭通用面板事件
   * - true/false：直接表示显隐
   * - 对象：{ open|visible|value?: boolean; channel?: string }
   */
  openPanel: boolean | { open?: boolean; visible?: boolean; value?: boolean; channel?: string };
  tagOnClick: string;
  logoChange: boolean;
  tagViewsChange: string;
  changLayoutRoute: string;
  tagViewsShowModel: string;
};

export const emitter: Emitter<Events> = mitt<Events>();
