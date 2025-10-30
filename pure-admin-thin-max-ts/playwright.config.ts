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
    // - CI 云端：推荐使用 vite preview 默认端口 4173，更稳定、资源占用更低
    baseURL:
      process.env.BASE_URL || (process.env.CI ? "http://localhost:4173" : "http://localhost:8848"),
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
   * - 本地：启动 Vite 开发服务器（pnpm dev），端口 8848，可复用已存在的服务
   * - CI：使用构建后的 vite preview 静态预览，端口 4173，更适合云端稳定运行
   */
  webServer: {
    // 函数级注释：在 CI 环境下切换为预览模式，避免 dev server 的热更新与文件监听在云端造成不稳定
    command: process.env.CI ? "pnpm preview:build" : "pnpm dev",
    url:
      process.env.BASE_URL || (process.env.CI ? "http://localhost:4173" : "http://localhost:8848"),
    reuseExistingServer: true,
    /**
     * CI 环境下提升 dev server 启动等待时间，避免云端冷启动导致的端口监听延迟：
     * - CI=true: 120s
     * - 本地: 60s
     */
    timeout: process.env.CI ? 120 * 1000 : 60 * 1000
  }
});
