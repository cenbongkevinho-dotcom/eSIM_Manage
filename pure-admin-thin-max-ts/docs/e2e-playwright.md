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

---

## CI 失败排查路径（GitHub Actions）

1) 快速确认工作流上下文
- 入口：`.github/workflows/e2e-playwright.yml`
- 关键点：统一使用 `pnpm dev` 启动 Vite dev server，端口 `8848`；Playwright 的 `webServer` 与 `baseURL` 已在 `playwright.config.ts` 内部对齐。

2) 常见失败类型与定位
- 开发服务器未就绪：日志出现 `Dev server not ready` 或端口被占用
  - 排查：检查 job 日志是否有 `Local: http://localhost:8848/`；若无，查看是否存在并发启动或上一步骤失败。
  - 解决：确保 `reuseExistingServer: true`，并在 CI 下使用 `workers=1` 以避免并发竞争。
- 网络断言失败：`expect(received).toMatchObject(...)` 断言状态码/头部不符
  - 排查：打开 Trace（下方第 3 步），在 `Network` 面板查看具体请求与响应；确认 `ENABLE_PROXY=false` 是否生效，避免后端代理导致响应差异。
- 端口/BASE_URL 不一致：测试访问 8848，但 dev server 实际启动在不同端口
  - 排查：在日志中搜索 `BASE_URL` 与 dev server 启动信息；如需覆盖，统一通过环境变量设置。
- 下载事件不触发：`page.waitForEvent("download")` 超时
  - 排查：确认 `acceptDownloads: true` 在项目级配置开启；若下载由浏览器内置预览替代（PDF 等），参考下文改用网络层断言。

3) Trace 报告与本地重现
- 下载 CI 产出的 `trace.zip`，然后在本地执行：
  - `pnpm exec playwright show-trace path/to/trace.zip`
- 本地重现建议：
  - `CI=true BASE_URL=http://localhost:8848 pnpm test:e2e --project=chromium`（尽量与 CI 环境一致）
  - 必要时打开 Inspector：`PWDEBUG=1 pnpm test:e2e --project=firefox tests/invoices-pdf.spec.ts -g "PDF 预览触发网络请求"`

4) 服务器日志与构建
- 如果构建/启动异常，优先查看 job 输出中 Vite 的启动日志，确认 mock 插件已启用，`/api` 路由由 `vite-plugin-fake-server` 提供。

---

## Trace/Inspector 断点定位范例（含函数级注释）

以下示例演示如何用 `test.step(...)`、`debugLog(...)` 与 Inspector 结合定位下载与网络断言问题。示例以 CSV 导出为例，强调函数级注释约定。

```ts
import { test, expect, type Page } from "@playwright/test";

/**
 * 函数：gotoOverview
 * 功能：导航到 Analytics Overview 页面并等待核心 UI 就绪
 * 策略：统一通过可见性断言与更稳健的选择器定位，避免脆弱的时序依赖
 * 参数：page — Playwright Page 实例
 * 返回：Promise<void>
 * 兼容性：Chromium/Firefox/WebKit 三端一致，无浏览器特定 API
 */
async function gotoOverview(page: Page): Promise<void> {
  await test.step("导航到 Overview 并等待布局就绪", async () => {
    await page.goto("/analytics/overview");
    await expect(page.locator("[data-test=overview-root]"), "Overview 根容器可见").toBeVisible();
  });
}

/**
 * 函数：downloadCsvWithInspector
 * 功能：点击导出按钮，捕获 Download 事件，并在需要时开启 Inspector 调试
 * 策略：使用 `page.waitForEvent("download")` 结合 `test.step` 分段记录过程；
 *       若事件不触发，改用网络层断言作为回退策略（见下方注释）
 * 参数：page — Playwright Page 实例
 * 返回：下载文件名字符串
 * 兼容性：需 `acceptDownloads: true`；Firefox/WebKit 下事件稳定，但在极端慢网情况下建议增加超时
 */
async function downloadCsvWithInspector(page: Page): Promise<string> {
  return await test.step("导出 CSV 并捕获 download", async () => {
    // 可在本地调试时临时开启 Inspector：
    // await page.pause();
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30_000 }),
      page.getByRole("button", { name: /导出/i }).click(),
    ]);
    const fileName = await download.suggestedFilename();
    return fileName;
  });
}

/**
 * 函数：assertCsvDownloaded
 * 功能：断言下载的文件名符合约定，并记录关键诊断信息
 * 策略：通过 `expect(...).toMatch()` 验证文件名模式；在失败时输出上下文日志以利于 CI 排查
 * 参数：fileName — 下载的文件名
 * 返回：Promise<void>
 * 兼容性：与浏览器无关
 */
async function assertCsvDownloaded(fileName: string): Promise<void> {
  await test.step("断言下载文件名", async () => {
    expect(fileName).toMatch(/overview-\d{4}-\d{2}-\d{2}\.csv/i);
  });
}

test("Overview 导出 CSV（含 Inspector 调试入口）", async ({ page }) => {
  await gotoOverview(page);
  const fileName = await downloadCsvWithInspector(page);
  await assertCsvDownloaded(fileName);
});
```

当 `download` 事件在无头模式下表现不稳定（例如被浏览器内置预览拦截）时，建议回退到“网络层断言 + 直链校验”的组合策略，模板示例如下：

```ts
import { test, expect, type APIResponse } from "@playwright/test";

/**
 * 函数：assertCsvByNetwork
 * 功能：在 UI 触发导出操作后，通过直链 GET 验证响应头与内容前缀
 * 策略：不依赖 `page.waitForEvent("download")`，而改用 `page.request.get(...)` 做稳定断言
 * 参数：url — 直链导出地址（含查询参数约束，例如 ?format=csv）
 * 返回：Promise<APIResponse>
 * 兼容性：三端一致；推荐用于 CI 慢网与无头模式
 */
async function assertCsvByNetwork(url: string): Promise<APIResponse> {
  return await test.step("直链校验 CSV 响应头与内容前缀", async () => {
    const resp = await page.request.get(url);
    expect(resp.ok(), "响应状态为 2xx").toBeTruthy();
    expect(resp.headers()["content-type"]).toMatch(/text\/csv/i);
    const body = await resp.text();
    expect(body.slice(0, 64)).toMatch(/(^|\n)date,\s*metric,\s*value/i);
    return resp;
  });
}
```

提示：在实际工程中可配合 `debugLog(...)` 输出关键诊断（如响应头、前缀、长度），并使用 `expect.poll(...)` 针对页面状态（按钮启用态、加载指示器消失）做轮询断言，以降低一次性等待的脆弱性。

---

## 稳定策略代码模板（可复制粘贴）

PDF 直链与魔数校验组合（节选）：

```ts
import { test, expect } from "@playwright/test";
import { buildInvoicePdfUrl, getPdfResponse, isPdfMagic } from "./tests/helpers/e2e-utils";

/**
 * 函数：assertInvoicePdfInline
 * 功能：在 UI 触发 PDF 预览后，直链校验响应头，并用魔数判断内容是否为 PDF
 * 策略：不依赖浏览器内置预览与 popup；通过 `BrowserContext` 网络监听确认触发，再用 `page.request.get` 校验
 * 参数：invoiceId — 发票 ID
 * 返回：Promise<void>
 * 兼容性：Chromium/Firefox/WebKit；兼容无头模式
 */
async function assertInvoicePdfInline(invoiceId: string): Promise<void> {
  const url = buildInvoicePdfUrl(invoiceId, "inline");
  const resp = await getPdfResponse(page, url);
  expect(resp.ok(), "PDF 响应状态为 2xx").toBeTruthy();
  expect(resp.headers()["content-type"]).toMatch(/application\/pdf/i);
  const body = await resp.body();
  expect(isPdfMagic(body), "内容应以 %PDF- 魔数开头").toBeTruthy();
}
```

以上模板可作为新用例的基准，保证跨浏览器与 CI 一致性。
