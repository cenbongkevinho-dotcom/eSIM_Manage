#!/usr/bin/env node
/*
 * i18n 缺失鍵檢測腳本（CI 使用）。
 * 作用：掃描 src 目錄中的 t()/i18n.t()/$t() 調用所使用的翻譯鍵，對比各語言包（zh-CN/en-US/zh-TW/ja-JP）是否均存在，若缺失則輸出報告並以非零碼退出。
 */

import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(process.cwd());
const srcDir = path.join(projectRoot, "src");
const localeFiles = {
  "zh-CN": path.join(projectRoot, "src/locales/zh-CN/index.ts"),
  "en-US": path.join(projectRoot, "src/locales/en-US/index.ts"),
  "zh-TW": path.join(projectRoot, "src/locales/zh-TW/index.ts"),
  "ja-JP": path.join(projectRoot, "src/locales/ja-JP/index.ts")
};

/**
 * 遞歸列出指定目錄下的所有文件路徑。
 * @param {string} dir 目錄絕對路徑
 * @param {string[]} exts 需要匹配的擴展名列表（例如 ['.vue','.ts','.tsx','.js']）
 * @returns {string[]} 文件絕對路徑列表
 */
function listFilesRecursively(dir, exts) {
  /** @type {string[]} */
  const results = [];

  /**
   * 深度優先遍歷目錄，收集符合擴展名的文件。
   * @param {string} current 當前目錄或文件路徑
   */
  function walk(current) {
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(current)) {
        walk(path.join(current, entry));
      }
    } else {
      if (exts.includes(path.extname(current))) {
        results.push(current);
      }
    }
  }

  walk(dir);
  return results;
}

/**
 * 從代碼文本中提取 i18n 翻譯鍵。
 * 支持匹配：t('key')、t("key")、$t('key')、i18n.t('key') 等。
 * @param {string} code 文件內容
 * @returns {Set<string>} 提取到的鍵集合
 */
function extractI18nKeys(code) {
  const keys = new Set();
  const patterns = [
    /\bt\((?:'([^']+)'|"([^"]+)")\)/g,
    /\$t\((?:'([^']+)'|"([^"]+)")\)/g,
    /i18n\.t\((?:'([^']+)'|"([^"]+)")\)/g
  ];
  for (const regex of patterns) {
    let m;
    while ((m = regex.exec(code)) !== null) {
      const key = m[1] || m[2];
      if (key) keys.add(key);
    }
  }
  return keys;
}

/**
 * 從 TS 語言包文件中解析出對應的對象字面量。
 * 實現：將 `export default { ... };` 提取為字面量字串，透過 `new Function` 評估得到對象。
 * 注意：此方法假設文件為純對象字面量，不包含類型或非對象語句。
 * @param {string} filePath 語言包文件絕對路徑
 * @returns {Record<string, any>} 語言包對象
 */
function loadLocaleObject(filePath) {
  const code = fs.readFileSync(filePath, "utf8");
  const idx = code.indexOf("export default");
  if (idx === -1) throw new Error(`未找到 export default：${filePath}`);
  let literal = code.slice(idx + "export default".length).trim();
  // 去掉末尾分號
  if (literal.endsWith(";")) literal = literal.slice(0, -1);
  // 以函數返回字面量的方式評估

  const obj = new Function(`return (${literal})`)();
  return obj;
}

/**
 * 將嵌套對象展平為以點號分隔的鍵集合。
 * @param {Record<string, any>} obj 語言包對象
 * @param {string} [prefix] 鍵前綴
 * @param {Set<string>} [acc] 累加集合
 * @returns {Set<string>} 展平後的鍵集合
 */
function flattenKeys(obj, prefix = "", acc = new Set()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      flattenKeys(v, key, acc);
    } else {
      acc.add(key);
    }
  }
  return acc;
}

/**
 * 主流程：掃描代碼鍵 -> 解析語言包 -> 對比缺失 -> 輸出報告。
 */
function main() {
  const files = listFilesRecursively(srcDir, [".vue", ".ts", ".tsx", ".js"]);
  const usedKeys = new Set();
  for (const file of files) {
    const code = fs.readFileSync(file, "utf8");
    const keys = extractI18nKeys(code);
    keys.forEach(k => usedKeys.add(k));
  }

  // 解析各語言包並展平鍵
  /** @type {Record<string, Set<string>>} */
  const localeKeySets = {};
  for (const [locale, file] of Object.entries(localeFiles)) {
    const obj = loadLocaleObject(file);
    localeKeySets[locale] = flattenKeys(obj);
  }

  // 統計缺失鍵
  /** @type {Record<string, string[]>} */
  const missing = {};
  for (const locale of Object.keys(localeFiles)) {
    missing[locale] = [];
  }
  for (const key of usedKeys) {
    for (const [locale, keys] of Object.entries(localeKeySets)) {
      if (!keys.has(key)) missing[locale].push(key);
    }
  }

  // 輸出結果並設置退出碼
  const totalMissing = Object.values(missing).reduce(
    (sum, arr) => sum + arr.length,
    0
  );
  if (totalMissing === 0) {
    console.log("[i18n] 所有語言包鍵完整，未檢測到缺失。");
    process.exit(0);
  } else {
    console.log("[i18n] 檢測到缺失的翻譯鍵：");
    for (const [locale, arr] of Object.entries(missing)) {
      if (arr.length) {
        console.log(`  - ${locale}: ${arr.length} 個缺失`);
        for (const k of arr) console.log(`      * ${k}`);
      }
    }
    process.exit(1);
  }
}

main();
