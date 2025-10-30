import { h, defineComponent, type Component } from "vue";
import type { iconType } from "./types";
import IconifyIconOffline from "./iconifyIconOffline";
import IconifyIconOnline from "./iconifyIconOnline";
import { useRenderIcon } from "./hooks";
import { isOfflineIconRegistered } from "./offlineIcon";

/**
 * 将冒号风格转换为斜杠风格（仅当包含冒号时），用于定位离线注册的键名
 * @param name 图标名字符串（如 "ep:close"、"ri:search-line"）
 * @returns 斜杠风格键名（如 "ep/close"、"ri/search-line"）或原样字符串
 */
function toSlash(name: string): string {
  const i = name.indexOf(":");
  return i !== -1 ? name.slice(0, i) + "/" + name.slice(i + 1) : name;
}

/**
 * 智能图标渲染（SmartIcon）：离线优先 + 在线回退
 * 设计目标：
 * - 业务层仍写在线冒号风格（如 "ep:close"、"ri:search-line"），无需改动；
 * - 组件在运行时优先尝试离线斜杠键名渲染（若已注册），否则回退到在线 Iconify；
 * - 对非字符串（自定义 SVG/对象）与 iconfont 保持与 useRenderIcon 一致的行为，避免行为变化。
 *
 * @param icon 图标源：字符串（推荐冒号风格）、SVG 组件、对象、或 IF- 前缀 iconfont 名称
 * @param attrs 额外属性，如 size、color、class 等，会透传到具体图标组件
 * @returns Vue 可渲染组件实例
 */
export function useRenderIconSmart(icon: any, attrs?: iconType): Component {
  // 非字符串或 iconfont/对象/自定义 SVG：沿用原有通用渲染，避免行为改变
  if (typeof icon !== "string") {
    return useRenderIcon(icon, attrs);
  }

  // 在线风格（包含冒号）：优先尝试离线键名，存在则离线渲染，否则在线渲染
  if (icon.includes(":")) {
    const offlineKey = toSlash(icon);
    if (isOfflineIconRegistered(offlineKey)) {
      return defineComponent({
        name: "SmartIconOffline",
        render() {
          return h(IconifyIconOffline, { icon: offlineKey, ...attrs });
        }
      });
    }
    return defineComponent({
      name: "SmartIconOnline",
      render() {
        return h(IconifyIconOnline, { icon, ...attrs });
      }
    });
  }

  // 非冒号风格：保持 useRenderIcon 原样（斜杠或其它字符串）
  return useRenderIcon(icon, attrs);
}

/**
 * 智能图标组件（SmartIcon）：业务写冒号风格即可，组件自动离线优先渲染
 * Props：
 * - icon：字符串（冒号/斜杠），或 SVG 组件/对象；推荐冒号风格
 * - 其余 attrs 透传到具体图标组件
 */
export default defineComponent({
  name: "SmartIcon",
  props: {
    icon: {
      type: [String, Object, Function],
      default: null
    }
  },
  render() {
    const attrs = this.$attrs as iconType | Record<string, unknown> | undefined;
    const Comp = useRenderIconSmart(this.icon, attrs as iconType);
    // 直接渲染由 useRenderIconSmart 返回的组件实例
    return typeof Comp === "function" ? h(Comp, attrs as any) : Comp;
  }
});

