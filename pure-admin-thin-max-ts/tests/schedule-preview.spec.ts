import { test, expect } from "@playwright/test";
import { ensureDevAuth } from "./helpers/e2e-utils";


/**
 * 打开 Schedule 预览页
 * - 使用 hash 路由直达（开发环境 VITE_ROUTER_HISTORY = "hash"）
 * - 等待核心控件（日期选择与快捷按钮）可见
 */
async function gotoSchedulePreview(page) {
  await ensureDevAuth(page);
  await page.goto("/#/dev/schedule-preview");
  await expect(page.getByPlaceholder("请选择日期")).toBeVisible();
  await expect(page.getByRole("button", { name: "今天" })).toBeVisible();
  await expect(page.getByRole("button", { name: "上个月" })).toBeVisible();
  await expect(page.getByRole("button", { name: "下个月" })).toBeVisible();
}

/**
 * 冒烟用例：能成功到达 /dev/schedule-preview 并渲染核心控件
 * - 额外校验日历主体中至少存在一个 Iconify 渲染的图标（如 ri:add-large-line）
 */
test("Schedule preview smoke: basic controls and at least one icon rendered", async ({ page }) => {
  // 函数级注释：为该用例设置更宽松的执行超时，减少首次编译或云端冷启动导致的偶发超时
  test.setTimeout(45000);
  await gotoSchedulePreview(page);
  // 日历中应至少渲染出一个 iconify 图标（如新增按钮）
  await expect(page.locator(".el-calendar .iconify").first()).toBeVisible();
});
