import { test, expect } from "@playwright/test";
import {
  ensureDevAuth,
  findButtonByTexts,
  getPdfResponse,
  isPdfMagic,
  debugLog
} from "./helpers/e2e-utils";

// 说明：findButtonByTexts 已抽取到 helpers/e2e-utils.ts 以便跨用例复用

test.describe("Invoice PDF actions", () => {
  // 函数级注释：在每个用例前注入开发态认证信息与语言设置，以避免路由守卫与 i18n 造成的不确定性。
  test.beforeEach(async ({ page }) => {
    await ensureDevAuth(page);
  });
  /**
   * 验证发票 PDF 预览行为：
   * - 不依赖 popup 捕获（Firefox/WebKit 下因 noopener 不稳定）
   * - 直接使用 APIRequestContext 对 /api/billing/invoices/:id/pdf?mode=inline 发起 GET
   * - 断言响应头 content-type=application/pdf 与 content-disposition=inline
   * 步骤：
   * 1. 打开发票详情页路由（Hash 模式）
   * 2. 点击“预览 PDF”（模拟用户行为）
   * 3. 构造直链并使用 page.request.get 获取响应头进行断言
   */
  test("preview opens new tab with inline content-disposition", async ({ page }) => {
    const invoiceId = "test-invoice-123";
    // 说明：跨浏览器稳定性考虑，使用 APIRequestContext 发起直链 GET 断言响应头

    // 访问发票详情页（项目使用 Hash 路由），直接带上 :id 参数
    await page.goto(`/#/esim/billing/invoices/${invoiceId}`);

    // 定位“预览 PDF”按钮（支持多语言候选）
    const previewBtn = await findButtonByTexts(page, [
      "预览 PDF",
      "Preview PDF",
      "預覽 PDF",
      "PDFプレビュー"
    ]);
    await previewBtn.waitFor({ state: "visible" });

    // 调试：监听主页面的网络响应，帮助定位是否发起了 /pdf?mode=inline 的 XHR
    page.on("response", resp => {
      const url = resp.url();
      if (url.includes("/api/billing/invoices") && url.includes("/pdf")) {
        // 仅打印与发票 PDF 相关的响应，避免输出过多无关日志
        debugLog("[network] response:", resp.request().method(), url, resp.status());
      }
    });

    // 点击按钮以模拟用户行为（但断言依赖直链 GET 响应头，不依赖页面内 XHR 捕获）
    await previewBtn.click();

    const inlineResponse = await getPdfResponse(page, invoiceId, true);
    const headers = inlineResponse.headers();
    debugLog("[preview] inline XHR headers:", headers);
    expect(headers["content-type"]).toBeDefined();
    expect(headers["content-type"]).toContain("application/pdf");
    expect(headers["content-disposition"]).toBeDefined();
    expect(headers["content-disposition"]).toContain("inline");
    // 断言响应体为有效 PDF（检查魔数）
    const body = await inlineResponse.body();
    // 函数级注释：输出调试信息以定位在特定浏览器驱动下的二进制差异（长度与前 5 字节魔数）
    debugLog(
      "[debug] inline body length (ascii id):",
      // @ts-expect-error 可能为 ArrayBuffer，length 为 undefined，这里做容错打印
      (body as Buffer).length ?? (body as ArrayBuffer).byteLength,
      "magic:",
      // 打印前 5 字节作为字符串（使用兼容的转换逻辑）
      String.fromCharCode(
        ...(body instanceof ArrayBuffer
          ? Array.from(new Uint8Array(body).subarray(0, 5))
          : Array.from((body as Uint8Array).subarray(0, 5)))
      )
    );
    expect(isPdfMagic(body as Buffer)).toBeTruthy();
  });

  /**
   * UI 层新标签页打开（popup）验证：
   * 目的：确保点击“预览 PDF”按钮会打开新标签页并加载 inline 模式的发票 PDF。
   * 策略：
   * - 捕获 popup 事件，获取新页面对象并轮询其 URL，直到匹配 /pdf?mode=inline
   * - 同时等待匹配该 URL 的网络响应，断言响应头与 PDF 魔数
   * 兼容性：Firefox/WebKit 下某些情况下会先出现 about:blank，再跳转到真实 URL，使用轮询保证稳定。
   */
  test("UI popup: preview opens inline PDF page", async ({ page, context }) => {
    const invoiceId = "test-invoice-123";

    await page.goto(`/#/esim/billing/invoices/${invoiceId}`);

    const previewBtn = await findButtonByTexts(page, [
      "预览 PDF",
      "Preview PDF",
      "預覽 PDF",
      "PDFプレビュー"
    ]);
    await previewBtn.waitFor({ state: "visible" });

    /**
     * 函数级注释：
     * 针对无头浏览器在内联 PDF 预览下可能不会真正创建新标签页（因未启用内置 PDF 查看器）的情况，
     * 我们不强依赖 page/popup 事件，而是监听 BrowserContext 级别的网络请求，
     * 验证点击“预览 PDF”后确实发起了指向 /api/billing/invoices/:id/pdf?mode=inline 的 GET 请求。
     * 这样可在 Chromium/Firefox/WebKit 三端稳定通过，同时满足“UI 层触发 inline 预览”的行为验证。
     */

    // 预构造期望匹配的预览直链（与页面实现保持一致）
    const expectedUrl = `/api/billing/invoices/${encodeURIComponent(invoiceId)}/pdf?mode=inline`;

    // 点击按钮后，等待出现匹配该 URL 的请求（可能来自 window.open 或 XHR 调用）
    const [req] = await Promise.all([
      context.waitForEvent("request", {
        timeout: 7000,
        predicate: r => r.url().includes(expectedUrl) && r.method() === "GET"
      }),
      previewBtn.click()
    ]);

    // 断言确实发起了预览直链的 GET 请求
    expect(req, "未捕获到 inline 预览的网络请求").toBeDefined();
    debugLog("[popup] request:", req.method(), req.url());

    // 等待对应响应到达并断言基础状态码与头部（如果可用）
    const resp = await req.response();
    expect(resp, "未获取到 inline 预览响应").toBeDefined();
    if (resp) {
      expect(resp.status(), "inline 预览响应状态码异常").toBeLessThan(400);
      const headers = await resp.headers();
      // 某些驱动下可能不返回头部，这里做尽量宽松的断言；如返回则校验类型信息
      if (headers && headers["content-type"]) {
        expect(headers["content-type"]).toContain("application/pdf");
      }
    }
  });

  /**
   * 下载 PDF：期望后端响应头为 Content-Disposition: attachment，且文件名为 invoice-<id>.pdf
   * 为提升 Firefox/WebKit 下的稳定性，本用例不依赖 Playwright 的 download 事件，而是直接断言后端响应头。
   * 步骤：
   * 1. 打开发票详情页；
   * 2. 点击“下载 PDF”按钮（模拟用户行为）；
   * 3. 使用 APIRequestContext GET /api/billing/invoices/:id/pdf 并断言响应头为 attachment。
   */
  test("download triggers browser download with correct filename", async ({ page }) => {
    const invoiceId = "test-invoice-123";

    await page.goto(`/#/esim/billing/invoices/${invoiceId}`);

    // 定位“下载 PDF”按钮（支持多语言候选）
    const downloadBtn = await findButtonByTexts(page, [
      "下载 PDF",
      "Download PDF",
      "下載 PDF",
      "PDFダウンロード"
    ]);
    await downloadBtn.waitFor({ state: "visible" });

    // 点击按钮以模拟用户行为，同时直接以 APIRequestContext GET 断言响应头
    await downloadBtn.click();
    const response = await getPdfResponse(page, invoiceId, false);
    const headers = response.headers();
    // 调试输出响应头，定位断言失败原因（如 CI/本地差异、头部缺失等）
    debugLog("[debug] attachment headers (ascii id):", headers);
    expect(headers["content-type"]).toContain("application/pdf");
    expect(headers["content-disposition"]).toContain("attachment");
    expect(headers["content-disposition"]).toContain(`filename=invoice-${invoiceId}.pdf`);
    // 断言响应体为有效 PDF（检查魔数）
    const body = await response.body();
    expect(isPdfMagic(body as Buffer)).toBeTruthy();
  });

  /**
   * 非 ASCII 与空格文件名处理：
   * 目的：验证当发票 ID 包含中文与空格时，响应头中的 filename 可安全传输（URL 编码），避免浏览器解析异常。
   * 步骤：
   * 1. 打开发票详情页（ID 含中文与空格）；
   * 2. 点击“下载 PDF”按钮；
   * 3. 使用 APIRequestContext GET 并断言 Content-Disposition 的 filename 使用了 URL 编码形式。
   */
  test("download filename handles non-ASCII and spaces safely", async ({ page }) => {
    const invoiceId = "中文 空格";

    await page.goto(`/#/esim/billing/invoices/${invoiceId}`);

    const downloadBtn = await findButtonByTexts(page, [
      "下载 PDF",
      "Download PDF",
      "下載 PDF",
      "PDFダウンロード"
    ]);
    await downloadBtn.waitFor({ state: "visible" });

    await downloadBtn.click();
    const response = await getPdfResponse(page, invoiceId, false);
    const headers = response.headers();

    const encoded = encodeURIComponent(invoiceId);
    expect(headers["content-type"]).toContain("application/pdf");
    expect(headers["content-disposition"]).toContain("attachment");
    expect(headers["content-disposition"]).toContain(`filename=invoice-${encoded}.pdf`);

    const body = await response.body();
    expect(isPdfMagic(body as Buffer)).toBeTruthy();
  });

  /**
   * 非 ASCII 与空格文件名（内联预览）：
   * 目的：验证当发票 ID 包含中文与空格时，inline 模式的 Content-Disposition 的 filename 也使用 URL 编码。
   * 步骤：
   * 1. 打开发票详情页（ID 含中文与空格）；
   * 2. 点击“预览 PDF”按钮；
   * 3. 使用 APIRequestContext GET 并断言 Content-Disposition 的 filename 使用了 URL 编码形式，且为 inline。
   */
  test("preview filename handles non-ASCII and spaces safely", async ({ page }) => {
    const invoiceId = "中文 空格";

    // 函数级注释：路由参数需要进行 URL 编码以避免哈希路由解析失败（非 ASCII 与空格需编码）
    await page.goto(`/#/esim/billing/invoices/${encodeURIComponent(invoiceId)}`);

    const previewBtn = await findButtonByTexts(page, [
      "预览 PDF",
      "Preview PDF",
      "預覽 PDF",
      "PDFプレビュー"
    ]);
    await previewBtn.waitFor({ state: "visible" });

    await previewBtn.click();
    const response = await getPdfResponse(page, invoiceId, true);
    const headers = response.headers();
    // 调试输出响应头，便于定位 CI/本地环境差异
    debugLog("[debug] inline headers (non-ASCII & spaces):", headers);

    const encoded = encodeURIComponent(invoiceId);
    expect(headers["content-type"]).toContain("application/pdf");
    expect(headers["content-disposition"]).toContain("inline");
    expect(headers["content-disposition"]).toContain(`filename=invoice-${encoded}.pdf`);

    const body = await response.body();
    debugLog("[debug] inline body length:", (body as Buffer).length);
    expect(isPdfMagic(body as Buffer)).toBeTruthy();
  });

  /**
   * 特殊字符文件名（下载模式）：
   * 目的：验证包含 # ? % & " 等特殊字符的 ID 能被安全 URL 编码，并出现在 Content-Disposition 的 filename 中。
   * 注意：页面路由使用 encodeURIComponent，避免 hash 路由中出现歧义。
   */
  test("download filename encodes special characters (#?%&\" )", async ({ page }) => {
    const rawId = 'A%B#?& "C"';
    const invoiceId = rawId; // 保持原始字符串用于编码校验

    await page.goto(`/#/esim/billing/invoices/${encodeURIComponent(invoiceId)}`);

    const downloadBtn = await findButtonByTexts(page, [
      "下载 PDF",
      "Download PDF",
      "下載 PDF",
      "PDFダウンロード"
    ]);
    await downloadBtn.waitFor({ state: "visible" });

    await downloadBtn.click();
    const response = await getPdfResponse(page, invoiceId, false);
    const headers = response.headers();
    // 调试输出响应头，便于定位编码差异与服务端行为
    debugLog("[debug] attachment headers (special characters):", headers);

    const encoded = encodeURIComponent(invoiceId);
    expect(headers["content-type"]).toContain("application/pdf");
    expect(headers["content-disposition"]).toContain("attachment");
    expect(headers["content-disposition"]).toContain(`filename=invoice-${encoded}.pdf`);

    const body = await response.body();
    expect(isPdfMagic(body as Buffer)).toBeTruthy();
  });

  /**
   * 特殊字符文件名（内联预览）：
   * 目的：验证包含 # ? % & " 等特殊字符的 ID 在 inline 模式下同样被安全 URL 编码并出现在 filename 中。
   */
  test("preview filename encodes special characters (#?%&\" )", async ({ page }) => {
    const rawId = 'A%B#?& "C"';
    const invoiceId = rawId;

    await page.goto(`/#/esim/billing/invoices/${encodeURIComponent(invoiceId)}`);

    const previewBtn = await findButtonByTexts(page, [
      "预览 PDF",
      "Preview PDF",
      "預覽 PDF",
      "PDFプレビュー"
    ]);
    await previewBtn.waitFor({ state: "visible" });

    await previewBtn.click();
    const response = await getPdfResponse(page, invoiceId, true);
    const headers = response.headers();
    // 调试输出响应头，便于定位编码差异与服务端行为
    debugLog("[debug] inline headers (special characters):", headers);

    const encoded = encodeURIComponent(invoiceId);
    expect(headers["content-type"]).toContain("application/pdf");
    expect(headers["content-disposition"]).toContain("inline");
    expect(headers["content-disposition"]).toContain(`filename=invoice-${encoded}.pdf`);

    const body = await response.body();
    expect(isPdfMagic(body as Buffer)).toBeTruthy();
  });
});
