/**
 * 检查 demo 摘要中的 headK 聚类集中度门禁结果，并打印简要结论。
 * 
 * 函数级注释：
 * - loadSummary：读取 reports/newman-summary.demo.json 并返回对象；
 * - checkGate：根据 headK、阈值与开关计算头部累计占比并给出“通过/不通过”；
 * - main：脚本入口，串联读取与检查并输出结果。
 */
const fs = require('fs');
const path = require('path');

/**
 * 读取 demo 摘要 JSON
 * @returns {Object} 摘要对象
 */
function loadSummary() {
  const p = path.join(process.cwd(), 'reports', 'newman-summary.demo.json');
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

/**
 * 计算并打印门禁结果
 * @param {Object} s 摘要对象
 */
function checkGate(s) {
  const cfg = (s.reporting && s.reporting.config && s.reporting.config.failureClusters) || {};
  const thr = Number(cfg.headKThresholdPercent || 70) || 70;
  const k = Number(cfg.headK || 3) || 3;
  const enabled = !!cfg.failOnHeadKThresholdBreach;
  const clusters = Array.isArray(s.failureClusters) ? s.failureClusters : [];
  if (!clusters.length) {
    console.log('- 无失败聚类：跳过集中度门禁');
    return;
  }
  const headShareSum = clusters.slice(0, Math.min(k, clusters.length)).reduce((sum, c) => sum + (typeof c.share === 'number' ? c.share : 0), 0);
  const rounded = Math.round(headShareSum * 10) / 10;
  const result = (enabled && rounded >= thr) ? '不通过' : '通过';
  console.log(`- 阈值：${thr}%；K=${Math.min(k, clusters.length)}；当前头部累计占比：${rounded}%；门禁：${enabled ? '开启' : '关闭'}；结果：${result}`);
}

/**
 * 脚本入口
 */
function main() {
  try {
    const s = loadSummary();
    checkGate(s);
  } catch (e) {
    console.error('❌ 检查失败：', e && e.message ? e.message : e);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { loadSummary, checkGate };

