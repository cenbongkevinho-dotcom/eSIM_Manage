/**
 * 使用 newman 以编程方式执行 Postman 集合，并输出 JUnit 报表。
 *
 * 函数级注释：
 * - runNewman：封装 newman.run；支持传入集合路径、环境变量、报表类型、JUnit 输出路径与 HTML(hTMLEXTRA) 报表；
 * - 主入口：若直接执行该脚本，将对默认集合运行（docs/09-API文档/client-kits/postman_collection.json），并将报表写入 reports/newman-results.xml。
 *
 * 适用场景：
 * - 在 CI 中统一执行集合并以非 0 退出码反馈断言失败；
 * - 在本地快速验证错误响应约束（X-Correlation-ID、最小错误字段集等）。
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
let newman = null;
try {
  newman = require('newman');
} catch (e) {
  // 未找到 newman 模块时，在 CI/本地使用 CLI 作为兜底
  newman = null;
}

/**
 * 执行 Postman 集合并输出报表
 * @param {Object} params 入参对象
 * @param {string} params.collection 集合文件路径
 * @param {Object} [params.envVars] 传入给集合的环境变量（键值对），如 { baseUrl: 'http://localhost:8080' }
 * @param {string[]} [params.reporters] 报表类型数组（如 ['cli','junit','htmlextra']）
 * @param {string|null} [params.junitOutput] JUnit 报表输出路径（启用 junit 报表时必填）
 * @param {string|null} [params.htmlOutput] HTML 报表输出路径（启用 htmlextra 报表时建议传入）
 * @param {boolean} [params.rejectOnFailures=true] 是否在断言失败时 reject；若置为 false，将返回 summary，便于写入摘要并在外部控制退出码
 * @returns {Promise<Object>} 执行摘要；若执行错误将 reject；根据 rejectOnFailures 控制断言失败行为
 *
 * 函数级注释：
 * - 统一将 envVars 转换为 newman.envVar 数组项格式；
 * - 若启用 junit 报表且指定输出路径，会在 reporter 选项中设置导出路径；
 * - 对断言失败数量进行检查，失败则根据 rejectOnFailures 决定是否 reject；
 * - 若未安装本地模块（require('newman') 失败），自动回退到 CLI 运行，并通过 JSON reporter 获取执行摘要。
*/
function runNewman({ collection, envVars = {}, reporters = ['cli'], junitOutput = null, htmlOutput = null, rejectOnFailures = true }) {
  return new Promise((resolve, reject) => {
    // 若存在 newman 本地模块，优先使用编程接口
    if (newman) {
      const options = {
        collection,
        reporters,
        envVar: Object.entries(envVars).map(([key, value]) => ({ key, value })),
      };

      if (reporters.includes('junit') && junitOutput) {
        options.reporter = { junit: { export: junitOutput } };
      }

      // 如果启用了 htmlextra 报表且提供了输出路径，追加 htmlextra 配置
      // 注意：使用该报表需要预先安装插件 newman-reporter-htmlextra
      if (reporters.includes('htmlextra')) {
        options.reporter = options.reporter || {};
        options.reporter.htmlextra = {};
        if (htmlOutput) {
          options.reporter.htmlextra.export = htmlOutput;
        }
      }

      newman.run(options, (err, summary) => {
        if (err) return reject(err);
        const failures = (summary.run?.failures || []).length;
        if (failures > 0 && rejectOnFailures) {
          return reject(new Error(`newman 断言失败数量：${failures}`));
        }
        resolve(summary);
      });
      return;
    }

    // 否则回退到 CLI：通过 JSON reporter 获取结构化摘要
    try {
      const jsonTemp = path.resolve(process.cwd(), 'reports/newman-cli-summary.json');
      fs.mkdirSync(path.dirname(jsonTemp), { recursive: true });
      const args = ['run', collection];
      // 报表类型：强制包含 json 以导出摘要
      const uniqueReporters = Array.from(new Set([...(reporters || []), 'json']));
      args.push('-r', uniqueReporters.join(','));

      if (junitOutput) {
        args.push('--reporter-junit-export', junitOutput);
      }
      // htmlextra 导出
      if (uniqueReporters.includes('htmlextra') && htmlOutput) {
        args.push('--reporter-htmlextra-export', htmlOutput);
      }
      // json 导出路径
      args.push('--reporter-json-export', jsonTemp);
      // env 变量
      Object.entries(envVars).forEach(([k, v]) => {
        args.push('--env-var', `${k}=${v}`);
      });

      // 同步执行 CLI，继承 stdio 便于本地观察输出（spawnSync 不会在非零退出码时抛异常，便于后续读取摘要）
      const result = cp.spawnSync('newman', args, { stdio: 'inherit' });

      // 读取 JSON 摘要并返回（即使存在断言失败，JSON 通常仍会生成）
      const summary = JSON.parse(fs.readFileSync(jsonTemp, 'utf8'));
      const failures = (summary.run?.failures || []).length;
      if (failures > 0 && rejectOnFailures) {
        return reject(new Error(`newman 断言失败数量：${failures}`));
      }
      resolve(summary);
    } catch (cliErr) {
      reject(cliErr);
    }
  });
}

/**
 * 写入 newman 执行摘要为 JSON 文件
 * @param {Object} summary newman 执行返回的摘要对象
 * @param {Object} opts 选项
 * @param {string} opts.outputPath 摘要 JSON 写入路径
 * @param {string|null} [opts.junitOutput] JUnit 报表文件路径
 * @param {string|null} [opts.htmlOutput] HTML 报表文件路径
 * @returns {string} 输出文件的绝对路径
 *
 * 函数级注释：
 * - 提取失败数量与失败详情（名称、消息、来源 item），便于在 CI 的 Step Summary 展示；
 * - 同时记录报告文件路径，帮助审阅者快速跳转到 Artifact；
 * - 若某些字段在不同 newman 版本中缺失，做空值兜底确保 JSON 可解析。
 */
function writeNewmanSummary(summary, { outputPath, junitOutput = null, htmlOutput = null }) {
  const failures = Array.isArray(summary?.run?.failures) ? summary.run.failures : [];
  const collectionName = summary?.collection?.name || path.basename(String(summary?.collection ?? 'collection'));
  const stats = summary?.run?.stats || null;
  const executions = Array.isArray(summary?.run?.executions) ? summary.run.executions : [];

  // 构建集合索引：将请求 item 的 id/name 映射到“文件夹路径”
  /**
   * 函数级注释：buildCollectionIndex
   * - 递归遍历 Postman 集合（summary.collection.item），建立两类索引：
   *   1) idToPath：item.id => { path: string[], name: string }
   *   2) nameToPath：item.name => string[]（一个名称可能对应多个路径，取第一项作为兜底）
   * - 该索引用于“按文件夹聚合统计”和为失败条目增加来源路径。
   */
  function buildCollectionIndex(coll) {
    const idToPath = {};
    const nameToPath = {};
    function dfs(items, ancestors = []) {
      if (!Array.isArray(items)) return;
      items.forEach((node, idx) => {
        const nodeName = node?.name || `unnamed_${idx}`;
        if (Array.isArray(node?.item)) {
          // 文件夹（ItemGroup）
          dfs(node.item, ancestors.concat(nodeName));
        } else {
          // 叶子请求项
          const id = node?.id || null;
          const pathArr = ancestors.slice();
          if (id) {
            idToPath[id] = { path: pathArr, name: nodeName };
          }
          if (!nameToPath[nodeName]) nameToPath[nodeName] = [];
          nameToPath[nodeName].push(pathArr);
        }
      });
    }
    dfs(coll?.item, []);
    return { idToPath, nameToPath };
  }
  const { idToPath, nameToPath } = buildCollectionIndex(summary?.collection || {});

  // 统计状态码分布与最慢请求（若可用）
  const statusCodes = {};
  const slowCandidates = [];
  for (const ex of executions) {
    const code = ex?.response?.code;
    if (typeof code === 'number') {
      statusCodes[code] = (statusCodes[code] || 0) + 1;
    }
    const time = ex?.response?.responseTime ?? ex?.response?.timings?.response ?? null;
    if (typeof time === 'number') {
      slowCandidates.push({ name: ex?.item?.name || null, code: code ?? null, responseTime: time });
    }
  }
  slowCandidates.sort((a, b) => (b.responseTime || 0) - (a.responseTime || 0));
  const topSlowRequests = slowCandidates.slice(0, 5);

  // 响应时间分位数（全局）：p50/p90/p95/p99
  const allTimes = slowCandidates
    .map((x) => x.responseTime)
    .filter((t) => typeof t === 'number')
    .sort((a, b) => a - b);
  function percentile(arr, p) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const idx = Math.ceil((p / 100) * arr.length) - 1;
    const i = Math.max(0, Math.min(arr.length - 1, idx));
    return arr[i];
  }
  const responseTimePercentiles = {
    p50: percentile(allTimes, 50),
    p90: percentile(allTimes, 90),
    p95: percentile(allTimes, 95),
    p99: percentile(allTimes, 99),
  };

  // 按文件夹聚合统计（请求数、断言数/失败数、状态码分布、响应时间基本统计）
  const folderStats = {};
  function ensureFolder(key) {
    if (!folderStats[key]) {
      folderStats[key] = {
        requests: 0,
        assertionsTotal: 0,
        assertionsFailed: 0,
        statusCodes: {},
        responseTimes: [],
      };
    }
    return folderStats[key];
  }
  for (const ex of executions) {
    const exId = ex?.item?.id || null;
    const exName = ex?.item?.name || null;
    const pathEntry = exId && idToPath[exId]
      ? idToPath[exId]
      : (exName && Array.isArray(nameToPath[exName]) && nameToPath[exName].length > 0
          ? { path: nameToPath[exName][0], name: exName }
          : { path: [], name: exName });
    const folderKey = (pathEntry.path && pathEntry.path.length) ? pathEntry.path.join('/') : '(root)';
    const bucket = ensureFolder(folderKey);

    // 请求计数
    bucket.requests += 1;
    // 断言统计
    const assertions = Array.isArray(ex?.assertions) ? ex.assertions : [];
    bucket.assertionsTotal += assertions.length;
    bucket.assertionsFailed += assertions.filter((a) => !!a?.error).length;
    // 状态码分布
    const code = ex?.response?.code;
    if (typeof code === 'number') {
      bucket.statusCodes[code] = (bucket.statusCodes[code] || 0) + 1;
    }
    // 响应时间收集
    const time = ex?.response?.responseTime ?? ex?.response?.timings?.response ?? null;
    if (typeof time === 'number') {
      bucket.responseTimes.push(time);
    }
  }
  const folderAggregates = {};
  for (const [key, bucket] of Object.entries(folderStats)) {
    const timesSorted = bucket.responseTimes.slice().sort((a, b) => a - b);
    const min = timesSorted.length ? timesSorted[0] : null;
    const max = timesSorted.length ? timesSorted[timesSorted.length - 1] : null;
    const avg = timesSorted.length
      ? Math.round(timesSorted.reduce((sum, t) => sum + t, 0) / timesSorted.length)
      : null;
    // 文件夹分位数
    const p50f = percentile(timesSorted, 50);
    const p90f = percentile(timesSorted, 90);
    const p95f = percentile(timesSorted, 95);
    const p99f = percentile(timesSorted, 99);
    folderAggregates[key] = {
      requests: bucket.requests,
      assertionsTotal: bucket.assertionsTotal,
      assertionsFailed: bucket.assertionsFailed,
      statusCodes: bucket.statusCodes,
      responseTime: { min, max, avg, p50: p50f, p90: p90f, p95: p95f, p99: p99f },
    };
  }

  // 方法与路径前缀聚合
  /**
   * 函数级注释：extractPathSegments
   * - 从 request.url（字符串或 SDK 对象）提取路径段数组；
   * - 优先使用 SDK 对象的 path.segments；其次使用 path（数组/字符串）；再次尝试 raw；
   * - 若为字符串且为绝对 URL，使用 URL 解析 pathname；否则按 '/' 切分。
   */
  function extractPathSegments(u) {
    if (!u) return [];
    // SDK 对象优先
    if (typeof u === 'object') {
      const segs = Array.isArray(u?.path?.segments) ? u.path.segments
        : (Array.isArray(u?.path) ? u.path
          : (typeof u?.path === 'string' ? u.path.split('/') : null));
      if (Array.isArray(segs)) {
        return segs.filter((s) => s && s.length > 0);
      }
      if (typeof u?.raw === 'string') {
        return extractPathSegments(u.raw);
      }
    }
    // 字符串 URL
    if (typeof u === 'string') {
      try {
        const abs = new URL(u);
        return (abs.pathname || '/')
          .split('/')
          .filter((s) => s && s.length > 0);
      } catch (e) {
        // 非绝对 URL，直接按 '/' 拆分
        return u.split('?')[0].split('#')[0].split('/')
          .filter((s) => s && s.length > 0);
      }
    }
    return [];
  }
  /**
   * 函数级注释：prefixFromSegments
   * - 从路径段数组生成前缀标签（最多两段），如 ['api','v1','users'] => '/api/v1'；
   * - 若无段，则返回 '/'，不可解析则 '(unknown)'。
   */
  function prefixFromSegments(segs) {
    if (!Array.isArray(segs)) return '(unknown)';
    if (segs.length === 0) return '/';
    return '/' + segs.slice(0, Math.min(2, segs.length)).join('/');
  }

  const methodStats = {};
  const pathStats = {};
  function ensureBucket(obj, key) {
    if (!obj[key]) {
      obj[key] = {
        requests: 0,
        assertionsTotal: 0,
        assertionsFailed: 0,
        statusCodes: {},
        responseTimes: [],
      };
    }
    return obj[key];
  }
  for (const ex of executions) {
    const method = (ex?.request?.method || '(UNKNOWN)').toUpperCase();
    const segs = extractPathSegments(ex?.request?.url);
    const prefix = prefixFromSegments(segs);
    const mBucket = ensureBucket(methodStats, method);
    const pBucket = ensureBucket(pathStats, prefix);
    // 请求计数
    mBucket.requests += 1; pBucket.requests += 1;
    // 断言统计
    const assertions = Array.isArray(ex?.assertions) ? ex.assertions : [];
    const failedCnt = assertions.filter((a) => !!a?.error).length;
    mBucket.assertionsTotal += assertions.length; mBucket.assertionsFailed += failedCnt;
    pBucket.assertionsTotal += assertions.length; pBucket.assertionsFailed += failedCnt;
    // 状态码分布
    const code = ex?.response?.code;
    if (typeof code === 'number') {
      mBucket.statusCodes[code] = (mBucket.statusCodes[code] || 0) + 1;
      pBucket.statusCodes[code] = (pBucket.statusCodes[code] || 0) + 1;
    }
    // 响应时间收集
    const time = ex?.response?.responseTime ?? ex?.response?.timings?.response ?? null;
    if (typeof time === 'number') {
      mBucket.responseTimes.push(time);
      pBucket.responseTimes.push(time);
    }
  }

  /**
   * 函数级注释：loadPerformanceBudgets
   * - 从脚本目录读取性能预算配置（scripts/newman-budgets.json）；
   * - 若文件不存在或解析失败，返回空配置；
   * - 配置结构建议：
   *   {
   *     "failOnBudgetBreach": false,
   *     "global": { "responseTime": { "p95": 300 } },
   *     "folders": { "Auth": { "responseTime": { "p95": 250 } } },
   *     "methods": { "GET": { "responseTime": { "p95": 200 } } },
   *     "paths": { "/api/v1": { "responseTime": { "p95": 250 } } }
   *   }
   */
  function loadPerformanceBudgets() {
    const budgetPath = path.resolve(process.cwd(), 'scripts', 'newman-budgets.json');
    try {
      if (fs.existsSync(budgetPath)) {
        const raw = fs.readFileSync(budgetPath, 'utf8');
        const cfg = JSON.parse(raw);
        return { configPath: budgetPath, config: cfg };
      }
    } catch (e) {
      console.warn('[newman] 读取性能预算配置失败:', e.message);
    }
    return { configPath: null, config: {} };
  }

  /**
   * 函数级注释：applyFailureClusterEnvOverrides
   * - 读取环境变量以覆盖失败聚类集中度相关配置（优先级高于配置文件）：
   *   - POSTMAN_HEADK_K：整数，覆盖 failureClusters.headK（K 值，需 >0）
   *   - POSTMAN_HEADK_THRESHOLD：阈值百分比，覆盖 failureClusters.headKThresholdPercent（建议范围 1～100，越界将进行截断并记录警告）
   *   - POSTMAN_HEADK_GATE_ON：'1'/'true' 开启，'0'/'false' 关闭，覆盖 failureClusters.failOnHeadKThresholdBreach
   * - 返回：{ cfg, meta }，其中 meta 用于在 Step Summary 中回显“参数来源”与校验提示。
   * @param {Object} cfg 报告配置对象（包含 failureClusters）
   * @returns {{ cfg: Object, meta: { source: 'env'|'file', overridesApplied: { headK?: boolean, threshold?: boolean, gateOn?: boolean }, warnings: string[] } }}
   */
  function applyFailureClusterEnvOverrides(cfg) {
    const meta = { source: 'file', overridesApplied: {}, warnings: [] };
    try {
      if (!cfg || typeof cfg !== 'object') return { cfg: (cfg || {}), meta };
      const fc = cfg.failureClusters || (cfg.failureClusters = {});
      const prev = { headK: fc.headK, threshold: fc.headKThresholdPercent, gateOn: fc.failOnHeadKThresholdBreach };
      const envKRaw = process.env.POSTMAN_HEADK_K;
      const envThrRaw = process.env.POSTMAN_HEADK_THRESHOLD;
      const envGateRaw = process.env.POSTMAN_HEADK_GATE_ON;
      // 覆盖 headK（需为 >0 的数值）
      if (envKRaw != null && String(envKRaw).trim() !== '') {
        const kVal = Number(envKRaw);
        if (!Number.isNaN(kVal) && kVal > 0) {
          fc.headK = kVal;
          meta.overridesApplied.headK = (prev.headK !== kVal);
        } else {
          meta.warnings.push(`POSTMAN_HEADK_K 非法（${envKRaw}），忽略覆盖`);
        }
      }
      // 覆盖阈值（建议范围 1～100；越界截断）
      if (envThrRaw != null && String(envThrRaw).trim() !== '') {
        const thrValRaw = Number(envThrRaw);
        if (!Number.isNaN(thrValRaw)) {
          let thrVal = thrValRaw;
          if (thrValRaw <= 0) { meta.warnings.push(`POSTMAN_HEADK_THRESHOLD 过低（${envThrRaw}），已截断为 1`); thrVal = 1; }
          if (thrValRaw > 100) { meta.warnings.push(`POSTMAN_HEADK_THRESHOLD 过高（${envThrRaw}），已截断为 100`); thrVal = 100; }
          fc.headKThresholdPercent = thrVal;
          meta.overridesApplied.threshold = (prev.threshold !== thrVal);
        } else {
          meta.warnings.push(`POSTMAN_HEADK_THRESHOLD 非法（${envThrRaw}），忽略覆盖`);
        }
      }
      // 覆盖门禁开关（true/false）
      if (envGateRaw != null && String(envGateRaw).trim() !== '') {
        const s = String(envGateRaw).toLowerCase();
        const enabled = (s === '1' || s === 'true');
        const disabled = (s === '0' || s === 'false');
        if (enabled || disabled) {
          fc.failOnHeadKThresholdBreach = enabled;
          meta.overridesApplied.gateOn = (prev.gateOn !== enabled);
        } else {
          meta.warnings.push(`POSTMAN_HEADK_GATE_ON 非法（${envGateRaw}），忽略覆盖`);
        }
      }
      if (Object.values(meta.overridesApplied).some(Boolean)) meta.source = 'env';
      return { cfg, meta };
    } catch (e) {
      console.warn('[newman] 应用环境变量覆盖失败聚类配置失败：', e && e.message ? e.message : e);
      return { cfg, meta };
    }
  }

  /**
   * 函数级注释：loadReportingConfig
   * - 读取摘要/报告相关配置（scripts/newman-config.json）。
   * - 若文件不存在或解析失败，返回默认配置：
   *   { failureClusters: { topN: 10, examplesPerCluster: 3 } }
   * - 返回结构：{ configPath, config, meta }
   */
  function loadReportingConfig() {
    const cfgPath = path.resolve(process.cwd(), 'scripts', 'newman-config.json');
    const defaults = {
      failureClusters: {
        topN: 10,
        headK: 3,
        // 头部K类累计占比阈值（百分比），用于门禁
        headKThresholdPercent: 70,
        // 当累计占比 ≥ 阈值时，是否触发失败（退出码 3；若存在断言失败则仍以 1 优先）
        failOnHeadKThresholdBreach: false,
        examplesPerCluster: 3,
        normalizeMessages: true,
        normalization: {
          stripUUID: true,
          stripHex: true,
          stripNumbersLong: true,
          stripISODateTime: true,
          // 以下为可选扩展规则，默认关闭（避免过度匹配）：
          stripEmail: false,
          stripIPv4: false,
          stripIPv6: false,
          stripPhone: false,
          stripURLQueryValues: false,
        },
      },
    };
    try {
      if (fs.existsSync(cfgPath)) {
        const raw = fs.readFileSync(cfgPath, 'utf8');
        const cfg = JSON.parse(raw);
        const merged = { ...defaults, ...cfg };
        const { cfg: overridden, meta } = applyFailureClusterEnvOverrides(merged);
        return { configPath: cfgPath, config: overridden, meta };
      }
    } catch (e) {
      console.warn('[newman] 读取报告配置失败:', e.message);
    }
    const { cfg: overridden, meta } = applyFailureClusterEnvOverrides(defaults);
    return { configPath: null, config: overridden, meta };
  }

  /**
   * 函数级注释：normalizeFailureMessage
   * - 将断言失败消息中的不稳定标记归一化（脱敏），提升聚类效果：
   *   1) UUID（xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx）替换为 <UUID>
   *   2) 32~40 位十六进制串替换为 <HEX>
   *   3) 6 位及以上的纯数字替换为 <NUM>
   *   4) ISO8601 时间戳（YYYY-MM-DDTHH:mm:ss(.sss)Z）替换为 <TIMESTAMP>
   * - 可通过 reporting.failureClusters.normalization 开关控制各规则。
   * @param {string} msg 原始失败消息
   * @param {object} normCfg 归一化配置（{ stripUUID, stripHex, stripNumbersLong, stripISODateTime }）
   * @returns {string} 归一化后的消息
   */
  function normalizeFailureMessage(msg, normCfg = {}) {
    if (!msg || typeof msg !== 'string') return msg;
    let out = msg;
    try {
      // 1) 标识符类（UUID/HEX）
      if (normCfg.stripUUID) {
        out = out.replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '<UUID>');
      }
      if (normCfg.stripHex) {
        out = out.replace(/\b[0-9a-fA-F]{32,40}\b/g, '<HEX>');
      }
      // 2) 日期/时间戳
      if (normCfg.stripNumbersLong) {
        out = out.replace(/\b\d{6,}\b/g, '<NUM>');
      }
      if (normCfg.stripISODateTime) {
        out = out.replace(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\b/g, '<TIMESTAMP>');
      }
      // 3) 网络标识与联系方式（可选）
      if (normCfg.stripEmail) {
        out = out.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '<EMAIL>');
      }
      if (normCfg.stripIPv4) {
        out = out.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '<IPV4>');
      }
      if (normCfg.stripIPv6) {
        out = out.replace(/\b(?:[0-9A-Fa-f]{1,4}:){2,7}[0-9A-Fa-f]{1,4}\b/g, '<IPV6>');
      }
      if (normCfg.stripPhone) {
        // 粗略匹配常见电话格式（国际区号可选），避免过度匹配请谨慎启用
        out = out.replace(/\b(?:\+?\d{1,3}[-\s]?)?(?:\d{3}[-\s]?){2}\d{4}\b/g, '<PHONE>');
      }
      if (normCfg.stripURLQueryValues) {
        // 将 URL 查询参数的值统一替换为 <VAL>，保留键名，示例：http://x?a=1&b=2 => a=<VAL>&b=<VAL>
        out = out.replace(/([?&])([^=&]+)=([^&#]*)/g, (m, sep, key) => `${sep}${key}=<VAL>`);
      }
    } catch (e) {
      // 归一化失败不影响流程，回退原消息
      return msg;
    }
    return out;
  }

  /**
   * 函数级注释：evaluateResponseTimeBudget
   * - 对单个维度（global/folder/method/path）的响应时间分位数进行预算检查；
   * - actual: { p50, p90, p95, p99 }，thresholds: 同名键的上限值；
   * - 返回 breaches 数组，包含超标的分位点及实际/阈值。
   */
  function evaluateResponseTimeBudget(actual, thresholds) {
    if (!actual || !thresholds) return [];
    const points = ['p50', 'p90', 'p95', 'p99'];
    const breaches = [];
    for (const p of points) {
      if (thresholds[p] != null && actual[p] != null && actual[p] > thresholds[p]) {
        breaches.push({ point: p, actual: actual[p], threshold: thresholds[p] });
      }
    }
    return breaches;
  }

  /**
   * 函数级注释：collectBudgetBreaches
   * - 汇总 global/folder/method/path 四类维度的预算超标情况；
   * - 输入：globalPercentiles、folderAggregates、methodAggregates、pathAggregates 以及预算配置；
   * - 输出：breaches 列表，用于写入摘要与工作流 Step Summary。
   */
  function collectBudgetBreaches(globalPercentiles, folderAggregates, methodAggregates, pathAggregates, budgetCfg) {
    const breaches = [];
    // global
    const globalThresholds = budgetCfg?.global?.responseTime;
    if (globalThresholds) {
      const b = evaluateResponseTimeBudget(globalPercentiles, globalThresholds);
      for (const it of b) {
        breaches.push({ scope: 'global', key: 'responseTime', ...it });
      }
    }
    // folders
    const folderCfgs = budgetCfg?.folders || {};
    for (const [fname, agg] of Object.entries(folderAggregates || {})) {
      const thresholds = folderCfgs?.[fname]?.responseTime;
      if (thresholds) {
        const b = evaluateResponseTimeBudget(agg?.responseTime, thresholds);
        for (const it of b) {
          breaches.push({ scope: 'folder', key: fname, ...it });
        }
      }
    }
    // methods
    const methodCfgs = budgetCfg?.methods || {};
    for (const [m, agg] of Object.entries(methodAggregates || {})) {
      const thresholds = methodCfgs?.[m]?.responseTime;
      if (thresholds) {
        const b = evaluateResponseTimeBudget(agg?.responseTime, thresholds);
        for (const it of b) {
          breaches.push({ scope: 'method', key: m, ...it });
        }
      }
    }
    // paths
    const pathCfgs = budgetCfg?.paths || {};
    for (const [pfx, agg] of Object.entries(pathAggregates || {})) {
      const thresholds = pathCfgs?.[pfx]?.responseTime;
      if (thresholds) {
        const b = evaluateResponseTimeBudget(agg?.responseTime, thresholds);
        for (const it of b) {
          breaches.push({ scope: 'path', key: pfx, ...it });
        }
      }
    }
    return breaches;
  }
  function finalizeBuckets(obj) {
    const out = {};
    for (const [key, bucket] of Object.entries(obj)) {
      const timesSorted = bucket.responseTimes.slice().sort((a, b) => a - b);
      const min = timesSorted.length ? timesSorted[0] : null;
      const max = timesSorted.length ? timesSorted[timesSorted.length - 1] : null;
      const avg = timesSorted.length
        ? Math.round(timesSorted.reduce((sum, t) => sum + t, 0) / timesSorted.length)
        : null;
      out[key] = {
        requests: bucket.requests,
        assertionsTotal: bucket.assertionsTotal,
        assertionsFailed: bucket.assertionsFailed,
        statusCodes: bucket.statusCodes,
        responseTime: {
          min, max, avg,
          p50: percentile(timesSorted, 50),
          p90: percentile(timesSorted, 90),
          p95: percentile(timesSorted, 95),
          p99: percentile(timesSorted, 99),
        },
      };
    }
    return out;
  }
  const methodAggregates = finalizeBuckets(methodStats);
  const pathAggregates = finalizeBuckets(pathStats);

  // 读取性能预算并执行检查
  const { configPath: budgetConfigPath, config: budgetConfig } = loadPerformanceBudgets();
  const budgetBreaches = collectBudgetBreaches(
    responseTimePercentiles,
    folderAggregates,
    methodAggregates,
    pathAggregates,
    budgetConfig
  );

  const payload = {
    collection: collectionName,
    timestamp: new Date().toISOString(),
    stats: {
      failureCount: failures.length,
      requestsTotal: stats?.requests?.total ?? null,
      assertionsTotal: stats?.assertions?.total ?? null,
      assertionsFailed: stats?.assertions?.failed ?? failures.length ?? null,
    },
    failures: failures.map((f) => ({
      name: f?.error?.name ?? null,
      message: f?.error?.message ?? (f?.error ? String(f.error) : null),
      test: f?.error?.test ?? null,
      at: f?.at ?? null,
      source: {
        item: f?.source?.name ?? null,
        type: f?.source?.type ?? null,
        id: f?.source?.id ?? null,
        path: (f?.source?.id && idToPath[f.source.id]?.path)
          ? idToPath[f.source.id].path.join('/')
          : null,
      },
    })),
    distributions: {
      statusCodes,
    },
    topSlowRequests,
    responseTimePercentiles,
    folderAggregates,
    methodAggregates,
    pathAggregates,
    // 失败断言聚类（按文件夹路径 + 断言名称聚合），便于在 Step Summary 中快速识别高频失败原因
    failureClusters: (() => {
      /**
       * 函数级注释：buildFailureClusters
       * - 基于 run.failures 将失败断言按“文件夹路径 + 断言名（或错误名）”聚合；
       * - 输出每个聚类的计数、占比（share）与示例（示例条数可配置：examplesPerCluster），辅助定位高频失败来源；
       * @param {Array} fails newman 失败列表
       * @param {number} examplesPerCluster 每个聚类示例消息条数上限
       * @param {object} msgNormCfg 失败消息归一化配置
       */
      function buildFailureClusters(fails, examplesPerCluster = 3, msgNormCfg = {}) {
        const map = {};
        for (const f of (fails || [])) {
          const folderArr = (f?.source?.id && idToPath[f.source.id]?.path) ? idToPath[f.source.id].path : [];
          const folderKey = folderArr.length ? folderArr.join('/') : '(root)';
          const assertName = f?.error?.test || f?.error?.name || 'unknown-assert';
          const key = `${folderKey}::${assertName}`;
          if (!map[key]) {
            map[key] = { folder: folderKey, assertion: assertName, count: 0, examples: [] };
          }
          map[key].count += 1;
          let msg = f?.error?.message ? String(f.error.message).replace(/\n/g, ' ') : null;
          // 可选的消息归一化（脱敏）以提升聚类效果
          if (msg && msgNormCfg) {
            msg = normalizeFailureMessage(msg, msgNormCfg);
          }
          if (msg && map[key].examples.length < examplesPerCluster) {
            map[key].examples.push(msg);
          }
        }
        return Object.values(map).sort((a, b) => b.count - a.count);
      }
      const { config: reportingConfig } = loadReportingConfig();
      const epc = reportingConfig?.failureClusters?.examplesPerCluster ?? 3;
      const normCfg = (reportingConfig?.failureClusters?.normalizeMessages)
        ? (reportingConfig?.failureClusters?.normalization || {})
        : {};
      const clusters = buildFailureClusters(failures, epc, normCfg);
      // 计算占比（share）并构建 meta 信息
      const total = failures.length || 0;
      let clusteredCount = 0;
      for (const c of clusters) {
        clusteredCount += c.count;
        c.share = total ? Math.round((c.count / total) * 1000) / 10 : 0; // 保留 1 位小数
      }
      const coverage = total ? Math.round((clusteredCount / total) * 1000) / 10 : 0;
      // 将 meta 写入闭包作用域供下方 payload 使用
      writeNewmanSummary.__failureClustersMeta = { totalFailures: total, clusterCount: clusters.length, clusteredFailuresCount: clusteredCount, coveragePercent: coverage };
      return clusters;
    })(),
    budgets: {
      configPath: budgetConfigPath,
      config: budgetConfig,
    },
    reporting: (() => {
      const { configPath: reportingConfigPath, config: reportingConfig, meta: reportingMeta } = loadReportingConfig();
      return { configPath: reportingConfigPath, config: reportingConfig, meta: reportingMeta };
    })(),
    budgetBreaches,
    // 失败聚类元信息（覆盖率等）
    failureClustersMeta: (writeNewmanSummary.__failureClustersMeta || { totalFailures: failures.length || 0, clusterCount: 0, clusteredFailuresCount: 0, coveragePercent: 0 }),
    reports: {
      junit: junitOutput,
      html: htmlOutput,
    },
  };

  const abs = path.resolve(outputPath);
  fs.writeFileSync(abs, JSON.stringify(payload, null, 2), 'utf8');
  return abs;
}

module.exports = { runNewman, writeNewmanSummary };

// 若作为可执行脚本运行，则使用默认集合与默认参数
if (require.main === module) {
  (async () => {
    try {
      // 确保报表目录存在
      const reportsDir = path.resolve(process.cwd(), 'reports');
      fs.mkdirSync(reportsDir, { recursive: true });

      // 默认参数
      const collectionPath = path.resolve(
        process.cwd(),
        'docs/09-API文档/client-kits/postman_collection.json'
      );
      const junitOutput = path.join(reportsDir, 'newman-results.xml');
      // 是否启用 HTML 报表（htmlextra），需确保已安装 newman-reporter-htmlextra
      const enableHtml = String(process.env.POSTMAN_ENABLE_HTML_REPORT || '0') === '1';
      const htmlFileName = process.env.POSTMAN_HTML_REPORT_FILE || 'newman-report.html';
      const htmlOutput = path.join(reportsDir, htmlFileName);
      const summaryOutput = path.join(reportsDir, 'newman-summary.json');
      const envVars = {
        baseUrl: process.env.POSTMAN_BASE_URL || 'http://localhost:8080',
      };

      // 执行集合
      const reporters = ['cli', 'junit'];
      if (enableHtml) reporters.push('htmlextra');
      const summary = await runNewman({
        collection: collectionPath,
        envVars,
        reporters,
        junitOutput,
        htmlOutput: enableHtml ? htmlOutput : null,
        rejectOnFailures: false,
      });
      // 生成 JSON 摘要，供工作流的 Step Summary 使用
      writeNewmanSummary(summary, {
        outputPath: summaryOutput,
        junitOutput,
        htmlOutput: enableHtml ? htmlOutput : null,
      });
      // 性能预算 gating：若配置开启且存在超标，返回特定退出码
      try {
        const s = JSON.parse(fs.readFileSync(summaryOutput, 'utf8'));
        const breaches = Array.isArray(s.budgetBreaches) ? s.budgetBreaches : [];
        const failOnBudget = !!(s?.budgets?.config?.failOnBudgetBreach);
        if (breaches.length > 0 && failOnBudget) {
          console.error(`⚠️ 性能预算超标：${breaches.length} 项，请检查 Step Summary 中的“性能预算检查”段落`);
          // 若存在断言失败，优先返回 1；否则对预算超标返回 2
          const failureCount = (summary.run?.failures || []).length;
          if (failureCount > 0) {
            process.exit(1);
          } else {
            process.exit(2);
          }
        }
        // 失败聚类集中度（头部K类累计占比）gating：当开启且达到阈值时退出码 3
        try {
          const cfg = s?.reporting?.config?.failureClusters || {};
          const k = Number(cfg.headK || 3) || 3;
          const threshold = Number(cfg.headKThresholdPercent || 70) || 70;
          const enabled = !!cfg.failOnHeadKThresholdBreach;
          const clusters = Array.isArray(s.failureClusters) ? s.failureClusters : [];
          if (enabled && clusters.length > 0) {
            const headShareSum = clusters
              .slice(0, Math.min(k, clusters.length))
              .reduce((sum, c) => sum + (typeof c.share === 'number' ? c.share : 0), 0);
            const rounded = Math.round(headShareSum * 10) / 10;
            if (rounded >= threshold) {
              console.error(`⚠️ 失败聚类集中度超标：头部${Math.min(k, clusters.length)}类累计占比 ${rounded}% ≥ 阈值 ${threshold}%`);
              const failureCount = (summary.run?.failures || []).length;
              if (failureCount > 0) {
                // 若存在断言失败，仍以断言失败优先
                process.exit(1);
              } else {
                process.exit(3);
              }
            }
          }
        } catch (e2) {
          console.warn('[newman] 评估失败聚类集中度 gating 失败：', e2 && e2.message ? e2.message : e2);
        }
      } catch (e) {
        console.warn('[newman] 读取摘要并评估预算 gating 失败：', e && e.message ? e.message : e);
      }
      const failureCount = (summary.run?.failures || []).length;
      if (failureCount > 0) {
        console.error(`❌ newman 执行完成但存在断言失败：${failureCount}`);
        process.exit(1);
      } else {
        console.log('✅ newman 执行通过');
        process.exit(0);
      }
    } catch (e) {
      console.error('❌ newman 执行失败：', e && e.message ? e.message : e);
      process.exit(1);
    }
  })();
}
