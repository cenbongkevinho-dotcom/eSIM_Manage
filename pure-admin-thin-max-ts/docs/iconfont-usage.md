# 图标统一使用指引（Iconify + Iconfont）

本文档说明项目内图标体系与统一用法，便于在不同组件中保持一致的渲染表现与维护方式。

## 一、现状概述

- Iconify 离线图标：通过 `IconifyIconOffline` 组件使用，离线数据在 `src/components/ReIcon/src/offlineIcon.ts` 中统一注册。
- 自定义 SVG：分散在 `src/assets/svg` 目录下，部分组件直接引入使用。
- Iconfont（阿里）：资源在 `src/assets/iconfont` 下，支持三种模式：`font-class`（默认）、`unicode`、`symbol(svg)`。
- 统一渲染函数：`useRenderIcon`，支持：
  - IF- 前缀的 iconfont（默认走 `font-class` 模式）
  - Iconify 离线（斜杠风格字符串或对象）
  - 直接传入的 SVG 组件函数

## 二、推荐统一用法

优先使用 `useRenderIcon`，字符串情况下统一走离线渲染，避免运行时网络请求。

1) Iconify 离线（推荐斜杠风格）：

```ts
useRenderIcon("ep/close")
useRenderIcon("ri/search-line")
```

2) Iconfont（IF- 前缀）：

- font-class（默认）：

```ts
useRenderIcon("IF-pure-iconfont-tabs")
useRenderIcon("IF-pure-iconfont-logo")
useRenderIcon("IF-pure-iconfont-new")
```

- unicode：

```ts
// 以 iconfont.json 的 unicode 为准（例如："e615"），在 IF- 名称后加空格并指定 uni 模式
useRenderIcon("IF-\ue615 uni")
```

- symbol(svg)：

```ts
// 注意：symbol 模式需使用 <symbol> 的 id 值（与 font-class 一致，来自 iconfont.js 的 <symbol id="...">）
// 本项目真实示例（已从 src/assets/iconfont/iconfont.js 解析得到）：
useRenderIcon("IF-pure-iconfont-tabs svg")
useRenderIcon("IF-pure-iconfont-logo svg")
useRenderIcon("IF-pure-iconfont-new svg")
```

提示：symbol 的 id 在当前项目中与 `font-class` 名称一致（例如：`pure-iconfont-tabs`）。若不确定，建议使用默认的 `font-class` 模式。

## 三、属性与样式（iconAttrs）

`useRenderIcon(name, attrs)` 中的 `attrs` 支持：大小（width/height）、颜色（color/fill）、样式（style）等。例如：

```ts
useRenderIcon("IF-pure-iconfont-tabs", {
  style: { fontSize: "16px", color: "var(--el-color-primary)" }
})
```

在 Segmented 等组件中，为了让 font-class 图标与 svg 图标在视觉上高度一致，建议设置 `style.fontSize`。

## 四、页面与组件示例

- 设置面板页签风格：在 `src/layout/components/lay-setting/index.vue` 的 Segmented 选项里增加了 `IF-pure-iconfont-tabs` 的演示，搭配 `iconAttrs.style.fontSize` 统一大小。
- 顶部导航语言切换：示范替换为 `FontIcon`（纯演示），验证 iconfont 在导航区域的表现。
- 侧边栏 Logo：在 `SidebarLogo` 中加入 `FontIcon` 作为备用显示，统一风格并验证引入正常。

## 五、迁移建议

- 保持 Iconify 离线为主，iconfont 用于能明显提升一致性的场景（如品牌、统一风格的通用图标）。
- 若需要大量使用 iconfont，请统一通过 `IF-` 前缀 + `useRenderIcon` 接入；遇到 symbol 模式不确定 id 时，优先采用默认的 `font-class` 模式。

## 六、常见问题

- 为什么字符串图标都走离线？
  - 统一走离线可以避免运行时网络依赖与虚拟模块，提升稳定性与可维护性。
- `ep:delete` 旧写法还能用吗？
  - `useRenderIcon` 会自动转换为 `ep/delete`，建议统一斜杠风格。
- symbol 模式大小不对怎么办？
  - 已在 `iconfont.css` 中添加 `.icon-svg` 默认样式，更多尺寸控制可通过 `width/height` 或 `style` 属性定制。

如需补充图标或新增规范，请在 PR 中更新本文档并同步修改 `iconfont.css/js` 与 `useRenderIcon` 的示例。
