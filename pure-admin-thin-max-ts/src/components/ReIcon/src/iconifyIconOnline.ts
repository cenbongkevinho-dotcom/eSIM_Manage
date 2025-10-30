import { h, defineComponent } from "vue";
import { Icon as IconifyIcon } from "@iconify/vue";

/**
 * IconifyIconOnline 组件
 * 说明：
 * - 用于在线渲染 Iconify 图标（冒号风格字符串）。
 * - 统一在根节点标记 data-render-source="online"，便于 E2E 测试与调试识别渲染来源。
 */
export default defineComponent({
  name: "IconifyIconOnline",
  components: { IconifyIcon },
  props: {
    icon: {
      type: String,
      default: ""
    }
  },
  /**
   * 渲染函数
   * - 始终以在线模式渲染 Iconify 冒号风格图标。
   */
  render() {
    const attrs = this.$attrs;
    return h(
      IconifyIcon,
      {
        icon: `${this.icon}`,
        "aria-hidden": false,
        "data-render-source": "online",
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
});
