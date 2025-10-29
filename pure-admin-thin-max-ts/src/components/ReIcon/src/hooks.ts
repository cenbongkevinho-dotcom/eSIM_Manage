import type { iconType } from "./types";
import { h, defineComponent, type Component } from "vue";
import { FontIcon, IconifyIconOffline, IconifyIconOnline } from "../index";

/**
 * 通用图标渲染函数（在线冒号风格优先，兼容离线斜杠风格）
 * 说明：
 * - 支持 iconfont（IF- 前缀），可通过空格指定模式："IF-pure-iconfont-logo svg" / "IF-pure-iconfont-logo uni"
 * - 支持自定义 SVG 组件（函数或带 render 的对象），原样渲染
 * - 支持 Iconify 在线图标（冒号风格，如 "ep:delete"、"ri:fullscreen-fill"），无需预注册，直接从网络加载
 * - 支持 Iconify 离线图标（斜杠风格，如 "ep/delete"、"ri/fullscreen-fill"），依赖预注册（offlineIcon.ts）
 * - 渲染规则：
 *   1) 以 "IF-" 开头 → 使用 FontIcon（iconfont）
 *   2) 传入函数/带 render 的对象 → 视为自定义 SVG 组件
 *   3) 传入对象 → 作为离线图标对象传给 IconifyIconOffline
 *   4) 传入字符串：
 *      - 包含冒号（":"）→ 使用 IconifyIconOnline 按在线模式加载（不做格式转换）
 *      - 其他情况 → 使用 IconifyIconOffline（保持斜杠风格或原样）
 *
 * @param icon 图标源：字符串（IF- 前缀、Iconify 名称）、组件、对象
 * @param attrs 额外属性，如 size、color、class 等，会透传到具体图标组件
 * @returns Vue 可渲染组件实例，用于直接在模板内使用
 */
export function useRenderIcon(icon: any, attrs?: iconType): Component {
  // iconfont：以 IF- 作为约定前缀，支持 "IF-pure-iconfont-logo" 与带模式的 "IF-pure-iconfont-logo svg/uni"
  const ifReg = /^IF-/;
  // typeof icon === "function" 属于SVG
  if (ifReg.test(icon)) {
    // 解析 IF- 前缀后的名称与模式
    const name = String(icon).split(ifReg)[1] || "";
    const spaceIndex = name.indexOf(" ");
    // icon 名称：不含空格则取整段；含空格则取空格之前
    const iconName = spaceIndex === -1 ? name : name.slice(0, spaceIndex);
    // 图标模式：仅当存在空格时解析（svg/uni），否则不传递该属性，默认走 font-class
    const iconMode = spaceIndex === -1 ? undefined : name.slice(spaceIndex + 1);
    return defineComponent({
      name: "FontIcon",
      render() {
        return h(FontIcon, {
          icon: iconName,
          // 仅当显式指定模式时才传递 iconType，避免误判
          ...(iconMode ? { iconType: iconMode } : {}),
          ...attrs
        });
      }
    });
  } else if (typeof icon === "function" || typeof icon?.render === "function") {
    // svg
    return attrs ? h(icon, { ...attrs }) : icon;
  } else if (typeof icon === "object") {
    return defineComponent({
      name: "OfflineIcon",
      render() {
        return h(IconifyIconOffline, {
          icon: icon,
          ...attrs
        });
      }
    });
  } else {
    /**
     * Iconify 在线/离线渲染（按命名风格自动选择）：
     * - 冒号风格（如 "ep:delete"、"ri:fullscreen-fill"）→ 在线加载 IconifyIconOnline（无需预注册、可加载所有图标）
     * - 非冒号风格（如 "ep/delete"、"ri/fullscreen-fill"）→ 离线渲染 IconifyIconOffline（依赖离线注册）
     */
    return defineComponent({
      name: "Icon",
      render() {
        if (!icon) return;
        if (typeof icon === "string" && icon.includes(":")) {
          // 在线模式：保持冒号命名原样传入
          return h(IconifyIconOnline, {
            icon: icon,
            ...attrs
          });
        }
        // 离线模式：斜杠或其它字符串，原样传入（需已通过 addIcon 注册）
        return h(IconifyIconOffline, {
          icon: icon,
          ...attrs
        });
      }
    });
  }
}
