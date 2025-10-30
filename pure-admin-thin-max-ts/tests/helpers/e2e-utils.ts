import type { Page, Locator, APIResponse } from "@playwright/test";

/**
 * debugLog
 * 功能：在 E2E_DEBUG 开关打开时输出调试日志，默认静默以降低 CI 噪音。
 * 使用：将原来的 console.log 替换为 debugLog，只有当环境变量 E2E_DEBUG 为 "1" 或 "true" 时输出。
 * 参数：与 console.log 相同的可变参数。
 * 返回：void
 */
export function debugLog(...args: unknown[]): void {
  const flag = process.env.E2E_DEBUG;
  if (!flag) return;
  if (flag === "1" || flag.toLowerCase() === "true") {
    console.log(...args);
  }
}

/**
 * ensureDevAuth
 * 功能：在页面脚本加载前注入“模拟已登录”的状态，以通过前端路由守卫的登录判断。
 * 细节：
 * - 设置 localStorage 的 user-info（包含最小角色集与权限集）
 * - 写入 multiple-tabs Cookie（路由守卫依赖该标记）
 * 目的：避免依赖真实后端登录接口，降低环境耦合；适用于开发自测页与冒烟测试。
 */
export async function ensureDevAuth(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      // 确保应用以中文语言启动（避免 CI 环境根据浏览器语言默认为 en-US
      // 导致使用中文断言的用例失败）。
      // 说明：i18n 插件会优先读取 localStorage 中的 "locale"，其次才是
      // navigator.languages / navigator.language；因此需要在应用脚本加载前
      // 注入该键，保证首屏即为 zh-CN。
      window.localStorage.setItem("locale", "zh-CN");

      window.localStorage.setItem(
        "user-info",
        JSON.stringify({
          refreshToken: "e2e-dev",
          expires: Date.now() + 60 * 60 * 1000,
          avatar: "",
          username: "e2e",
          nickname: "E2E",
          roles: ["admin"],
          permissions: ["*:*:*"]
        })
      );
      document.cookie = "multiple-tabs=true; path=/; max-age=3600";
    } catch {
      // 注入失败不抛错；后续页面断言会暴露问题
    }
  });
}

/**
 * closeExtraneousPanels
 * 功能：关闭页面上所有“非作用域”的已打开 LayPanel 面板，避免遮挡影响交互。
 * 参数：
 * - scopeRootSelector（可选）：作用域根容器选择器（如 demo 卡片），排除该作用域内的面板。
 * 策略：
 * - 优先关闭全局布局设置面板（data-channel="layout-setting"）
 * - 使用 data-testid="lay-panel-root" + data-open="true" 精确定位打开状态面板
 * - 使用属性轮询（expect.poll）等待 data-open 切换完成，提升稳定性
 */
export async function closeExtraneousPanels(
  page: Page,
  scopeRootSelector?: string
): Promise<void> {
  const layoutSettingPanel = page.locator(
    '[data-testid="lay-panel-root"][data-channel="layout-setting"]'
  );
  if ((await layoutSettingPanel.count()) > 0) {
    const openAttr = await layoutSettingPanel.getAttribute("data-open");
    if (openAttr === "true") {
      await layoutSettingPanel
        .getByTestId("panel-close-btn")
        .first()
        .click({ force: true });
      await expect
        .poll(async () => await layoutSettingPanel.getAttribute("data-open"), {
          timeout: 5000
        })
        .toBe("false");
    }
  }

  const openPanels = page.locator(
    '[data-testid="lay-panel-root"][data-open="true"]'
  );
  const count = await openPanels.count();
  if (count === 0) return;

  for (let i = 0; i < count; i++) {
    const candidate = openPanels.nth(i);
    const ch = (await candidate.getAttribute("data-channel")) || "default";
    // 保留当前演示卡片的面板（channel=icon-audit）
    if (ch === "icon-audit") continue;
    if (scopeRootSelector) {
      const inScope = await candidate.evaluate(
        (el, sel) => !!el.closest(sel),
        scopeRootSelector
      );
      if (inScope) continue;
    }
    // 函数级注释：fixed 定位的关闭按钮在某些视口下可能被判定为“在视口外”，先滚动到可视区域再点击
    const closeBtn = candidate.getByTestId("panel-close-btn").first();
    await closeBtn.scrollIntoViewIfNeeded();
    try {
      await closeBtn.click({ trial: true });
    } catch { }
    await closeBtn.click({ force: true });
    await expect
      .poll(async () => await candidate.getAttribute("data-open"), {
        timeout: 5000
      })
      .toBe("false");
  }
}

// 引入 expect 以便在此工具模块中使用轮询断言
import { expect } from "@playwright/test";

/**
 * findButtonByTexts
 * 功能：以多策略在页面上查找“按钮”元素，增强不同语言与 DOM 结构下的鲁棒性。
 * 策略：
 * 1) 精确匹配 ARIA Role=button 的名称
 * 2) 使用正则忽略大小写与空白差异进行模糊匹配
 * 3) 回退到 CSS 选择器 button:has-text("...")
 * 参数：
 * - page：Playwright Page 实例
 * - candidates：多语言候选文案数组
 * 返回：匹配到的 Locator；未找到则抛出错误
 */
export async function findButtonByTexts(
  page: Page,
  candidates: string[]
): Promise<Locator> {
  // 函数级注释：
  // 功能：根据候选文案查找按钮，支持多语言与模糊匹配；内部包含轮询等待，提升在页面尚未完全渲染时的稳定性。
  // 设计：
  // 1) 依次尝试精确 ARIA 名称、正则模糊匹配以及 CSS 文本包含三种方式。
  // 2) 在限定的超时时间内（默认 5s），每 200ms 轮询一次，避免页面渲染迟缓导致的“未找到按钮”误报。
  // 3) 一旦找到匹配项，立即返回第一个 Locator。

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const timeoutMs = 5000;
  const pollMs = 200;
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    for (const text of candidates) {
      // 1) 精确匹配 ARIA 名称
      const exact = page.getByRole("button", { name: text });
      if ((await exact.count()) > 0) return exact.first();

      // 2) 忽略空格差异与大小写
      const pattern = new RegExp(
        escapeRegex(text).replace(/\s+/g, "\\s*"),
        "i"
      );
      const fuzzy = page.getByRole("button", { name: pattern });
      if ((await fuzzy.count()) > 0) return fuzzy.first();

      // 3) 回退到文本包含的 button 元素
      const cssHasText = page.locator(`button:has-text("${text}")`);
      if ((await cssHasText.count()) > 0) return cssHasText.first();
    }

    await page.waitForTimeout(pollMs);
  }

  throw new Error("未找到目标按钮，请检查 i18n 文案或页面结构");
}

/**
 * buildInvoicePdfUrl
 * 功能：构造发票 PDF 接口的绝对 URL。
 * 说明：基于当前页面 URL 的源（origin），组合相对路径以避免 hash 路由的影响。
 * 参数：
 * - page：Playwright Page 实例
 * - invoiceId：发票 ID
 * - mode（可选）：inline 表示内联预览，其它为下载（attachment）
 * 返回：绝对 URL 字符串
 */
/**
 * buildInvoicePdfUrl
 * 功能：构造发票 PDF 接口的绝对 URL。
 * 设计考量：
 * - 直接使用 page.url() 作为 URL 基底在某些场景会是 "about:blank" 或尚未就绪的哈希路由，
 *   这会导致 new URL(path, base) 抛出异常或解析不正确。
 * - 因此优先解析当前页面的 origin；若不可用，则回退到 Playwright 配置中约定的端口：
 *   - CI 环境：vite dev 默认 8848（本项目已在 CI 下统一使用 dev server）
 *   - 本地开发：vite dev 默认 8848
 * 参数：
 * - page：Playwright Page 实例
 * - invoiceId：发票 ID
 * - mode（可选）：inline 表示内联预览，其它为下载（attachment）
 * 返回：绝对 URL 字符串
 */
export async function buildInvoicePdfUrl(
  page: Page,
  invoiceId: string,
  mode?: "inline"
): Promise<string> {
  const path =
    `/api/billing/invoices/${encodeURIComponent(invoiceId)}/pdf` +
    (mode === "inline" ? "?mode=inline" : "");

  // 函数级注释：解析当前页面的 origin；当页面尚未导航（about:blank）或获取失败时，回退到已知 baseURL
  let baseOrigin: string | undefined;
  try {
    // 优先通过浏览器环境拿到可靠的 origin
    baseOrigin = await page.evaluate(() => window.location.origin);
    if (!baseOrigin || !/^https?:\/\//.test(baseOrigin)) {
      // 退回到从 page.url() 解析
      const currentUrl = page.url();
      if (currentUrl && /^https?:\/\//.test(currentUrl)) {
        baseOrigin = new URL(currentUrl).origin;
      }
    }
  } catch {
    // 忽略解析错误，使用回退逻辑
  }

  // 优先使用环境变量 BASE_URL（若用户在运行时设置了该变量）
  const fallbackBase =
    process.env.BASE_URL || "http://localhost:8848";

  const base = baseOrigin || fallbackBase;
  return new URL(path, base).href;
}

/**
 * getPdfResponse
 * 功能：使用 APIRequestContext 发起 GET 请求获取 PDF 接口响应。
 * 参数：
 * - page：Playwright Page 实例
 * - invoiceId：发票 ID
 * - inline：是否为内联模式（true 则携带 mode=inline）
 * 返回：Playwright APIResponse 对象
 */
export async function getPdfResponse(
  page: Page,
  invoiceId: string,
  inline: boolean
): Promise<APIResponse> {
  const url = await buildInvoicePdfUrl(
    page,
    invoiceId,
    inline ? "inline" : undefined
  );
  // 调试：在复杂场景下输出 URL，便于定位环境端口与编码问题
  debugLog(
    `[debug] getPdfResponse: ${inline ? "inline" : "attachment"} ->`,
    url
  );
  try {
    return await page.request.get(url);
  } catch (err) {
    console.error("[debug] getPdfResponse network error:", err);
    throw err;
  }
}

/**
 * isPdfMagic
 * 功能：判断二进制缓冲区是否以 PDF 魔数开头（%PDF-）。
 * 兼容性：在不同浏览器驱动下，APIResponse.body() 可能返回 Buffer、Uint8Array 或 ArrayBuffer。
 * 因此需要统一转换为字节视图再进行魔数比较，避免因类型差异导致的误判。
 * 参数：
 * - buf：PDF 二进制，可能为 Buffer、Uint8Array 或 ArrayBuffer。
 * 返回：true/false
 */
export function isPdfMagic(buf: Buffer | Uint8Array | ArrayBuffer): boolean {
  // 函数级注释：统一获取前 5 个字节作为 ASCII 字符串进行比较
  let view: Uint8Array;
  if (buf instanceof Uint8Array) {
    view = buf;
  } else if (buf instanceof ArrayBuffer) {
    view = new Uint8Array(buf);
  } else {
    // Node.js Buffer 继承自 Uint8Array，这里兜底转为 Uint8Array 视图
    view = buf as unknown as Uint8Array;
  }
  const headerBytes = view.subarray(0, 5);
  const headerStr = String.fromCharCode(
    headerBytes[0],
    headerBytes[1],
    headerBytes[2],
    headerBytes[3],
    headerBytes[4]
  );
  return headerStr === "%PDF-";
}
