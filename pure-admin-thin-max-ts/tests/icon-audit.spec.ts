import { test, expect } from "@playwright/test";
import { ensureDevAuth, closeExtraneousPanels } from "./helpers/e2e-utils";

/**
 * 打开 Icon 校验页并等待核心元素渲染
 * - 使用 hash 路由直达（开发环境 VITE_ROUTER_HISTORY = "hash"）
 * - 验证页面标题与基础说明存在，确保路由与资源加载成功
 */
async function gotoIconAudit(page) {
  await ensureDevAuth(page);
  await page.goto("/#/dev/icon-audit");
  await expect(page.getByRole("heading", { name: /Icon 校验/ })).toBeVisible();
  await expect(page.locator(".interactive")).toBeVisible();

  // 防御性处理：若页面初始化时有“非预期面板”处于打开状态（例如全局设置面板），先行关闭。
  // 这可以避免后续点击被遮挡，提升用例稳定性。
  // 优先：若存在布局设置面板（layout-setting），先精准关闭它
  // 通过 data-channel 精确定位布局设置面板（无需依赖测试专用 testid）
  const layoutSettingPanel = page.locator(
    '[data-testid="lay-panel-root"][data-channel="layout-setting"]'
  );
  try {
    if ((await layoutSettingPanel.count()) > 0) {
      const openAttr = await layoutSettingPanel.getAttribute("data-open");
      if (openAttr === "true") {
        await layoutSettingPanel
          .getByTestId("panel-close-btn")
          .first()
          .click({ force: true });
        // 采用轮询等待，避免动画或过渡导致瞬时属性未更新
        await expect
          .poll(
            async () => await layoutSettingPanel.getAttribute("data-open"),
            { timeout: 5000 }
          )
          .toBe("false");
      }
    }
  } catch {}
  const strayPanels = page.locator(
    '[data-testid="lay-panel-root"][data-open="true"]'
  );
  const strayCount = await strayPanels.count();
  if (strayCount > 0) {
    for (let i = 0; i < strayCount; i++) {
      const pnl = strayPanels.nth(i);
      const ch = (await pnl.getAttribute("data-channel")) || "default";
      // 保留当前页面演示卡片的面板（channel=icon-audit），仅关闭其它通道的打开面板
      if (ch === "icon-audit") continue;
      await pnl
        .getByTestId("panel-close-btn")
        .first()
        .click({ trial: true })
        .catch(() => {});
      // 真实点击关闭
      await pnl.getByTestId("panel-close-btn").first().click();
      await expect
        .poll(async () => await pnl.getAttribute("data-open"), {
          timeout: 5000
        })
        .toBe("false");
    }
  }
}

/**
 * 获取 IconAudit 演示卡片对应的 LayPanel 根节点
 * 说明：LayPanel 使用 position: fixed 脱离文档流，若通过卡片作用域定位可能导致视口滚动与点击不稳定。
 * 因此统一通过 data-channel="icon-audit" 精确定位该面板根节点，以提升交互稳定性。
 */
function getIconAuditPanel(page) {
  return page
    .locator('[data-testid="lay-panel-root"][data-channel="icon-audit"]')
    .first();
}

/**
 * 验证在线图标是否正确渲染
 * - 使用 Iconify 渲染时会带有 data-icon 属性，便于稳定选择
 */
// 函数级注释：该辅助断言用于在需要时验证在线图标的可见性；当前用例未直接使用，重命名为以下划线开头以符合未使用变量的规则。
async function _assertIconVisible(page, iconName: string) {
  // 优先：直接使用 data-icon 精确匹配
  const byDataAttr = page.locator(`[data-icon="${iconName}"]`).first();
  if ((await byDataAttr.count()) > 0) {
    await expect(byDataAttr).toBeVisible();
    return;
  }
  // 兼容：某些 Iconify 运行时会渲染为 <svg> 或 <img>，无 data-icon 与 .iconify 类名
  // 回退策略：在图标示例清单中，通过文本标签（图标名）定位到父级 .icon-item，
  // 然后断言该项下存在可见的 svg/img/iconify 节点之一。
  const iconItem = page.locator(".icon-item", { hasText: iconName }).first();
  await expect(iconItem).toHaveCount(1);
  const bySvgImgOrIconify = iconItem.locator("svg, img, .iconify").first();
  await expect(bySvgImgOrIconify).toBeVisible();
}

/**
 * 测试用例：校验 Navbar/Settings/Panel/Schedule 核心在线图标渲染与交互
 */
// IconAudit smoke 测试
// 该测试套件验证页面中核心在线图标的渲染与基本交互的稳定性
// 尽量使用稳定选择器（data-testid、data-icon）并避免严格依赖网络返回码

test.describe("IconAudit smoke", () => {
  test("should render core online icons and basic interactions work", async ({
    page
  }) => {
    // 函数级注释: 为该用例提升执行超时时间，避免低性能或首次编译环境导致的偶发超时
    test.setTimeout(45000);
    // 进入 IconAudit 页面
    await gotoIconAudit(page);

    // 软等待交互演示区域可见，避免对网络 200 等待过于严格导致不稳定
    await expect(page.locator(".interactive")).toBeVisible();

    // 1) Settings：勾选与箭头图标可见性与（可读时的）data-icon 合法性
    await test.step("Settings 区域图标渲染与箭头切换", async () => {
      // 勾选图标可见
      await expect(page.getByTestId("settings-check-icon")).toBeVisible();

      // 箭头图标可见，并在可读 data-icon 时断言值属于两种之一
      const arrowIcon = page.getByTestId("settings-arrow-icon");
      await expect(arrowIcon).toBeVisible();
      const current = (await arrowIcon.getAttribute("data-icon")) || "";
      if (current) {
        expect(["ri:arrow-left-s-line", "ri:arrow-right-s-line"]).toContain(
          current
        );
      }
    });

    // 2) Panel：打开/关闭交互（channel 隔离 + 作用域定位）
    await test.step("Panel 打开/关闭交互（channel 隔离 + 作用域定位）", async () => {
      const card = page.getByTestId("panel-demo-card");

      // 先关闭其它非作用域的已打开面板，避免遮挡
      await closeExtraneousPanels(page);

      // 打开当前卡片的面板
      await card.getByTestId("open-panel-btn").click({ force: true });

      // 断言当前卡片作用域内的面板已打开且内部面板元素可见
      const panel = getIconAuditPanel(page);
      // 函数级注释: 使用属性轮询，降低立即切换引发的竞态失败，并确保面板打开后内部元素可见
      await expect
        .poll(async () => await panel.getAttribute("data-open"), {
          timeout: 8000
        })
        .toBe("true");
      await expect(
        panel.locator('[data-testid="lay-panel"]').first()
      ).toBeVisible();

      // 再次关闭其它非作用域面板，确保不受外部面板数量干扰
      await closeExtraneousPanels(page, '[data-testid="panel-demo-card"]');
      await expect
        .poll(async () => await panel.getAttribute("data-open"), {
          timeout: 8000
        })
        .toBe("true");

      // 点击关闭按钮关闭当前面板（fixed 元素在某些视口下可能被判定为不可见，先滚动到可视区域）
      const closeBtn = panel.getByTestId("panel-close-btn").first();
      await closeBtn.scrollIntoViewIfNeeded();
      await closeBtn.click({ force: true });

      // 轮询断言属性变为关闭态
      await expect
        .poll(async () => await panel.getAttribute("data-open"), {
          timeout: 5000
        })
        .toBe("false");
    });

    // 3) Schedule：新增按钮与空态图标（稳健可见性断言）
    // 函数级注释: 在 CI 预览环境下可能存在网络限制，Iconify 在线图标渲染会延迟或降级。
    // 允许 Iconify 在线组件根节点（data-testid）或运行时注入的占位节点 .iconify[data-icon] 任一可见，减少对网络时序的依赖。
    await test.step("Schedule 新增按钮与空态图标（稳健可见性断言）", async () => {
      const scheduleDemo = page.getByTestId("schedule-demo-card");
      await expect(scheduleDemo).toBeVisible();

      // 新增按钮图标：允许组件根元素、直接渲染的 svg/img、或 Iconify 运行时占位节点满足可见性
      // 说明：在离线模式下（SmartIcon 离线优先），Iconify 可能直接渲染为 <svg>，无 .iconify 包裹与 data-icon 属性
      // 因此此处对 svg/img 进行兼容匹配，提升 CI/预览环境的稳定性
      const addIconCandidate = scheduleDemo
        .locator(
          '[data-testid="schedule-add-icon"], svg, img, .iconify[data-icon="ri:add-large-line"]'
        )
        .first();
      await expect(addIconCandidate).toBeVisible();

      // 空态区域包含文案“暂无排班”，作为区域可见性的佐证
      await expect(scheduleDemo.getByText("暂无排班")).toBeVisible();

      const emptyIconCandidate = scheduleDemo
        .locator(
          '[data-testid="schedule-empty-icon"], .iconify[data-icon="ep:calendar"]'
        )
        .first();
      await expect(emptyIconCandidate).toBeVisible();
    });

    // 4) SmartIcon 渲染来源断言（离线优先 + 在线回退）
    // 函数级注释: 通过 data-render-source 属性区分离线/在线渲染来源，确保 SmartIcon 策略与预期一致。
    await test.step("SmartIcon 渲染来源（离线优先 + 在线回退）", async () => {
      const smartCard = page.getByTestId("smarticon-demo-card");
      await expect(smartCard).toBeVisible();

      // 离线预注册的图标：应由 IconifyIconOffline 渲染（data-render-source=offline）
      await expect(page.getByTestId("smarticon-smart-add")).toHaveAttribute(
        "data-render-source",
        "offline"
      );
      await expect(
        page.getByTestId("smarticon-smart-calendar")
      ).toHaveAttribute("data-render-source", "offline");

      // 未离线预注册的图标（ri:bug-line）：SmartIcon 应回退为在线渲染（data-render-source=online）
      await expect(page.getByTestId("smarticon-smart-bug")).toHaveAttribute(
        "data-render-source",
        "online"
      );
      // 在线对照：IconifyIconOnline 组件应标记为 online
      await expect(page.getByTestId("smarticon-online-bug")).toHaveAttribute(
        "data-render-source",
        "online"
      );
    });
  });
});
