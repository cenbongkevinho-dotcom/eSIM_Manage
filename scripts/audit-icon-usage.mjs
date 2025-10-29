#!/usr/bin/env node
/**
 * 图标使用审计脚本（在线冒号风格优先）
 * 目标：
 * 1) 扫描 src 代码中 Iconify 图标字符串的用法；
 * 2) 报告是否仍有“斜杠风格”（ep/xxx、ri/xxx）在业务代码中被使用；
 * 3) 校验“冒号风格”（ep:xxx、ri:xxx）是否在对应的 iconify-json 中存在；
 * 4) 输出总结与改造建议。
 *
 * 使用方法：
 *   node scripts/audit-icon-usage.mjs
 * 可选参数：
 *   --root <path> 指定项目根目录（默认当前工作目录）
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

/**
 * 解析命令行参数
 * @returns {{ projectRoot: string }} 包含项目根目录
 */
function parseArgs() {
  const argv = process.argv.slice(2);
  const idx = argv.indexOf("--root");
  const projectRoot = idx !== -1 && argv[idx + 1] ? path.resolve(argv[idx + 1]) : process.cwd();
  return { projectRoot };
}

/**
 * 读取目录，递归收集指定扩展的文件
 * @param {string} dir 起始目录
 * @param {Set<string>} exts 需要收集的扩展（.ts/.tsx/.vue/.js/.jsx）
 * @param {string[]} out 结果数组（原地累加）
 */
function walk(dir, exts, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) {
      // 忽略 node_modules 与构建产物目录
      if (e.name === "node_modules" || e.name === ".git" || e.name === "dist") continue;
      walk(fp, exts, out);
    } else {
      const ext = path.extname(e.name).toLowerCase();
      if (exts.has(ext)) out.push(fp);
    }
  }
}

/**
 * 加载 iconify-json，返回 icons 名称集合
 * @param {"ri"|"ep"} ns 命名空间（提供者）
 * @returns {Set<string>} 该命名空间可用图标名集合
 */
function loadIconSet(ns) {
  /**
   * 尝试多路径解析：
   * - 默认（相对脚本当前工作目录）
   * - 子项目 pure-admin-thin-max-ts 目录
   */
  const candidates = [
    ns === 'ri' ? '@iconify-json/ri/icons.json' : '@iconify-json/ep/icons.json'
  ];
  const resolveFrom = [process.cwd(), path.join(process.cwd(), 'pure-admin-thin-max-ts')];
  for (const base of resolveFrom) {
    try {
      const file = require.resolve(candidates[0], { paths: [base] });
      const json = JSON.parse(fs.readFileSync(file, 'utf8'));
      return new Set(Object.keys(json.icons || {}));
    } catch (e) {
      // 继续尝试下一个 base
    }
  }
  console.warn(`[audit-icon-usage] warn: 未能解析 ${ns}/icons.json，跳过存在性校验`);
  return new Set();
}

/**
 * 扫描文件内容，匹配冒号/斜杠风格的图标字符串
 * @param {string} filePath 文件路径
 * @param {string} content 文件内容
 * @returns {{ colon: any[]; slash: any[]; unknownProviders: Set<string> }}
 */
function scanFile(filePath, content) {
  const colon = [];
  const slash = [];
  const unknownProviders = new Set();
  // 仅匹配引号内的 provider:name/provider/name
  const colonRe = /(["'`])([a-z]{2,}):([a-z0-9][\w-]*)\1/gi;
  const slashRe = /(["'`])([a-z]{2,})\/([a-z0-9][\w-]*)\1/gi;

  // 逐行处理，用于更友好的行号与建议
  const lines = content.split(/\r?\n/);
  lines.forEach((line, i) => {
    let m;
    while ((m = colonRe.exec(line)) !== null) {
      const [full, , provider, name] = m;
      colon.push({ filePath, line: i + 1, col: m.index + 1, full, provider, name });
      if (!['ri','ep'].includes(provider)) unknownProviders.add(provider);
    }
    while ((m = slashRe.exec(line)) !== null) {
      const [full, , provider, name] = m;
      slash.push({ filePath, line: i + 1, col: m.index + 1, full, provider, name });
      if (!['ri','ep'].includes(provider)) unknownProviders.add(provider);
    }
  });
  return { colon, slash, unknownProviders };
}

/**
 * 主流程：扫描 src，输出报告
 */
function main() {
  const { projectRoot } = parseArgs();
  const srcRoot = path.join(projectRoot, "pure-admin-thin-max-ts", "src");
  if (!fs.existsSync(srcRoot)) {
    console.error(`[audit-icon-usage] error: 未找到 src 目录: ${srcRoot}`);
    process.exit(1);
  }

  const exts = new Set([".ts", ".tsx", ".vue", ".js", ".jsx"]);
  const files = [];
  walk(srcRoot, exts, files);

  const riSet = loadIconSet("ri");
  const epSet = loadIconSet("ep");

  const colonUsages = [];
  const slashUsages = [];
  const unknownProviders = new Set();

  for (const f of files) {
    const content = fs.readFileSync(f, "utf8");
    const { colon, slash, unknownProviders: up } = scanFile(f, content);
    colonUsages.push(...colon);
    slashUsages.push(...slash);
    up.forEach(p => unknownProviders.add(p));
  }

  // 允许使用斜杠风格的文件白名单（离线注册文件）
  const whitelistSlash = new Set([
    path.join(srcRoot, "components", "ReIcon", "src", "offlineIcon.ts")
  ]);

  // provider 仅限 ri/ep，且不在白名单中的斜杠风格才视为违规
  const providerAllow = new Set(['ri', 'ep']);
  const whitelistFiles = new Set([
    ...whitelistSlash,
    // 文档示例包含 "ep/delete" 的说明性文件，避免误报
    path.join(srcRoot, "components", "ReIcon", "src", "hooks.ts"),
    path.join(srcRoot, "components", "ReIcon", "src", "useRenderIconSafe.ts"),
    path.join(srcRoot, "components", "ReFloatButton", "src", "type.ts")
  ]);
  const slashViolations = slashUsages.filter(u => providerAllow.has(u.provider) && !whitelistFiles.has(u.filePath));

  // 校验冒号风格图标是否存在于 iconify-json（仅校验 ri/ep）
  const missingColon = colonUsages.filter(u => {
    if (u.provider === 'ri') return riSet.size > 0 && !riSet.has(u.name);
    if (u.provider === 'ep') return epSet.size > 0 && !epSet.has(u.name);
    return false; // 其它 provider 暂不校验
  });

  // 输出结果
  console.log("\n=== Icon 使用审计结果 ===");
  console.log(`扫描文件: ${files.length} 个`);
  console.log(`冒号风格（在线）匹配: ${colonUsages.length} 处`);
  console.log(`斜杠风格（离线）匹配: ${slashUsages.length} 处`);

  if (unknownProviders.size) {
    console.log("\n[提示] 检测到未知 provider（未纳入校验范围）：", [...unknownProviders].join(", "));
  }

  if (slashViolations.length) {
    console.log("\n[警告] 业务代码中检测到斜杠风格的图标用法（建议替换为冒号风格）：");
    slashViolations.slice(0, 50).forEach(u => {
      console.log(`- ${u.filePath}:${u.line}:${u.col}  ${u.full}  -> 建议替换为 "${u.provider}:${u.name}"`);
    });
    if (slashViolations.length > 50) {
      console.log(`... 其余 ${slashViolations.length - 50} 处已省略`);
    }
  } else {
    console.log("\n[通过] 未在业务代码中发现斜杠风格字符串用法（离线注册文件除外）");
  }

  if (missingColon.length) {
    console.log("\n[警告] 以下冒号风格图标在 iconify-json 中未找到（请检查拼写或 provider）：");
    missingColon.slice(0, 50).forEach(u => {
      console.log(`- ${u.filePath}:${u.line}:${u.col}  ${u.provider}:${u.name}`);
    });
    if (missingColon.length > 50) {
      console.log(`... 其余 ${missingColon.length - 50} 处已省略`);
    }
  } else {
    console.log("\n[通过] ri/ep 冒号风格图标均可在 iconify-json 中找到");
  }

  console.log("\n审计完成。\n");
  // 总是以 0 退出，不阻断构建。可根据需要调整为检测到问题时退出码非 0。
  process.exit(0);
}

main();
