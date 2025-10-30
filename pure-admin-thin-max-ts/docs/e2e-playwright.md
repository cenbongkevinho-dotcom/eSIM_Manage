# Playwright E2E 运行与稳定性说明

本文档总结本项目在本地与 CI 下运行 Playwright 的推荐方式、稳定性策略与常见问题处理。

## 为什么在 CI 使用 dev server（8848）

- 在少量第三方插件的生产预览（preview）构建阶段，Rollup 会尝试解析本机二进制（例如 macOS 的 `fsevents.node`），从而引发构建失败。
- 为保证云端稳定性与一致的 mock 行为，我们在 CI 下统一使用 Vite dev server，并通过 `ENABLE_PROXY=false` 显式禁用代理，使 `/api` 由 `vite-plugin-fake-server` 提供。

## 基本配置（已在 `playwright.config.ts` 中实现）

- 统一 `baseURL`：`http://localhost:8848`
- `webServer.command`：`ENABLE_PROXY=false pnpm dev`
- `webServer.url`：`http://localhost:8848`
- `webServer.reuseExistingServer`：`true`
- CI 相关：`workers=1`、`timeout=120s`

> 注：如需更换端口，可设置环境变量 `BASE_URL`，同时保证 dev server 的端口与之匹配。

## 本地运行

- 启动开发服务器（可选）：`pnpm dev`（默认 `http://localhost:8848/`）
- 运行全量 E2E：`CI=true pnpm test:e2e`
- 打开报告：`pnpm test:report`

## CI 运行（GitHub Actions）

- 工作流文件 `.github/workflows/e2e-playwright.yml` 会直接调用 Playwright 测试；由于 `playwright.config.ts` 已统一配置为 dev server 模式，因此无需在工作流中显式设置 `BASE_URL`。

## PDF 预览（popup）用例的稳定性策略

- 无头浏览器通常不启用内置 PDF 查看器，点击“预览 PDF”可能不会真正创建新标签页。
- 我们改为监听 `BrowserContext` 级别的网络请求，验证是否发起了 `/api/billing/invoices/:id/pdf?mode=inline` 的 GET 请求，并断言响应状态与 `content-type`。
- 该策略在 Chromium/Firefox/WebKit 三端保持稳定。

## 常见问题

- 端口占用：本地已有 `pnpm dev` 时，Playwright 会复用；如端口不匹配，可通过 `BASE_URL` 覆盖。
- 代理与 mock 冲突：若 `/api` 请求被代理到 `4010`，请确保在测试期间设置 `ENABLE_PROXY=false`。

## 结论

- 统一在 CI 使用 dev server 可规避 preview 构建期的 Rollup 本机二进制解析问题，保证 E2E 测试稳定运行。
- 通过网络请求监听替代“强依赖新标签页事件”的策略，能够更贴近“UI 层触发预览”的实际行为，并在无头模式下稳定验证。

