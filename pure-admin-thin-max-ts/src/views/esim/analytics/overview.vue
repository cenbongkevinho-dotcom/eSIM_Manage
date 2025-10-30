<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import echarts from "@/plugins/echarts";
import {
  listActivationCodes,
  listSubscriptions,
  listInvoices,
  type ActivationCode,
  type Subscription
} from "@/api/esim";

defineOptions({ name: "AnalyticsOverview" });

/**
 * 获取国际化 t 函数。
 * 用于页面标题、卡片文案与图表标题的多语言化。
 */
const { t } = useI18n();

// 加载状态与错误展示
const loading = ref(false);
const errorMsg = ref<string | null>(null);

// 原始数据与聚合统计
const codes = ref<ActivationCode[]>([]);
const subs = ref<Subscription[]>([]);
const invoices = ref<any[]>([]);

// 汇总计数（展示在卡片中）
const countActivationCodes = ref(0);
const countSubscriptions = ref(0);
const countInvoices = ref(0);
const countUnusedCodes = ref(0);
const countUsedCodes = ref(0);
const countExpiredCodes = ref(0);
const countActiveSubs = ref(0);
const countInactiveSubs = ref(0);
const countCancelledSubs = ref(0);

// 图表容器引用与实例
const lineMonthlyRef = ref<HTMLDivElement | null>(null);
const barOperatorsRef = ref<HTMLDivElement | null>(null);
let lineMonthlyChart: any = null;
let barOperatorsChart: any = null;

// --------------------------
// 筛选器相关状态
// --------------------------
/**
 * 运营商筛选（默认全部）。
 */
const operatorFilter = ref<string>("all");
/**
 * 订阅状态筛选（默认全部）。
 * 可选：active/inactive/cancelled。
 */
const statusFilter = ref<string>("all");
/**
 * 激活碼狀態篩選（默認全部）。
 * 可選：unused/used/expired。
 */
const codeStatusFilter = ref<string>("all");
/**
 * 分组维度（日/周/月），用于折线图的聚合维度。
 */
const groupBy = ref<"day" | "week" | "month">("month");
/**
 * 时间范围预设（近7天/30天/90天/自定义）。
 */
const datePreset = ref<"7d" | "30d" | "90d" | "custom">("30d");
/**
 * 自定义时间范围，只有当 datePreset === "custom" 时生效。
 */
const dateRange = ref<[Date, Date] | null>(null);

/**
 * 卡片统计范围切换。
 * - overall: 显示所有数据的总览统计
 * - filtered: 按当前筛选器（运营商/时间范围/状态）进行统计
 */
const cardsScope = ref<"overall" | "filtered">("overall");
/**
 * 从订阅数据中提取可用的运营商列表（去重）。
 */
const availableOperators = computed<string[]>(() => {
  const set = new Set<string>();
  for (const s of subs.value) {
    if (s.operatorId) set.add(s.operatorId);
  }
  return Array.from(set).sort();
});

/**
 * 基于筛选器过滤后的激活码数据。
 * 说明：沿用订阅的运营商与时间范围筛选；激活码状态暂不与订阅状态联动。
 */
const filteredCodes = computed<ActivationCode[]>(() => {
  let range: [Date, Date] | null = null;
  if (datePreset.value === "custom" && dateRange.value) {
    range = dateRange.value;
  } else {
    const [s, e] = getDateRangeFromPreset(
      datePreset.value === "custom" ? "30d" : datePreset.value
    );
    range = [s, e];
  }

  return codes.value.filter(c => {
    if (operatorFilter.value !== "all") {
      if ((c.operatorId || "") !== operatorFilter.value) return false;
    }
    if (range) {
      if (!isWithinRange(c.createdAt, range)) return false;
    }
    // 激活碼狀態篩選
    if (codeStatusFilter.value !== "all") {
      if ((c.status || "") !== codeStatusFilter.value) return false;
    }
    return true;
  });
});

/**
 * 基于筛选器过滤后的发票数据。
 * 说明：若发票对象包含 createdAt 字段，则应用时间范围筛选；否则不筛选。
 */
const filteredInvoices = computed<any[]>(() => {
  let range: [Date, Date] | null = null;
  if (datePreset.value === "custom" && dateRange.value) {
    range = dateRange.value;
  } else {
    const [s, e] = getDateRangeFromPreset(
      datePreset.value === "custom" ? "30d" : datePreset.value
    );
    range = [s, e];
  }
  if (!range) return invoices.value;
  return invoices.value.filter((inv: any) => {
    const created = inv?.createdAt as string | undefined;
    if (!created) return true; // 没有时间字段则视为通过
    return isWithinRange(created, range);
  });
});

/**
 * 根据预设值计算时间范围。
 * @param preset 预设标识（7d/30d/90d）
 * @returns [开始日期, 结束日期]
 */
function getDateRangeFromPreset(preset: "7d" | "30d" | "90d"): [Date, Date] {
  const end = new Date();
  const start = new Date();
  const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
  start.setDate(end.getDate() - (days - 1));
  // 统一到当天 00:00:00 与 23:59:59 以确保包含整天
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return [start, end];
}

/**
 * 判断一个日期字符串是否在给定范围内。
 * @param dateStr 订阅的创建时间字符串（期望可被 new Date 解析）
 * @param range 时间范围 [start, end]
 * @returns 布尔值
 */
function isWithinRange(
  dateStr: string | undefined,
  range: [Date, Date]
): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d >= range[0] && d <= range[1];
}

/**
 * 计算 ISO 周序号（YYYY-WW）。
 * @param date 目标日期
 * @returns 形如 2025-42 的字符串（第42周）
 */
function getIsoWeek(date: Date): string {
  // 复制日期，避免修改原对象
  const tmp = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  // 设为周四，以确保周数计算符合 ISO 规范
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  const year = tmp.getUTCFullYear();
  return `${year}-${String(weekNo).padStart(2, "0")}`;
}

/**
 * 基于筛选器计算后的订阅数据。
 * - 运营商筛选（operatorFilter）
 * - 状态筛选（statusFilter）
 * - 时间范围（datePreset 或 dateRange）
 */
const filteredSubs = computed<Subscription[]>(() => {
  // 计算当前有效的时间范围
  let range: [Date, Date] | null = null;
  if (datePreset.value === "custom" && dateRange.value) {
    range = dateRange.value;
  } else {
    const [s, e] = getDateRangeFromPreset(
      datePreset.value === "custom" ? "30d" : datePreset.value
    );
    range = [s, e];
  }

  return subs.value.filter(s => {
    // 运营商筛选
    if (operatorFilter.value !== "all") {
      if ((s.operatorId || "") !== operatorFilter.value) return false;
    }
    // 状态筛选
    if (statusFilter.value !== "all") {
      if ((s.status || "") !== statusFilter.value) return false;
    }
    // 时间范围筛选（基于 createdAt）
    if (range) {
      if (!isWithinRange(s.createdAt, range)) return false;
    }
    return true;
  });
});

/**
 * 拉取并聚合数据。
 * 说明：
 * - 并行请求激活码、订阅与发票列表；
 * - 计算各类状态计数；
 * - 准备图表所需的数据结构。
 */
async function fetchAndAggregate() {
  loading.value = true;
  errorMsg.value = null;
  try {
    const [codeList, subList, invoiceList] = await Promise.all([
      listActivationCodes(),
      listSubscriptions(),
      listInvoices()
    ]);

    codes.value = Array.isArray(codeList) ? codeList : [];
    subs.value = Array.isArray(subList) ? subList : [];
    invoices.value = Array.isArray(invoiceList) ? invoiceList : [];

    // 汇总计数
    countActivationCodes.value = codes.value.length;
    countSubscriptions.value = subs.value.length;
    countInvoices.value = invoices.value.length;

    countUnusedCodes.value = codes.value.filter(
      c => c.status === "unused"
    ).length;
    countUsedCodes.value = codes.value.filter(c => c.status === "used").length;
    countExpiredCodes.value = codes.value.filter(
      c => c.status === "expired"
    ).length;

    countActiveSubs.value = subs.value.filter(
      s => s.status === "active"
    ).length;
    countInactiveSubs.value = subs.value.filter(
      s => s.status === "inactive"
    ).length;
    countCancelledSubs.value = subs.value.filter(
      s => s.status === "cancelled"
    ).length;

    // 更新图表（使用筛选后的数据）
    updateMonthlyNewSubscriptionsChart();
    updateOperatorsTopChart();
  } catch (e: any) {
    errorMsg.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

/**
 * 构建“每月新增订阅”图表数据并渲染折线图。
 * 说明：
 * - 以 Subscription.createdAt 按月（YYYY-MM）分组统计数量；
 * - X 轴为月份，Y 轴为新增数量；
 * - 使用 ECharts 折线图进行展示。
 */
function updateMonthlyNewSubscriptionsChart() {
  /**
   * 根据分组维度构建 X 轴刻度与 Y 轴聚合值。
   * - day: YYYY-MM-DD
   * - week: YYYY-WW (ISO 周)
   * - month: YYYY-MM
   */
  const map: Record<string, number> = {};
  for (const s of filteredSubs.value) {
    const created = s.createdAt ? new Date(s.createdAt) : null;
    if (!created || Number.isNaN(created.getTime())) continue;
    let key = "";
    if (groupBy.value === "day") {
      // YYYY-MM-DD
      const y = created.getFullYear();
      const m = String(created.getMonth() + 1).padStart(2, "0");
      const d = String(created.getDate()).padStart(2, "0");
      key = `${y}-${m}-${d}`;
    } else if (groupBy.value === "week") {
      key = getIsoWeek(created); // YYYY-WW
    } else {
      // 默认 month：YYYY-MM
      const y = created.getFullYear();
      const m = String(created.getMonth() + 1).padStart(2, "0");
      key = `${y}-${m}`;
    }
    map[key] = (map[key] || 0) + 1;
  }

  const x = Object.keys(map).sort();
  const y = x.map(k => map[k]);

  // 缓存序列数据以便导出 CSV
  monthlySeriesX.value = x;
  monthlySeriesY.value = y;

  const option = {
    title: {
      text: t("views.analytics.overview.chart.monthlyNewSubscriptions")
    },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: x },
    yAxis: { type: "value" },
    series: [{ type: "line", data: y, smooth: true }],
    // 无数据占位
    graphic:
      x.length === 0
        ? [
            {
              type: "text",
              left: "center",
              top: "middle",
              style: {
                text: t("views.analytics.overview.chart.noData"),
                fill: "#999",
                fontSize: 14
              }
            }
          ]
        : []
  };

  if (!lineMonthlyChart && lineMonthlyRef.value) {
    lineMonthlyChart = echarts.init(lineMonthlyRef.value);
  }
  if (lineMonthlyChart) {
    lineMonthlyChart.setOption(option);
  }
}

/**
 * 构建“运营商订阅数量Top5”图表数据并渲染柱状图。
 * 说明：
 * - 以 Subscription.operatorId 分组统计数量；
 * - 取数量最高的前五个运营商进行展示；
 * - 使用 ECharts 柱状图进行展示。
 */
function updateOperatorsTopChart() {
  const map: Record<string, number> = {};
  for (const s of filteredSubs.value) {
    const op = s.operatorId || "unknown";
    map[op] = (map[op] || 0) + 1;
  }
  const items = Object.entries(map)
    .map(([k, v]) => ({ k, v }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 5);

  const ops = items.map(i => i.k);
  const values = items.map(i => i.v);

  // 缓存序列数据以便导出 CSV
  operatorsSeriesX.value = ops;
  operatorsSeriesY.value = values;

  const option = {
    title: { text: t("views.analytics.overview.chart.operatorsTop") },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ops },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: values }],
    graphic:
      ops.length === 0
        ? [
            {
              type: "text",
              left: "center",
              top: "middle",
              style: {
                text: t("views.analytics.overview.chart.noData"),
                fill: "#999",
                fontSize: 14
              }
            }
          ]
        : []
  };

  if (!barOperatorsChart && barOperatorsRef.value) {
    barOperatorsChart = echarts.init(barOperatorsRef.value);
  }
  if (barOperatorsChart) {
    barOperatorsChart.setOption(option);
  }
}

/**
 * 初始化图表实例。
 * 说明：
 * - 在组件挂载后创建 ECharts 实例；
 * - 初始渲染时若无数据，将显示空图；后续数据更新会调用 setOption。
 */
function initCharts() {
  if (lineMonthlyRef.value && !lineMonthlyChart) {
    lineMonthlyChart = echarts.init(lineMonthlyRef.value);
  }
  if (barOperatorsRef.value && !barOperatorsChart) {
    barOperatorsChart = echarts.init(barOperatorsRef.value);
  }
}

onMounted(() => {
  initCharts();
  fetchAndAggregate();
  // 加载本地持久化筛选器
  loadFiltersFromLocal();
});

// 联动更新图表：当基础数据或筛选器变化时
watch(
  [
    subs,
    operatorFilter,
    statusFilter,
    codeStatusFilter,
    groupBy,
    datePreset,
    dateRange
  ],
  () => {
    updateMonthlyNewSubscriptionsChart();
    updateOperatorsTopChart();
    // 持久化当前筛选器
    saveFiltersToLocal();
  }
);

/**
 * 手动刷新入口。
 * 用于用户点击“刷新数据”按钮重新拉取并聚合数据。
 */
function onRefresh() {
  fetchAndAggregate();
}

/**
 * 应用筛选器（与 watch 联动一致，这里提供显式入口）。
 */
function onApplyFilters() {
  updateMonthlyNewSubscriptionsChart();
  updateOperatorsTopChart();
}

/**
 * 重置筛选器为默认值。
 */
function onResetFilters() {
  operatorFilter.value = "all";
  statusFilter.value = "all";
  codeStatusFilter.value = "all";
  groupBy.value = "month";
  datePreset.value = "30d";
  dateRange.value = null;
  onApplyFilters();
}

// --------------------------
// 卡片显示的计算（支持总览/按筛选）
// --------------------------
/**
 * 计算卡片显示的激活码总数
 */
const cActivationCodesTotal = computed(() =>
  cardsScope.value === "overall"
    ? codes.value.length
    : filteredCodes.value.length
);
/**
 * 计算卡片显示的激活码状态统计
 */
const cUnusedCodes = computed(
  () =>
    (cardsScope.value === "overall" ? codes.value : filteredCodes.value).filter(
      c => c.status === "unused"
    ).length
);
const cUsedCodes = computed(
  () =>
    (cardsScope.value === "overall" ? codes.value : filteredCodes.value).filter(
      c => c.status === "used"
    ).length
);
const cExpiredCodes = computed(
  () =>
    (cardsScope.value === "overall" ? codes.value : filteredCodes.value).filter(
      c => c.status === "expired"
    ).length
);

/**
 * 计算卡片显示的订阅总数与状态统计
 */
const cSubscriptionsTotal = computed(() =>
  cardsScope.value === "overall" ? subs.value.length : filteredSubs.value.length
);
const cActiveSubs = computed(
  () =>
    (cardsScope.value === "overall" ? subs.value : filteredSubs.value).filter(
      s => s.status === "active"
    ).length
);
const cInactiveSubs = computed(
  () =>
    (cardsScope.value === "overall" ? subs.value : filteredSubs.value).filter(
      s => s.status === "inactive"
    ).length
);
const cCancelledSubs = computed(
  () =>
    (cardsScope.value === "overall" ? subs.value : filteredSubs.value).filter(
      s => s.status === "cancelled"
    ).length
);

/**
 * 计算卡片显示的发票总数
 */
const cInvoicesTotal = computed(() =>
  cardsScope.value === "overall"
    ? invoices.value.length
    : filteredInvoices.value.length
);

// --------------------------
// 导出 CSV 功能
// --------------------------
// 序列缓存（由图表更新时写入）
const monthlySeriesX = ref<string[]>([]);
const monthlySeriesY = ref<number[]>([]);
const operatorsSeriesX = ref<string[]>([]);
const operatorsSeriesY = ref<number[]>([]);

/**
 * 将二维数组导出为 CSV 文件并触发下载。
 * @param rows 二维数组，每一项代表一行
 * @param filename 下载文件名（包含 .csv）
 */
function exportCsv(rows: Array<Array<string | number>>, filename: string) {
  const header = "\ufeff"; // 加 BOM 以便 Excel 正确识别 UTF-8
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([header + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 导出“新增订阅”折线图数据为 CSV。
 * 第一列：分组维度（日/周/月）；第二列：新增数量。
 */
function onExportMonthlyCsv() {
  const groupLabel =
    groupBy.value === "day"
      ? t("views.analytics.overview.filters.group.day")
      : groupBy.value === "week"
        ? t("views.analytics.overview.filters.group.week")
        : t("views.analytics.overview.filters.group.month");
  const rows: Array<Array<string | number>> = [
    [groupLabel, t("common.columns.number") || "Count"]
  ];
  for (let i = 0; i < monthlySeriesX.value.length; i++) {
    rows.push([monthlySeriesX.value[i], monthlySeriesY.value[i]]);
  }
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  exportCsv(rows, `monthly-new-subscriptions-${ts}.csv`);
}

/**
 * 导出“运营商 Top5”柱状图数据为 CSV。
 * 第一列：运营商；第二列：订阅数量。
 */
function onExportOperatorsCsv() {
  const rows: Array<Array<string | number>> = [
    [
      t("views.analytics.overview.filters.operator"),
      t("common.columns.number") || "Count"
    ]
  ];
  for (let i = 0; i < operatorsSeriesX.value.length; i++) {
    rows.push([operatorsSeriesX.value[i], operatorsSeriesY.value[i]]);
  }
  const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  exportCsv(rows, `operators-top5-${ts}.csv`);
}

// --------------------------
// 本地持久化筛选器
// --------------------------
const LOCAL_KEY = "analyticsOverview.filters";
/**
 * 将当前筛选器保存到 localStorage。
 */
function saveFiltersToLocal() {
  try {
    const payload = {
      operatorFilter: operatorFilter.value,
      statusFilter: statusFilter.value,
      codeStatusFilter: codeStatusFilter.value,
      groupBy: groupBy.value,
      datePreset: datePreset.value,
      dateRange:
        datePreset.value === "custom" && dateRange.value
          ? [dateRange.value[0].toISOString(), dateRange.value[1].toISOString()]
          : null,
      cardsScope: cardsScope.value
    };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
  } catch (err) {
    // 忽略本地存储错误
  }
}

/**
 * 从 localStorage 加载筛选器。
 */
function loadFiltersFromLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return;
    const payload = JSON.parse(raw);
    if (typeof payload?.operatorFilter === "string")
      operatorFilter.value = payload.operatorFilter;
    if (typeof payload?.statusFilter === "string")
      statusFilter.value = payload.statusFilter;
    if (typeof payload?.codeStatusFilter === "string")
      codeStatusFilter.value = payload.codeStatusFilter;
    if (["day", "week", "month"].includes(payload?.groupBy))
      groupBy.value = payload.groupBy;
    if (["7d", "30d", "90d", "custom"].includes(payload?.datePreset))
      datePreset.value = payload.datePreset;
    if (
      payload?.dateRange &&
      Array.isArray(payload.dateRange) &&
      payload.dateRange.length === 2
    ) {
      const s = new Date(payload.dateRange[0]);
      const e = new Date(payload.dateRange[1]);
      if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime())) {
        dateRange.value = [s, e];
      }
    }
    if (["overall", "filtered"].includes(payload?.cardsScope))
      cardsScope.value = payload.cardsScope;
  } catch (err) {
    // 忽略本地存储错误
  }
}
</script>

<template>
  <div>
    <h2>{{ t("views.analytics.overview.title") }}</h2>

    <!-- 筛选器区域 -->
    <div class="filters">
      <el-card class="filter-card">
        <div class="filter-grid">
          <div class="filter-item">
            <div class="filter-label">
              {{ t("views.analytics.overview.filters.operator") }}
            </div>
            <el-select
              v-model="operatorFilter"
              size="small"
              style="width: 180px"
              data-testid="filters-operator"
            >
              <el-option
                :label="t('views.analytics.overview.filters.allOperators')"
                value="all"
              />
              <el-option
                v-for="op in availableOperators"
                :key="op"
                :label="op"
                :value="op"
              />
            </el-select>
          </div>

          <div class="filter-item">
            <div class="filter-label">
              {{ t("views.analytics.overview.filters.status") }}
            </div>
            <el-select
              v-model="statusFilter"
              size="small"
              style="width: 160px"
              data-testid="filters-status"
            >
              <el-option
                :label="t('views.analytics.overview.filters.allStatus')"
                value="all"
              />
              <el-option
                :label="t('views.analytics.overview.cards.active')"
                value="active"
              />
              <el-option
                :label="t('views.analytics.overview.cards.inactive')"
                value="inactive"
              />
              <el-option
                :label="t('views.analytics.overview.cards.cancelled')"
                value="cancelled"
              />
            </el-select>
          </div>

          <div class="filter-item">
            <div class="filter-label">
              {{ t("views.analytics.overview.filters.codeStatus") }}
            </div>
            <el-select
              v-model="codeStatusFilter"
              size="small"
              style="width: 160px"
              data-testid="filters-codeStatus"
            >
              <el-option
                :label="t('views.analytics.overview.filters.allStatus')"
                value="all"
              />
              <el-option
                :label="t('views.analytics.overview.cards.unused')"
                value="unused"
              />
              <el-option
                :label="t('views.analytics.overview.cards.used')"
                value="used"
              />
              <el-option
                :label="t('views.analytics.overview.cards.expired')"
                value="expired"
              />
            </el-select>
          </div>

          <div class="filter-item">
            <div class="filter-label">
              {{ t("views.analytics.overview.filters.timeRange") }}
            </div>
            <el-select
              v-model="datePreset"
              size="small"
              style="width: 160px"
              data-testid="filters-datePreset"
            >
              <el-option
                :label="t('views.analytics.overview.filters.quick.last7Days')"
                value="7d"
              />
              <el-option
                :label="t('views.analytics.overview.filters.quick.last30Days')"
                value="30d"
              />
              <el-option
                :label="t('views.analytics.overview.filters.quick.last90Days')"
                value="90d"
              />
              <el-option
                :label="t('views.analytics.overview.filters.quick.custom')"
                value="custom"
              />
            </el-select>
            <div v-if="datePreset === 'custom'" class="mt-1">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="-"
                :start-placeholder="t('common.columns.createTime')"
                :end-placeholder="t('common.columns.createTime')"
                size="small"
                data-testid="filters-dateRange"
              />
            </div>
          </div>

          <div class="filter-item">
            <div class="filter-label">
              {{ t("views.analytics.overview.filters.groupBy") }}
            </div>
            <el-radio-group v-model="groupBy" size="small" data-testid="filters-groupBy">
              <el-radio-button label="day" data-testid="groupBy-day">{{
                t("views.analytics.overview.filters.group.day")
              }}</el-radio-button>
              <el-radio-button label="week" data-testid="groupBy-week">{{
                t("views.analytics.overview.filters.group.week")
              }}</el-radio-button>
              <el-radio-button label="month" data-testid="groupBy-month">{{
                t("views.analytics.overview.filters.group.month")
              }}</el-radio-button>
            </el-radio-group>
          </div>

          <div class="filter-item">
            <div class="filter-label">
              {{ t("views.analytics.overview.filters.cardsScope") }}
            </div>
            <el-radio-group v-model="cardsScope" size="small" data-testid="filters-cardsScope">
              <el-radio-button label="overall" data-testid="scope-overall">{{
                t("views.analytics.overview.filters.scope.overall")
              }}</el-radio-button>
              <el-radio-button label="filtered" data-testid="scope-filtered">{{
                t("views.analytics.overview.filters.scope.filtered")
              }}</el-radio-button>
            </el-radio-group>
          </div>

          <div class="filter-actions">
            <el-button
              size="small"
              type="primary"
              @click="onApplyFilters"
              data-testid="filters-apply"
            >
              {{ t("views.analytics.overview.filters.actions.apply") }}
            </el-button>
            <el-button size="small" @click="onResetFilters" data-testid="filters-reset">
              {{ t("views.analytics.overview.filters.actions.reset") }}
            </el-button>
            <el-button size="small" @click="onExportMonthlyCsv" data-testid="export-monthly-csv">
              {{ t("views.analytics.overview.buttons.exportMonthlyCsv") }}
            </el-button>
            <el-button size="small" @click="onExportOperatorsCsv" data-testid="export-operators-csv">
              {{ t("views.analytics.overview.buttons.exportOperatorsCsv") }}
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 汇总卡片 -->
    <div class="cards">
      <el-card class="card">
        <div class="card-title">
          {{ t("views.analytics.overview.cards.activationCodes") }}
        </div>
        <div class="card-value" data-testid="cards-activationCodes-total">{{ cActivationCodesTotal }}</div>
        <div class="card-sub">
          {{ t("views.analytics.overview.cards.unused") }}:
          <span data-testid="cards-activationCodes-unused">{{ cUnusedCodes }}</span>
        </div>
        <div class="card-sub">
          {{ t("views.analytics.overview.cards.used") }}:
          <span data-testid="cards-activationCodes-used">{{ cUsedCodes }}</span>
        </div>
        <div class="card-sub">
          {{ t("views.analytics.overview.cards.expired") }}:
          <span data-testid="cards-activationCodes-expired">{{ cExpiredCodes }}</span>
        </div>
      </el-card>

      <el-card class="card">
        <div class="card-title">
          {{ t("views.analytics.overview.cards.subscriptions") }}
        </div>
        <div class="card-value" data-testid="cards-subscriptions-total">{{ cSubscriptionsTotal }}</div>
        <div class="card-sub">
          {{ t("views.analytics.overview.cards.active") }}:
          <span data-testid="cards-subscriptions-active">{{ cActiveSubs }}</span>
        </div>
        <div class="card-sub">
          {{ t("views.analytics.overview.cards.inactive") }}:
          <span data-testid="cards-subscriptions-inactive">{{ cInactiveSubs }}</span>
        </div>
        <div class="card-sub">
          {{ t("views.analytics.overview.cards.cancelled") }}:
          <span data-testid="cards-subscriptions-cancelled">{{ cCancelledSubs }}</span>
        </div>
      </el-card>

      <el-card class="card">
        <div class="card-title">
          {{ t("views.analytics.overview.cards.invoices") }}
        </div>
        <div class="card-value" data-testid="cards-invoices-total">{{ cInvoicesTotal }}</div>
      </el-card>
    </div>

    <div class="mt-2">
      <el-button type="primary" :loading="loading" @click="onRefresh" data-testid="refresh">
        {{ t("views.analytics.overview.buttons.refresh") }}
      </el-button>
    </div>

    <!-- 图表区 -->
    <div class="charts">
      <div class="chart-box">
        <div ref="lineMonthlyRef" class="chart" />
      </div>
      <div class="chart-box">
        <div ref="barOperatorsRef" class="chart" />
      </div>
    </div>

    <!-- 错误展示（简单提示） -->
    <div v-if="errorMsg" class="mt-2">
      <el-alert type="error" :title="errorMsg" show-icon />
    </div>
  </div>
</template>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.card {
  padding: 8px;
}

.card-title {
  font-size: 14px;
  color: #666;
}

.card-value {
  margin-top: 4px;
  font-size: 24px;
  font-weight: bold;
}

.card-sub {
  font-size: 12px;
  color: #999;
}

.charts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.chart-box {
  padding: 8px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
}

.chart {
  width: 100%;
  height: 360px;
}

/* 筛选器样式 */
.filters {
  margin: 12px 0;
}

.filter-card {
  padding: 8px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  align-items: center;
}

.filter-item .filter-label {
  margin-bottom: 6px;
  font-size: 12px;
  color: #666;
}

.filter-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
