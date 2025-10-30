import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright 基础配置
 * - 使用 Vite 开发服务器作为被测站点
 * - 默认 baseURL 指向开发端口（.env.development -> VITE_PORT = 8848）
 * - 仅启用 Chromium 项目，满足最小化的“图标渲染与交互”冒烟验证
 * - 启用 trace/screenshot：失败时保留，CI 中会上传 HTML 报告与 trace 便于排查
 */
export default defineConfig({
  testDir: "./tests",
  /* 默认超时：单个测试 30s */
  timeout: 30 * 1000,
  /* 期望断言超时 */
  expect: { timeout: 10 * 1000 },
  /**
   * 重试策略：
   * - 在 CI 环境下开启 1 次重试，抵御云端环境偶发抖动（冷启动、网络波动等）。
   * - 本地保持默认不重试，便于快速暴露问题。
   */
  retries: process.env.CI ? 1 : 0,
  /**
   * CI 稳定性：
   * - 在 CI 环境下（CI=true）使用单 worker，降低并发带来的端口/资源竞争与偶发竞态。
   * - 本地保持 Playwright 默认 workers（CPU 核心数），保证开发效率。
   */
  workers: process.env.CI ? 1 : undefined,
  /* 报告器：控制台列表 + HTML（CI 中由工作流采集为 Artifact） */
  reporter: [["list"], ["html", { open: "never" }]],
  /* 基础 URL，允许通过环境变量覆盖（如 CI 场景） */
  use: {
    // 函数级注释：根据环境选择基础 URL
    // - 本地开发：默认 8848（由 .env.development 配置）
    // - CI 云端：改用 dev server（端口 8848）以规避部分插件在 preview 构建阶段的 Rollup 解析问题
    baseURL:
      process.env.BASE_URL ||
      "http://localhost:8848",
    headless: true,
    /*
     * 失败调试辅助：
     * - trace: retain-on-failure -> 仅失败时保留录制
     * - screenshot: only-on-failure -> 仅失败时截图
     * - video: retain-on-failure -> 仅失败时保留视频（如不需要可改为 'off' 降低 Artifact 体积）
     */
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
    ,
    // 函数级注释：启用下载捕获
    // - 某些浏览器（Firefox/WebKit）在未启用时无法触发 download 事件，导致无法断言下载行为
    // - 将 acceptDownloads 设置为 true，允许 Playwright 捕获并管理下载
    acceptDownloads: true
  },
  /* 浏览器项目：默认启用 Chromium，并追加 Firefox / WebKit 以便本地跨浏览器验证 */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    /**
     * Firefox 项目
     * 用途：在 Gecko 引擎下验证图标渲染与交互逻辑，补充跨浏览器覆盖。
     */
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] }
    },
    /**
     * WebKit 项目（Safari）
     * 用途：在 WebKit 引擎下验证图标渲染与交互逻辑，避免特性差异导致的回归。
     */
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] }
    }
  ],
  /* Web 服务器：
   * - 本地 / CI：统一使用 Vite 开发服务器（pnpm dev），端口 8848
   *   说明：由于少量第三方插件在 preview 构建阶段存在 Rollup 解析本机二进制的异常（如 fsevents.node），
   *        CI 下也改用 dev server，避免构建期异常；同时通过 ENABLE_PROXY=false 禁用代理，让 mock 接口正常工作。
   */
  webServer: {
    // 函数级注释：为确保 /api 由 vite-plugin-fake-server 接管而非代理到 4010，显式禁用代理：ENABLE_PROXY=false
    command: "ENABLE_PROXY=false pnpm dev",
    url: process.env.BASE_URL || "http://localhost:8848",
    // 函数级注释：允许复用已存在的服务，提升本地与 CI 复测效率
    reuseExistingServer: true,
    /**
     * CI 环境下提升 dev server 启动等待时间，避免云端冷启动导致的端口监听延迟：
     * - CI=true: 120s
     * - 本地: 60s
     */
    timeout: process.env.CI ? 120 * 1000 : 60 * 1000
  }
});
