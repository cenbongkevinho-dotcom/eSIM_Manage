import iconifyIconOffline from "./src/iconifyIconOffline";
import iconifyIconOnline from "./src/iconifyIconOnline";
import fontIcon from "./src/iconfont";
import { useRenderIcon } from "./src/hooks";
import { useRenderIconSafe } from "./src/useRenderIconSafe";
import smartIcon, { useRenderIconSmart } from "./src/smartIcon";

/** 本地图标组件 */
const IconifyIconOffline = iconifyIconOffline;
/** 在线图标组件 */
const IconifyIconOnline = iconifyIconOnline;
/** `iconfont`组件 */
const FontIcon = fontIcon;
/** 智能图标组件：离线优先 + 在线回退 */
const SmartIcon = smartIcon;

/**
 * 导出统一渲染函数，便于各组件从同一路径引入
 * - useRenderIcon：通用渲染（IF-/Iconify/SVG），离线优先
 * - useRenderIconSafe：对不确定字符串（冒号/斜杠）提供兜底处理
 */
export {
  IconifyIconOffline,
  IconifyIconOnline,
  FontIcon,
  SmartIcon,
  useRenderIcon,
  useRenderIconSafe,
  useRenderIconSmart
};
