import { test, expect } from "@playwright/test";

/**
 * 在页面脚本加载前注入“模拟已登录”的状态
 * - 设置 localStorage 的 user-info（包含最小角色集）
 * - 写入 multiple-tabs Cookie 以满足路由守卫的登录判断
 * 说明：不依赖实际登录接口，避免环境耦合；仅用于开发自测页的冒烟验证
 */
async function ensureDevAuth(page) {
  await page.addInitScript(() => {
    try {
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
    } catch (_) {}
  });
}

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
  await gotoSchedulePreview(page);
  // 日历中应至少渲染出一个 iconify 图标（如新增按钮）
  await expect(page.locator(".el-calendar .iconify").first()).toBeVisible();
});

