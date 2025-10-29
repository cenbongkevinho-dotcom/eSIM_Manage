# 项目图标使用审计与迁移建议

本文档基于当前代码库的检索结果，统计 Iconify、Element Plus 旧类、自定义 SVG 与 iconfont 的使用情况，并提出统一迁移建议与优先级，便于后续批量替换与规范化。

## 1. 审计范围与方法

- 范围：`src/` 目录（组件、布局、视图、样式）。
- 方法：使用代码检索定位关键使用点：`IconifyIconOffline`、`el-icon-`、`FontIcon`、`useRenderIcon`、`IF-` 前缀。
- 目标：识别可迁移到 iconfont 的位置，标注暂时保留的场景与原因。

### 1.1 辅助工具与入口

- 脚本：`pnpm audit:icon`（位于根目录 `pure-admin-thin-max-ts/package.json` → scripts）。
  - 功能：扫描 `src/` 中的图标字符串用法，强制“在线冒号风格优先（如 `ep:close`）”，斜杠风格仅允许在 `offlineIcon.ts` 中出现。
  - 输出：统计斜杠风格误用与在线图标集 `iconify-json` 存在性校验结果。
- 开发自测页：`/dev/icon-audit`（开发环境菜单显示）。
  - 功能：集中展示 Navbar/Settings/Panel/Schedule 的关键在线图标，并提供交互演示（全屏切换、Panel 打开/关闭、箭头切换、Schedule 新增/空态）。
  - 附加：新增 `Schedule 预览` 子路由 `/dev/schedule-preview` 用于直接访问页面进行回归点验。

### 1.2 提交前钩子（pre-commit）

- 位置：`pure-admin-thin-max-ts/.husky/pre-commit`
- 规则：当本次提交包含前端源码/脚本/依赖变更时自动执行 `pnpm audit:icon`；发现问题将阻断提交。
- 跳过：临时跳过可用 `SKIP_ICON_AUDIT=1 git commit -m "..."`。

### 1.3 CI 审计

- 位置：仓库根目录 `/.github/workflows/icon-audit.yml`
- 触发：push / pull_request
- 行为：安装 `pure-admin-thin-max-ts` 子项目依赖后执行 `pnpm audit:icon`，以防回归。

### 1.4 半自动回归（Playwright，本地）

- 安装浏览器依赖：
  - cd pure-admin-thin-max-ts && pnpm install && pnpm test:install
- 启动与运行：
  - 方式A（自动启动 dev server）：pnpm test:icon:smoke
  - 方式B（已手动启动 dev server 在 8848 端口）：同上命令将复用已启动的服务
- 校验范围：
  - /dev/icon-audit 页的核心在线图标是否渲染（ep:check/close/calendar、ri:arrow-left/right-s-line、ri:add-large-line、ri:fullscreen-\*）
  - /dev/schedule-preview 页基础控件可见性（日期选择占位“请选择日期”、快捷按钮“今天/上个月/下个月”）及日历中至少存在一个 Iconify 图标渲染
  - 箭头切换交互是否工作；Panel 交互在部分浏览器/窗口管理器下偶发不稳，已从冒烟中降级为可选验证

提示：测试会在页面脚本加载前注入“模拟登录态”（localStorage.user-info + multiple-tabs Cookie），避免依赖真实登录接口，仅用于开发自测路由的回归。

配置参考：playwright.config.ts
- testDir: ./tests；默认扫描 tests 目录下所有用例
- use.baseURL: http://localhost:8848（可用 BASE_URL 覆盖）
- webServer: pnpm dev（reuseExistingServer: true，已启动则复用）

新增用例：tests/schedule-preview.spec.ts
- 直达 /#/dev/schedule-preview，断言日期控件与快捷按钮可见
- 断言 .el-calendar 中至少存在一个 .iconify 图标节点

运行日志示例（Chromium）：
- 通过 2/2，用时约 10~15s（机器性能与首次安装浏览器依赖有关）

脚本入口：
- package.json -> scripts.test:icon:smoke：playwright test -c playwright.config.ts --project=chromium

注意：首次运行需执行一次 pnpm test:install 以安装浏览器二进制。

### 1.5 CI 冒烟回归（Playwright，云端）

- 工作流：/.github/workflows/icon-smoke.yml（push / pull_request / workflow_dispatch 触发）
- 关键步骤：
  1) 使用 .nvmrc 设置 Node 版本；pnpm/action-setup 安装 pnpm@9
  2) pnpm install --frozen-lockfile 安装依赖
  3) pnpm test:install 安装 Playwright 浏览器
  4) npx playwright install-deps 安装 Linux 运行时依赖
  5) pnpm test:icon:smoke 执行冒烟用例（仅 Chromium）
- 说明：用例采用和本地一致的“模拟登录态”与 hash 路由直达策略，稳定验证 /dev/icon-audit 与 /dev/schedule-preview 的关键渲染与交互。
- 附：工作流已启用缓存（pnpm store 与 Playwright 浏览器），并在每次运行后上传 HTML 报告（playwright-report）为 Artifact，失败时包含 trace/截图/视频，便于排查。

### 1.6 报告查看与溯源

- 本地查看：
  - 运行完成后执行 pnpm test:report 自动打开 HTML 报告
- CI 中查看：
  - 在 GitHub Actions 的运行详情页下载名为 playwright-report 的 Artifact，并在本地解压后用浏览器打开 index.html

## 2. 现状清单

### 2.1 Iconify 离线（IconifyIconOffline）

以下文件中直接使用了 `IconifyIconOffline`（示例行号仅供参考）：

- 布局/导航相关：
  - `src/layout/components/lay-navbar/index.vue`（退出、设置等）
  - `src/layout/components/lay-sidebar/NavMix.vue`
  - `src/layout/components/lay-sidebar/NavHorizontal.vue`
  - `src/layout/components/lay-sidebar/components/SidebarTopCollapse.vue`
  - `src/layout/components/lay-sidebar/components/SidebarLeftCollapse.vue`
  - `src/layout/components/lay-sidebar/components/SidebarCenterCollapse.vue`
  - `src/layout/components/lay-sidebar/components/SidebarOverallStyle.vue`
  - `src/layout/components/lay-sidebar/components/SidebarFullScreen.vue`
  - `src/layout/components/lay-panel/index.vue`
  - `src/layout/components/lay-notice/index.vue`（铃铛）
  - `src/layout/components/lay-search/index.vue`
  - `src/layout/components/lay-search/components/SearchFooter.vue`
  - `src/layout/components/lay-search/components/SearchHistoryItem.vue`
  - `src/layout/components/lay-search/components/SearchModal.vue`
- 标签页：
  - `src/layout/components/lay-tag/index.vue`（左右箭头、关闭按钮、下拉等）
- 通用组件与视图：
  - `src/components/ReDialog/index.vue`
  - `src/components/ReFloatButton/src/index.vue`
  - `src/components/RePureTableBar/src/bar.tsx`
  - `src/views/tenant/package/index.vue`
  - `src/views/tenant/list/index.vue`
  - `src/views/dict/index.vue`
  - `src/views/dict/tree.vue`
  - `src/views/schedule/index.vue`（含 `ep/calendar`）
  - `src/views/login/index.vue`

补充：注册与渲染基础设施

- `src/main.ts`：注册 `IconifyIconOffline` 到全局。
- `src/components/ReIcon/src/hooks.ts`：`useRenderIcon` 对字符串与对象统一走离线渲染；冒号风格会自动转斜杠。
- `src/components/ReIcon/index.ts`：统一导出 `IconifyIconOffline/Online/FontIcon` 与渲染函数。

### 2.2 Element Plus 旧类（el-icon-\*）

- 样式与模板：
  - `src/layout/components/lay-tag/index.vue`：`class="el-icon-close"`
  - `src/layout/components/lay-tag/index.scss`：`.el-icon-close { ... }`
  - `src/style/dark.scss`：`.el-icon-close { ... }`
  - `src/style/element-plus.scss`：`.el-upload-list__item.is-ready &.el-icon--close { ... }`

评估建议：

- 标签页中关闭动作图标已通过 `Iconify` 渲染（`Close`），`el-icon-close` 类目前主要用于兼容覆盖样式，可暂保留。
- Element Plus 内置节点（如上传列表的关闭按钮）使用类名覆盖更稳妥；等 iconfont 库补齐后再评估统一替换样式。

### 2.3 Iconfont（FontIcon 与 IF- 前缀）

- 已使用位置：
  - `src/layout/components/lay-navbar/index.vue`：`<FontIcon icon="pure-iconfont-new" />`
  - `src/layout/components/lay-sidebar/components/SidebarLogo.vue`：`<FontIcon icon="pure-iconfont-logo" />`
  - `src/layout/components/lay-setting/index.vue`：`Segmented` 示例 `IF-pure-iconfont-tabs`（通过 `useRenderIcon` 注入）

- 资源与样式：
  - `src/assets/iconfont/iconfont.css`：`.iconfont` 与 `.pure-iconfont-*`，以及统一 `symbol` 的 `.icon-svg` 样式。
  - `src/assets/iconfont/iconfont.js`：`<symbol id="pure-iconfont-tabs/logo/new">`（已解析确认）
  - `src/assets/iconfont/iconfont.json`：`css_prefix_text` 为 `pure-iconfont-`，`glyphs` 包含 `Tabs/Logo/New`。

## 3. 迁移建议与优先级

### 3.1 优先迁移（需先扩充 iconfont 库）

- 通用与品牌风格统一：
  - 设置（Setting）：建议新增 `pure-iconfont-setting`（齿轮）。
  - 搜索（Search）：`pure-iconfont-search`（放大镜）。
  - 通知（Bell）：`pure-iconfont-bell`（铃铛）。
  - 刷新（Refresh）：`pure-iconfont-refresh`。
  - 全屏/退出（Fullscreen/Exit）：`pure-iconfont-fullscreen`、`pure-iconfont-exit-fullscreen`。
  - 箭头/折叠（Chevron/Arrow）：`pure-iconfont-arrow-left/right/up/down`。
  - 日历（Calendar）：`pure-iconfont-calendar`。

实施示例（统一 IF- 前缀 + useRenderIcon）：

```ts
// 用于按钮/菜单图标的统一写法（font-class 默认）
useRenderIcon("IF-pure-iconfont-setting");
useRenderIcon("IF-pure-iconfont-search");
useRenderIcon("IF-pure-iconfont-bell");

// 如需 symbol(svg) 或 unicode
useRenderIcon("IF-pure-iconfont-setting svg");
useRenderIcon("IF-\ue615 uni"); // unicode 示例，需替换为真实值
```

### 3.2 暂缓迁移

- 业务含义较强或暂未在 iconfont 库中的图标：保持 Iconify 离线，待库补齐后再迁移。
- Element Plus 内置节点（依赖类选择器的样式覆盖）：在不影响交互的前提下保留；集中在 `.el-icon-close` 等，后续统一样式再评估。

## 4. 实施步骤与里程碑

1. 扩充 iconfont 库：在 `iconfont.json/css/js` 中新增通用图标（建议一次性导入）。
2. 小范围演示替换：导航（设置/搜索/通知）、侧边栏（折叠/展开）、页面工具栏（刷新/日历）。
3. 批量替换：基于审计清单，按模块替换为 IF- 前缀统一写法，并确保 `style.fontSize` 等视觉统一。
4. 保留与备注：对暂不适合迁移的位置，标注原因（库未补齐、业务含义、Element 内置约束）。
5. 验收标准：
   - Lint 无报错；
   - 视觉统一（大小/颜色/基线一致）；
   - 交互无回归（点击命令、折叠状态等正常）。

## 5. 兼容性与风险

- symbol(svg) 模式：需使用 `iconfont.js` 的真实 `<symbol id>`，当前项目与 `font-class` 名称一致（如 `pure-iconfont-tabs`），已验证。
- 字体加载：`@font-face` 的路径与缓存需与构建环境一致，建议保持相对路径与版本一致性。
- 第三方组件：Element Plus 内置节点的关闭等样式覆盖保留，避免影响交互。

## 6. 维护建议

- 统一入口：字符串图标统一通过 `useRenderIcon`（支持 IF-/Iconify/SVG）。
- 规范沉淀：在贡献者指南中纳入 `IF-` 前缀与 `iconAttrs` 的统一用法，避免新增代码偏离规范。
- 文档与示例：`docs/iconfont-usage.md` 已补充真实 `symbol` 示例，可持续更新新增图标的样例与注意事项。

---

如需我直接开始扩充 iconfont 库并进行小范围替换，请提供你偏好的图标名称与风格（font_class/unicode）。我将基于本审计清单生成 PR 并逐步推进批量替换。
