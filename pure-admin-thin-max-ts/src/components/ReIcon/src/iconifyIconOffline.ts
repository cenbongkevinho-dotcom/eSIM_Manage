import { h, defineComponent } from "vue";
import { Icon as IconifyIcon, addIcon } from "@iconify/vue/dist/offline";

/**
 * IconifyIconOffline 组件
 * 说明：
 * - 用于离线渲染 Iconify 图标（支持斜杠风格键名或本地图标对象）。
 * - 统一在根节点标记 data-render-source="offline"，便于 E2E 测试与调试识别渲染来源。
 */
export default defineComponent({
  name: "IconifyIconOffline",
  components: { IconifyIcon },
  props: {
    icon: {
      default: null
    }
  },
  /**
   * 渲染函数
   * - 若传入对象：作为本地图标对象通过 addIcon 注册后直接渲染（仍标记 offline）。
   * - 若传入字符串：作为斜杠风格离线键名渲染。
   */
  render() {
    if (typeof this.icon === "object") addIcon(this.icon, this.icon);
    const attrs = this.$attrs;
    if (typeof this.icon === "string") {
      return h(
        IconifyIcon,
        {
          icon: this.icon,
          "aria-hidden": false,
          "data-render-source": "offline",
          style: attrs?.style
            ? Object.assign(attrs.style, { outline: "none" })
            : { outline: "none" },
          ...attrs
        },
        {
          default: () => []
        }
      );
    } else {
      return h(
        this.icon,
        {
          "aria-hidden": false,
          "data-render-source": "offline",
          style: attrs?.style
            ? Object.assign(attrs.style, { outline: "none" })
            : { outline: "none" },
          ...attrs
        },
        {
          default: () => []
        }
      );
    }
  }
});
