import type { Component } from "vue";
import type { iconType } from "@/components/ReIcon/src/types";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

/**
 * 安全渲染图标封装（在线优先、双风格兼容）：
 * 说明：
 * - 推荐统一使用在线“冒号风格”（如 ep:delete、ri:search-line），可直接通过 Iconify 在线组件加载；
 * - 同时兼容离线“斜杠风格”（如 ep/delete、ri/search-line），保留原样传递以支持离线注册渲染；
 * - 对空值或非法值提供在线兜底图标（ri:information-line）。
 *
 * 函数行为：
 * - 若传入为有效字符串，不做格式转换，原样交给 useRenderIcon；
 * - 若为空或非法，兜底为 ri:information-line（在线冒号风格）。
 *
 * @param icon 图标名字符串（推荐在线冒号风格），也兼容斜杠风格；或自定义 SVG 组件
 * @param attrs 图标属性（大小、颜色、class 等）
 * @returns 可渲染的图标组件（Component）
 */
export function useRenderIconSafe(icon: unknown, attrs?: iconType): Component {
  let name = "ri:information-line";
  if (typeof icon === "string" && icon.trim().length > 0) {
    name = icon; // 在线冒号或离线斜杠风格均原样透传，交由 useRenderIcon 选择渲染策略
  }
  return useRenderIcon(name, attrs);
}
