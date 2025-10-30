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

---

## 跨浏览器稳定策略（详细）

- 尽量使用“网络层断言”替代“UI 事件耦合”。示例：发票 PDF 预览不强依赖 popup 的 `page` 对象与 `Request.response()`，而是在确认 UI 触发请求后，改用 `APIRequestContext` 直链 GET 校验响应头与 PDF 魔数。
- 在 Firefox/WebKit 下，`Request.response()` 可能短时间返回 `null` 或被视为跨页面资源，因此建议：
  - 监听 `BrowserContext` 的 `request` 事件以确认行为发生；
  - 随后用 `page.request.get(...)` 进行断言（头部与体）。
- PDF 魔数校验：使用工具函数 `isPdfMagic(buf)`，仅检查二进制前缀 `%PDF-`，避免对具体内容结构做过度断言，提高兼容性。
- 异步与时序：使用 `expect.poll(...)` 对页面属性（如 `data-open` 等）做轮询断言，减少一次性等待的脆弱性。

## 端口与 BASE_URL 策略细则

- 统一端口默认值为 `8848`，并在 `playwright.config.ts` 的 `webServer.url` 与 `baseURL` 中保持一致。
- 支持通过环境变量 `BASE_URL` 覆盖端口，例如：`BASE_URL=http://localhost:8848 pnpm test:e2e`。
- 测试辅助函数中（如构造直链）存在端口回退逻辑，当未提供 `BASE_URL` 时默认回退到 `http://localhost:8848`，确保 CI 与本地一致。

## 环境变量说明

- `ENABLE_PROXY=false`：禁用代理与真实后端，启用 `vite-plugin-fake-server` 的 `/api` mock，保证云端稳定性与可复现性。
- `BASE_URL`：覆盖 Playwright `baseURL` 与直链构造的基础地址，需与 dev server 实际端口一致。
- `CI=true`：强制三端 headless 模式运行，避免本地 GUI 模式导致的不一致。

## 调试与诊断

- 打开最近一次 HTML 报告：`pnpm exec playwright show-report`
- 打开指定 Trace 压缩包：`pnpm exec playwright show-trace <trace.zip>`
- 在用例中临时添加网络监听：
  - `page.on("response", resp => debugLog("[network]", resp.request().method(), resp.url(), resp.status()))`
- 在工具函数或用例中使用 `debugLog(...)` 打印关键步骤与数据（长度、前缀等），利于快速定位差异。

## 常见错误与排查

- EISDIR：在用户主目录（如 `~`）运行 `pnpm lint`/`pnpm test:e2e` 会因缺少 `package.json` 报错。
  - 解决：先切到子项目根目录 `cd pure-admin-thin-max-ts`，再运行脚本。
- 端口不匹配：`BASE_URL` 与 dev server 端口不一致会导致测试失败。
  - 解决：确保 `BASE_URL` 与实际 dev server 地址一致，或不设置 `BASE_URL` 使用默认 `8848`。

## 函数级注释约定（测试与工具）

- 所有新增或修改的测试与工具函数需添加“函数级注释”，用中文简述：功能、策略、参数、返回值与边界情况，示例：
- 示例约定：
  - 功能：描述函数的核心作用与使用场景；
  - 策略：说明为了稳定性采用的具体手段（如网络层断言、轮询等待、魔数校验）；
  - 参数/返回值：列出关键参数含义与返回类型；
  - 兼容性：提及在不同浏览器驱动下的差异处理与容错逻辑。
