/**
 * 生成演示版 newman-summary.json，用于本地/CI 验证失败聚类与归一化展示效果。
 *
 * 函数级注释：
 * - buildDemoSummary：构造符合 scripts/run_newman.js 输出结构的演示摘要；包含失败聚类、分布统计与报告配置回显；
 * - writeJson：将对象写入指定路径（自动创建目录），返回绝对路径；
 * - main：脚本入口，生成并写入 reports/newman-summary.demo.json。
 */
const fs = require('fs');
const path = require('path');

/**
 * 构造演示用摘要对象（结构参考 scripts/run_newman.js 的 writeNewmanSummary 输出）
 * @returns {Object} 演示摘要对象
 */
function buildDemoSummary() {
  const failures = [
    { name: 'AssertionError', message: '期望 status 200 实际 500 - traceId=123e4567-e89b-12d3-a456-426614174000', test: 'status_is_200', at: 'assertion', source: { item: 'GET /api/v1/users', type: 'item', id: 'itm-1', path: 'Auth/Users' } },
    { name: 'AssertionError', message: '邮箱格式错误: test.user@example.com', test: 'email_format', at: 'assertion', source: { item: 'POST /api/v1/users', type: 'item', id: 'itm-2', path: 'Auth/Users' } },
    { name: 'AssertionError', message: 'IP 地址非法: 192.168.10.25', test: 'ip_format', at: 'assertion', source: { item: 'POST /api/v1/login', type: 'item', id: 'itm-3', path: 'Auth/Login' } },
    { name: 'AssertionError', message: '手机号不合法: +86-13800138000', test: 'phone_format', at: 'assertion', source: { item: 'GET /api/v1/orders', type: 'item', id: 'itm-4', path: 'Order/List' } },
    { name: 'AssertionError', message: '查询参数错误: /search?q=foo&uid=987654', test: 'url_query', at: 'assertion', source: { item: 'GET /api/v1/search', type: 'item', id: 'itm-5', path: 'Search' } },
  ];
  const totalFailures = failures.length;

  const failureClusters = [
    {
      folder: 'Auth/Users',
      assertion: 'status_is_200',
      count: 2,
      examples: [
        '期望 status 200 实际 500 - traceId=123e4567-e89b-12d3-a456-426614174000',
        '期望 status 200 实际 500 - traceId=9abfce10-1111-2222-3333-444455556666',
      ],
    },
    {
      folder: 'Auth/Login',
      assertion: 'ip_format',
      count: 1,
      examples: [
        'IP 地址非法: 192.168.10.25',
      ],
    },
    {
      folder: 'Order/List',
      assertion: 'phone_format',
      count: 1,
      examples: [
        '手机号不合法: +86-13800138000',
      ],
    },
    {
      folder: 'Search',
      assertion: 'url_query',
      count: 1,
      examples: [
        '查询参数错误: /search?q=foo&uid=987654',
      ],
    },
  ].map((c) => ({
    ...c,
    share: totalFailures ? Math.round((c.count / totalFailures) * 1000) / 10 : 0,
  }));

  const meta = {
    totalFailures,
    clusterCount: failureClusters.length,
    clusteredFailuresCount: failureClusters.reduce((sum, c) => sum + c.count, 0),
    coveragePercent: Math.round((failureClusters.reduce((sum, c) => sum + c.count, 0) / totalFailures) * 1000) / 10,
  };

  const payload = {
    collection: 'Demo collection',
    timestamp: new Date().toISOString(),
    stats: {
      failureCount: totalFailures,
      requestsTotal: 20,
      assertionsTotal: 25,
      assertionsFailed: totalFailures,
    },
    failures,
    failureClusters,
    failureClustersMeta: meta,
    distributions: {
      statusCodes: { '200': 15, '400': 3, '500': 2 },
    },
    topSlowRequests: [
      { name: 'GET /api/v1/orders', code: 200, responseTime: 120 },
      { name: 'POST /api/v1/login', code: 400, responseTime: 90 },
      { name: 'GET /api/v1/search', code: 200, responseTime: 80 },
      { name: 'GET /api/v1/users', code: 500, responseTime: 75 },
      { name: 'POST /api/v1/users', code: 500, responseTime: 70 },
    ],
    responseTimePercentiles: { p50: 30, p90: 80, p95: 100, p99: 150 },
    folderAggregates: {
      'Auth/Users': {
        requests: 5,
        assertionsTotal: 8,
        assertionsFailed: 2,
        statusCodes: { '200': 3, '500': 2 },
        responseTime: { min: 20, max: 100, avg: 50, p50: 40, p90: 90, p95: 100, p99: 100 },
      },
      'Auth/Login': {
        requests: 4,
        assertionsTotal: 6,
        assertionsFailed: 1,
        statusCodes: { '200': 3, '400': 1 },
        responseTime: { min: 15, max: 90, avg: 45, p50: 35, p90: 80, p95: 90, p99: 90 },
      },
      'Order/List': {
        requests: 6,
        assertionsTotal: 7,
        assertionsFailed: 1,
        statusCodes: { '200': 5, '400': 1 },
        responseTime: { min: 10, max: 120, avg: 60, p50: 50, p90: 110, p95: 120, p99: 120 },
      },
      'Search': {
        requests: 5,
        assertionsTotal: 4,
        assertionsFailed: 1,
        statusCodes: { '200': 4, '400': 1 },
        responseTime: { min: 15, max: 80, avg: 40, p50: 35, p90: 75, p95: 80, p99: 80 },
      },
    },
    methodAggregates: {
      GET: { requests: 12, assertionsTotal: 12, assertionsFailed: 3, statusCodes: { '200': 10, '400': 1, '500': 1 }, responseTime: { p90: 100, max: 120 } },
      POST: { requests: 8, assertionsTotal: 13, assertionsFailed: 2, statusCodes: { '200': 5, '400': 2, '500': 1 }, responseTime: { p90: 90, max: 100 } },
    },
    pathAggregates: {
      '/api/v1': { requests: 20, assertionsTotal: 25, assertionsFailed: 5, statusCodes: { '200': 15, '400': 3, '500': 2 }, responseTime: { p90: 100, max: 120 } },
    },
    budgets: { configPath: null, config: { failOnBudgetBreach: false } },
    budgetBreaches: [],
    reporting: {
      configPath: null,
      config: {
        failureClusters: {
          topN: 10,
          headK: 3,
          headKThresholdPercent: 70,
          failOnHeadKThresholdBreach: true,
          examplesPerCluster: 3,
          normalizeMessages: true,
          normalization: {
            stripUUID: true,
            stripHex: true,
            stripNumbersLong: true,
            stripISODateTime: true,
            stripEmail: false,
            stripIPv4: false,
            stripIPv6: false,
            stripPhone: false,
            stripURLQueryValues: false,
          },
        },
      },
    },
    reports: { junit: null, html: null },
  };
  return payload;
}

/**
 * 写入 JSON 文件（自动创建目录）
 * @param {string} filePath 输出路径
 * @param {Object} obj 对象
 * @returns {string} 写入后的绝对路径
 */
function writeJson(filePath, obj) {
  const abs = path.resolve(filePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(obj, null, 2), 'utf8');
  return abs;
}

/**
 * 脚本入口：生成并写入演示摘要
 */
async function main() {
  try {
    const demo = buildDemoSummary();
    const out = writeJson(path.join(process.cwd(), 'reports', 'newman-summary.demo.json'), demo);
    console.log(`✅ 演示摘要已生成: ${out}`);
    console.log('您可以用工作流的 Step Summary 解析逻辑替换读取路径为 reports/newman-summary.demo.json 来验证聚类展示效果。');
  } catch (e) {
    console.error('❌ 生成演示摘要失败：', e && e.message ? e.message : e);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { buildDemoSummary, writeJson };
