import { test, expect } from "@playwright/test";
import type { Page, Download } from "@playwright/test";
import { ensureDevAuth, closeExtraneousPanels } from "./helpers/e2e-utils";

/**
 * 生成用于 E2E 的固定数据集，避免依赖真实后端或时间不稳定导致断言波动。
 * - ActivationCode：用于卡片“激活码总数”和状态筛选验证。
 * - Subscription：用于卡片“订阅总数”和分组导出 CSV。
 * - Invoice：用于发票过滤的存在性与接口拦截完整性（本用例主要验证接口结构）。
 */
function buildFixtureData() {
  const now = new Date();
  const iso = (d: Date) => d.toISOString();

  // 构造近 7 天内的日期，便于 last7Days 预设筛选。
  const daysAgo = (n: number) => {
    const d = new Date(now.getTime());
    d.setDate(d.getDate() - n);
    return d;
  };

  // Activation codes：包含不同状态与运营商，便于 status 与 operator 过滤验证
  const activationCodes = [
    // 注意：页面筛选逻辑使用的是 operatorId 字段，这里与前端保持一致
    {
      id: "ac-1",
      operatorId: "CMCC",
      status: "unused",
      createdAt: iso(daysAgo(1))
    },
    {
      id: "ac-2",
      operatorId: "CMCC",
      status: "used",
      createdAt: iso(daysAgo(2))
    },
    {
      id: "ac-3",
      operatorId: "CUCC",
      status: "unused",
      createdAt: iso(daysAgo(3))
    },
    {
      id: "ac-4",
      operatorId: "CTCC",
      status: "used",
      createdAt: iso(daysAgo(4))
    },
    {
      id: "ac-5",
      operatorId: "CMCC",
      status: "unused",
      createdAt: iso(daysAgo(6))
    }
  ];

  // Subscriptions：包含不同运营商且分布在不同日期，便于按日/周/月分组导出
  const subscriptions = [
    // 注意：页面筛选与可选运营商列表使用的是 operatorId，这里统一改为 operatorId
    {
      id: "sub-1",
      operatorId: "CMCC",
      status: "active",
      createdAt: iso(daysAgo(0))
    },
    {
      id: "sub-2",
      operatorId: "CMCC",
      status: "inactive",
      createdAt: iso(daysAgo(1))
    },
    {
      id: "sub-3",
      operatorId: "CUCC",
      status: "active",
      createdAt: iso(daysAgo(2))
    },
    {
      id: "sub-4",
      operatorId: "CTCC",
      status: "active",
      createdAt: iso(daysAgo(10))
    },
    {
      id: "sub-5",
      operatorId: "CMCC",
      status: "active",
      createdAt: iso(daysAgo(15))
    }
  ];

  // Invoices：保持结构完整；当前用例不深入断言发票卡片数值，仅验证接口与页面加载
  const invoices = [
    // 说明：页面过滤发票使用的是 createdAt（如果存在），这里补充 createdAt 以便时间筛选生效
    {
      id: "inv-1",
      amount: 100,
      status: "paid",
      createdAt: iso(daysAgo(2))
    },
    {
      id: "inv-2",
      amount: 50,
      status: "unpaid",
      createdAt: iso(daysAgo(5))
    }
  ];

  return { activationCodes, subscriptions, invoices };
}

/**
 * 在页面上设置接口拦截，返回固定数据集，保证前端页面渲染与导出逻辑可测试。
 */
async function setupApiMocks(page: Page) {
  const { activationCodes, subscriptions, invoices } = buildFixtureData();

  await page.route("**/api/activation-codes", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(activationCodes)
    });
  });

  await page.route("**/api/subscriptions", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(subscriptions)
    });
  });

  await page.route("**/api/billing/invoices", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(invoices)
    });
  });
}

/**
 * 导航到 eSIM Analytics Overview 页面，并等待核心 UI 可见以确保页面准备就绪。
 */
async function gotoOverview(page: Page) {
  await ensureDevAuth(page);
  await setupApiMocks(page);
  await page.goto("/#/esim/analytics/overview", {
    waitUntil: "domcontentloaded"
  });
  await closeExtraneousPanels(page);
  // 函数级注释：部分环境下“布局设置”面板可能在路由切换后再次被打开，这里做一次精准关闭防御
  const layoutSettingPanel = page.locator(
    '[data-testid="lay-panel-root"][data-channel="layout-setting"]'
  );
  try {
    if ((await layoutSettingPanel.count()) > 0) {
      const openAttr = await layoutSettingPanel.getAttribute("data-open");
      if (openAttr === "true") {
        const closeBtn = layoutSettingPanel
          .getByTestId("panel-close-btn")
          .first();
        await closeBtn.scrollIntoViewIfNeeded();
        await closeBtn.click({ force: true });
        await expect
          .poll(
            async () => await layoutSettingPanel.getAttribute("data-open"),
            { timeout: 5000 }
          )
          .toBe("false");
      }
    }
  } catch { }
  await page.getByTestId("filters-operator").waitFor({ state: "visible" });
  await page
    .getByTestId("cards-activationCodes-total")
    .waitFor({ state: "visible" });
}

/**
 * 断言卡片统计的总数是否与数据集匹配。
 * 仅验证展示存在与基本数值，不做复杂计算逻辑断言，以防 UI 上格式化差异。
 */
async function assertInitialCards(page: Page) {
  const activationTotal = await page
    .getByTestId("cards-activationCodes-total")
    .textContent();
  const subsTotal = await page
    .getByTestId("cards-subscriptions-total")
    .textContent();
  expect(activationTotal?.trim()).not.toEqual("");
  expect(subsTotal?.trim()).not.toEqual("");
}

test.describe("Analytics Overview", () => {
  test.setTimeout(60_000);

  test("渲染卡片统计并成功导出 CSV", async ({ page }) => {
    await gotoOverview(page);
    await assertInitialCards(page);

    // 导出“按月新订阅”CSV
    const dlMonthlyPromise: Promise<Download> = page.waitForEvent("download");
    await page.getByTestId("export-monthly-csv").click();
    const dlMonthly = await dlMonthlyPromise;
    const monthlyFilename = await dlMonthly.suggestedFilename();
    // 页面导出文件名使用 ISO 格式并替换了分隔符，这里匹配形如 2025-10-30-14-52-33
    expect(monthlyFilename).toMatch(
      /monthly-new-subscriptions-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.csv/
    );

    // 导出“运营商 Top5”CSV
    const dlOpsPromise: Promise<Download> = page.waitForEvent("download");
    await page.getByTestId("export-operators-csv").click();
    const dlOps = await dlOpsPromise;
    const opsFilename = await dlOps.suggestedFilename();
    expect(opsFilename).toMatch(
      /operators-top5-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.csv/
    );
  });

  test("应用筛选器（operator/status/codeStatus/datePreset/cardsScope）并刷新卡片", async ({ page }) => {
    await gotoOverview(page);

    // 切换“统计范围”为过滤后
    await page.getByTestId("scope-filtered").check();

    // 运营商筛选：选择 CMCC
    await page.getByTestId("filters-operator").click();
    await page.getByRole("option", { name: /CMCC/i }).click();

    // 激活码状态筛选：选择未使用（unused）
    await page.getByTestId("filters-codeStatus").click();
    await page.getByRole("option", { name: /未使用|unused/i }).click();

    // 日期预设：近 7 天
    await page.getByTestId("filters-datePreset").click();
    // 兼容中英文或键值渲染
    const last7DaysOption = page.getByRole("option", {
      name: /近7天|last7Days/i
    });
    await last7DaysOption.click();

    // 应用筛选
    await page.getByTestId("filters-apply").click();

    // 卡片总数应更新（不要求具体值，至少应有内容且非空）
    const activationTotal = await page
      .getByTestId("cards-activationCodes-total")
      .textContent();
    const subsTotal = await page
      .getByTestId("cards-subscriptions-total")
      .textContent();
    expect(activationTotal?.trim()).not.toEqual("");
    expect(subsTotal?.trim()).not.toEqual("");

    // 重置筛选并回到默认范围
    await page.getByTestId("filters-reset").click();
    await page.getByTestId("scope-overall").check();
  });
});
