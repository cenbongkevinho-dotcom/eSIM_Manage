#!/usr/bin/env node
/**
 * 审计脚本：禁止在 src/views 中直接使用 IconifyIconOnline（dev 目录除外）
 * 目标：
 * - 保障业务视图统一通过 SmartIcon/useRenderIcon 渲染，避免绕过“离线优先 + 在线回退”策略。
 * - 允许 src/views/dev 下的演示/自测页面直接使用在线组件。
 *
 * 用法：
 *   node scripts/audit-no-online-icons-in-views.mjs
 * 可选参数：
 *   --root <path> 指定工作区根目录（默认当前工作目录）
 */

import fs from "fs";
import path from "path";

/**
 * 解析命令行参数
 * @returns {{ workspaceRoot: string }} 返回工作区根目录
 */
function parseArgs() {
  const argv = process.argv.slice(2);
  const idx = argv.indexOf("--root");
  const workspaceRoot = idx !== -1 && argv[idx + 1] ? path.resolve(argv[idx + 1]) : process.cwd();
  return { workspaceRoot };
}

/**
 * 递归遍历目录，收集待审计文件（.vue/.ts/.tsx/.js/.jsx）
 * @param {string} dir 目录
 * @param {Set<string>} exts 扩展名集合
 * @param {string[]} out 输出数组
 */
function walk(dir, exts, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) {
      // 跳过依赖与构建目录
      if (["node_modules", ".git", "dist"].includes(e.name)) continue;
      walk(fp, exts, out);
    } else {
      const ext = path.extname(e.name).toLowerCase();
      if (exts.has(ext)) out.push(fp);
    }
  }
}

/**
 * 主逻辑：扫描 src/views，定位 IconifyIconOnline 的使用并输出报告
 */
function main() {
  const { workspaceRoot } = parseArgs();
  // 约定子项目目录名：pure-admin-thin-max-ts
  const projectRoot = path.join(workspaceRoot, "pure-admin-thin-max-ts");
  const viewsRoot = path.join(projectRoot, "src", "views");
  if (!fs.existsSync(viewsRoot)) {
    console.error(`[audit-no-online-icons] error: 未找到 views 目录: ${viewsRoot}`);
    process.exit(1);
  }

  const files = [];
  walk(viewsRoot, new Set([".vue", ".ts", ".tsx", ".js", ".jsx"]), files);

  /**
   * 函数级注释：
   * - 匹配在线组件的使用形式：<IconifyIconOnline ...> 或 组件注册/引用 "IconifyIconOnline"
   * - 针对 dev 目录进行白名单豁免。
   */
  const onlinePattern = /IconifyIconOnline/;
  const violations = [];

  for (const file of files) {
    // dev 目录白名单
    if (file.includes(path.join("views", "dev"))) continue;
    const content = fs.readFileSync(file, "utf8");
    if (onlinePattern.test(content)) {
      violations.push(file);
    }
  }

  if (violations.length) {
    console.log("\n[禁止使用在线组件] 以下视图文件直接使用了 IconifyIconOnline（请改为 SmartIcon/useRenderIcon）：");
    violations.forEach(fp => console.log(`- ${fp}`));
    console.log("\n审计失败：请修正上述文件后重试。\n");
    process.exit(1);
  } else {
    console.log("\n[通过] src/views 中未检测到直接使用 IconifyIconOnline 的情况（dev 目录除外）。\n");
    process.exit(0);
  }
}

main();

