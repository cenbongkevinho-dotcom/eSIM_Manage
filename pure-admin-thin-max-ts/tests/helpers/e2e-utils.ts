import type { Page } from "@playwright/test";

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
    } catch (_) {
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
    await candidate
      .getByTestId("panel-close-btn")
      .first()
      .click({ trial: true })
      .catch(() => {});
    await candidate
      .getByTestId("panel-close-btn")
      .first()
      .click({ force: true });
    await expect
      .poll(async () => await candidate.getAttribute("data-open"), {
        timeout: 5000
      })
      .toBe("false");
  }
}

// 引入 expect 以便在此工具模块中使用轮询断言
import { expect } from "@playwright/test";
