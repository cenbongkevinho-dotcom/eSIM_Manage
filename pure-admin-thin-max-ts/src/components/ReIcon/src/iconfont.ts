import { h, defineComponent } from "vue";

/**
 * FontIcon 组件
 * 说明：
 * - 封装阿里 iconfont 三种引用模式：font-class（默认）、unicode（传 uni）、symbol（传 svg）
 * - 与 src/assets/iconfont/iconfont.css / iconfont.js 配合使用
 * - 使用示例：
 *   1) <FontIcon icon="pure-iconfont-logo" />                // font-class 模式
 *   2) <FontIcon icon="\ue615" uni />                        // unicode 模式
 *   3) <FontIcon icon="pure-iconfont-logo" svg />             // symbol 模式（xlink:href="#pure-iconfont-logo"）
 */
export default defineComponent({
  name: "FontIcon",
  props: {
    icon: {
      type: String,
      default: ""
    }
  },
  render() {
    const attrs = this.$attrs;
    // unicode 引用：直接渲染字符，外层使用 .iconfont 来应用 @font-face 字体
    if (Object.keys(attrs).includes("uni") || attrs?.iconType === "uni") {
      return h(
        "i",
        {
          class: "iconfont",
          ...attrs
        },
        this.icon
      );
    } else if (
      Object.keys(attrs).includes("svg") ||
      attrs?.iconType === "svg"
    ) {
      // symbol 引用：通过 <use xlink:href="#id"> 引用，样式使用 .icon-svg 控制尺寸和颜色
      return h(
        "svg",
        {
          class: "icon-svg"
        },
        {
          default: () => [
            h("use", {
              "xlink:href": `#${this.icon}`
            })
          ]
        }
      );
    } else {
      // font-class 引用（默认）：拼接 .iconfont + 具体类名（如 .pure-iconfont-logo）
      return h("i", {
        class: `iconfont ${this.icon}`,
        ...attrs
      });
    }
  }
});
