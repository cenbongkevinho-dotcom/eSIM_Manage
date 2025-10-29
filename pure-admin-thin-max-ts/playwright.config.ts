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
    baseURL: process.env.BASE_URL || "http://localhost:8848",
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
  /* 仅启用 Chromium */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  /* 本地运行时如已有 dev server 则复用，避免端口占用失败 */
  webServer: {
    command: "pnpm dev",
    url: process.env.BASE_URL || "http://localhost:8848",
    reuseExistingServer: true,
    /**
     * CI 环境下提升 dev server 启动等待时间，避免云端冷启动导致的端口监听延迟：
     * - CI=true: 120s
     * - 本地: 60s
     */
    timeout: process.env.CI ? 120 * 1000 : 60 * 1000
  }
});
