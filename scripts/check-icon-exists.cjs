/**
 * 简易检查脚本：校验 Remix 与 Element Plus 离线 JSON 中是否存在某些键名
 * 用法：node scripts/check-icon-exists.cjs ri add-large-line arrow-left-double-fill
 */
const fs = require("fs");
const path = require("path");

function loadIconJson(namespace) {
  // 优先使用 require.resolve 解析当前工作目录的 node_modules
  let file;
  try {
    file = namespace === "ri"
      ? require.resolve("@iconify-json/ri/icons.json")
      : require.resolve("@iconify-json/ep/icons.json");
  } catch (e) {
    // 兼容多仓结构：尝试在 pure-admin-thin-max-ts 的 node_modules 中解析
    const projectRoot = process.cwd();
    const fallback = path.join(
      projectRoot,
      "node_modules",
      namespace === "ri"
        ? "@iconify-json/ri/icons.json"
        : "@iconify-json/ep/icons.json"
    );
    if (!fs.existsSync(fallback)) {
      console.error("无法解析 iconify-json 路径，请在前端项目目录执行或调整脚本 fallback");
      throw e;
    }
    file = fallback;
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function main() {
  const [namespace, ...keys] = process.argv.slice(2);
  if (!namespace || keys.length === 0) {
    console.error("用法: node scripts/check-icon-exists.cjs <ri|ep> <key1> <key2> ...");
    process.exit(1);
  }
  const json = loadIconJson(namespace);
  const result = keys.map(k => [k, !!json.icons[k]]);
  console.log(`namespace: ${namespace}`);
  console.table(result);
}

main();
