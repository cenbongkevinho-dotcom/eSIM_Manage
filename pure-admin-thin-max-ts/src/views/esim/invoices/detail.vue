<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import {
  getInvoice,
  reconcileInvoice,
  approveInvoice,
  signInvoice,
  downloadInvoicePdf
} from "@/api/esim";
import DebugInfo from "@/views/esim/components/DebugInfo.vue";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";

defineOptions({ name: "InvoiceDetail" });

// i18n
const { t } = useI18n();

const loading = ref(false);
const invoiceId = ref("");
const correlationId = ref("");
const requestCorrelationId = ref("");
const requestAuthorization = ref("");
const responseData = ref<any>(null);
const errorMsg = ref<string | null>(null);

/**
 * 拉取发票详情并展示请求与响应的可观察性ID。
 * 说明：
 * - 通过 getInvoice(id) 发起详情请求；
 * - 请求拦截器自动注入 Authorization 与 X-Correlation-ID；
 * - 使用 beforeRequestCallback 捕获请求头中的注入信息；
 * - 使用 beforeResponseCallback 捕获响应头中的 X-Correlation-ID；
 */
async function fetchDetail() {
  if (!invoiceId.value) {
    errorMsg.value = t("common.inputs.invoiceId.placeholder");
    return;
  }
  loading.value = true;
  errorMsg.value = null;
  correlationId.value = "";
  requestCorrelationId.value = "";
  requestAuthorization.value = "";
  responseData.value = null;
  try {
    const data = await getInvoice(invoiceId.value, {
      beforeRequestCallback: config => {
        const headers = (config.headers || {}) as Record<string, string>;
        requestCorrelationId.value =
          headers["x-correlation-id"] || headers["X-Correlation-ID"] || "";
        requestAuthorization.value =
          headers["authorization"] || headers["Authorization"] || "";
      },
      beforeResponseCallback: response => {
        const headers = response.headers as Record<string, string> | undefined;
        if (headers) {
          correlationId.value =
            headers["x-correlation-id"] || headers["X-Correlation-ID"] || "";
        }
      }
    });
    responseData.value = data;
  } catch (e: any) {
    errorMsg.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

/**
 * 从路由参数预填发票ID并自动拉取详情。
 * 说明：
 * - 当通过列表页的“查看详情”按钮跳转到 /esim/billing/invoices/:id 时，读取 params.id；
 * - 首次进入页面时若存在 id，则自动调用 fetchDetail；
 * - 监听路由参数变更，支持在浏览器内切换不同发票ID时自动刷新详情。
 */
const route = useRoute();
const router = useRouter();
onMounted(() => {
  const idFromRoute = (route.params.id || "") as string;
  if (idFromRoute) {
    invoiceId.value = idFromRoute;
    fetchDetail();
  }
});
watch(
  () => route.params.id,
  newId => {
    const idStr = (newId || "") as string;
    if (idStr) {
      invoiceId.value = idStr;
      fetchDetail();
    }
  }
);

/**
 * 返回上一个页面（通常为发票列表）。
 * 说明：优先使用浏览器历史回退；若无法回退，则兜底跳转到发票列表页。
 */
function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push("/esim/billing/invoices");
  }
}

// ===== 操作面板与调试信息（对账/审批/签章/PDF 下载） =====

// 操作面板各动作的 loading 状态
const reconcileLoading = ref(false);
const approveLoading = ref(false);
const signLoading = ref(false);
const downloadLoading = ref(false);
// 预览按钮的加载状态
const previewLoading = ref(false);

// 操作面板各动作的表单模型
const reconcileForm = ref({
  period: "",
  // 将对账项以 JSON 文本输入，便于快速验证接口；正式环境可改为结构化表单
  itemsJson: '[\n  { "type": "usage", "operatorId": "op_cn_cmcc" }\n]'
});
const approveForm = ref({ approvedBy: "", comment: "" });
const signForm = ref({ signatureProvider: "", sealId: "" });

// 操作请求与响应的调试信息（Authorization、Correlation-ID、响应数据与错误）
const opCorrelationId = ref("");
const opRequestCorrelationId = ref("");
const opRequestAuthorization = ref("");
const opResponseData = ref<any>(null);
const opErrorMsg = ref<string | null>(null);

/**
 * 清空操作面板的调试信息。
 * 说明：在每次发起新操作前调用，避免旧信息干扰当前结果展示。
 */
function clearOperationDebug() {
  opCorrelationId.value = "";
  opRequestCorrelationId.value = "";
  opRequestAuthorization.value = "";
  opResponseData.value = null;
  opErrorMsg.value = null;
}

/**
 * 发起对账操作（POST /api/billing/invoices/:id/reconcile）。
 * 说明：
 * - period 使用 YYYY-MM 格式；
 * - itemsJson 以 JSON 文本录入并解析为数组传入；
 * - 回调中捕获 Authorization 与 X-Correlation-ID 以便在 DebugInfo 展示。
 */
async function doReconcile() {
  if (!invoiceId.value) {
    ElMessage.warning(t("views.invoices.messages.fillInvoiceIdFirst"));
    return;
  }
  if (!reconcileForm.value.period) {
    ElMessage.warning(t("views.invoices.messages.fillReconcilePeriodFirst"));
    return;
  }
  let items: any[] = [];
  try {
    items = JSON.parse(reconcileForm.value.itemsJson || "[]");
    if (!Array.isArray(items))
      throw new Error(t("views.invoices.messages.itemsMustBeArray"));
  } catch (e: any) {
    ElMessage.error(
      t("views.invoices.messages.itemsJsonParseFailed", {
        message: e?.message || String(e)
      })
    );
    return;
  }
  clearOperationDebug();
  reconcileLoading.value = true;
  try {
    const res = await reconcileInvoice(
      invoiceId.value,
      { period: reconcileForm.value.period, reconcileItems: items },
      {
        beforeRequestCallback: config => {
          const headers = (config.headers || {}) as Record<string, string>;
          opRequestCorrelationId.value =
            headers["x-correlation-id"] || headers["X-Correlation-ID"] || "";
          opRequestAuthorization.value =
            headers["authorization"] || headers["Authorization"] || "";
        },
        beforeResponseCallback: response => {
          const headers = response.headers as
            | Record<string, string>
            | undefined;
          if (headers) {
            opCorrelationId.value =
              headers["x-correlation-id"] || headers["X-Correlation-ID"] || "";
          }
        }
      }
    );
    opResponseData.value = res;
    ElMessage.success(t("views.invoices.messages.reconcileSuccess"));
  } catch (e: any) {
    opErrorMsg.value = e?.message || String(e);
    ElMessage.error(opErrorMsg.value);
  } finally {
    reconcileLoading.value = false;
  }
}

/**
 * 提交审批（POST /api/billing/invoices/:id/approve）。
 * 说明：
 * - 需提供 approvedBy 与 comment；
 * - 回调中捕获 Authorization 与 X-Correlation-ID。
 */
async function doApprove() {
  if (!invoiceId.value) {
    ElMessage.warning(t("views.invoices.messages.fillInvoiceIdFirst"));
    return;
  }
  if (!approveForm.value.approvedBy) {
    ElMessage.warning(t("common.inputs.approve.approvedBy.placeholder"));
    return;
  }
  clearOperationDebug();
  approveLoading.value = true;
  try {
    const res = await approveInvoice(
      invoiceId.value,
      {
        approvedBy: approveForm.value.approvedBy,
        comment: approveForm.value.comment
      },
      {
        beforeRequestCallback: config => {
          const headers = (config.headers || {}) as Record<string, string>;
          opRequestCorrelationId.value =
            headers["x-correlation-id"] || headers["X-Correlation-ID"] || "";
          opRequestAuthorization.value =
            headers["authorization"] || headers["Authorization"] || "";
        },
        beforeResponseCallback: response => {
          const headers = response.headers as
            | Record<string, string>
            | undefined;
          if (headers) {
            opCorrelationId.value =
              headers["x-correlation-id"] || headers["X-Correlation-ID"] || "";
          }
        }
      }
    );
    opResponseData.value = res;
    ElMessage.success(t("views.invoices.messages.approveSubmitted"));
  } catch (e: any) {
    opErrorMsg.value = e?.message || String(e);
    ElMessage.error(opErrorMsg.value);
  } finally {
    approveLoading.value = false;
  }
}

/**
 * 发起签章（POST /api/billing/invoices/:id/sign）。
 * 说明：
 * - 需提供 signatureProvider 与 sealId；
 * - 回调中捕获 Authorization 与 X-Correlation-ID。
 */
async function doSign() {
  if (!invoiceId.value) {
    ElMessage.warning(t("views.invoices.messages.fillInvoiceIdFirst"));
    return;
  }
  if (!signForm.value.signatureProvider || !signForm.value.sealId) {
    ElMessage.warning(
      t("common.inputs.sign.signatureProvider.placeholder") +
        " / " +
        t("common.inputs.sign.sealId.placeholder")
    );
    return;
  }
  clearOperationDebug();
  signLoading.value = true;
  try {
    const res = await signInvoice(
      invoiceId.value,
      {
        signatureProvider: signForm.value.signatureProvider,
        sealId: signForm.value.sealId
      },
      {
        beforeRequestCallback: config => {
          const headers = (config.headers || {}) as Record<string, string>;
          opRequestCorrelationId.value =
            headers["x-correlation-id"] || headers["X-Correlation-ID"] || "";
          opRequestAuthorization.value =
            headers["authorization"] || headers["Authorization"] || "";
        },
        beforeResponseCallback: response => {
          const headers = response.headers as
            | Record<string, string>
            | undefined;
          if (headers) {
            opCorrelationId.value =
              headers["x-correlation-id"] || headers["X-Correlation-ID"] || "";
          }
        }
      }
    );
    opResponseData.value = res;
    ElMessage.success(t("views.invoices.messages.signCompleted"));
  } catch (e: any) {
    opErrorMsg.value = e?.message || String(e);
    ElMessage.error(opErrorMsg.value);
  } finally {
    signLoading.value = false;
  }
}

/**
 * 触发浏览器下载 Blob 文件的工具函数。
 * @param blob Blob 对象
 * @param filename 下载文件名
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * 下载发票 PDF（GET /api/billing/invoices/:id/pdf，responseType: 'blob'）。
 * 说明：
 * - 回调中捕获 X-Correlation-ID；
 * - 成功后生成临时链接并触发浏览器下载。
 */
async function doDownloadPdf() {
  if (!invoiceId.value) {
    ElMessage.warning(t("views.invoices.messages.fillInvoiceIdFirst"));
    return;
  }
  clearOperationDebug();
  downloadLoading.value = true;
  try {
    const blob = await downloadInvoicePdf(invoiceId.value, {
      beforeRequestCallback: config => {
        const headers = (config.headers || {}) as Record<string, string>;
        opRequestCorrelationId.value =
          headers["x-correlation-id"] || headers["X-Correlation-ID"] || "";
        opRequestAuthorization.value =
          headers["authorization"] || headers["Authorization"] || "";
      },
      beforeResponseCallback: response => {
        const headers = response.headers as Record<string, string> | undefined;
        if (headers) {
          opCorrelationId.value =
            headers["x-correlation-id"] || headers["X-Correlation-ID"] || "";
        }
      }
    });
    opResponseData.value = { size: blob.size, type: blob.type };
    downloadBlob(blob, `invoice-${invoiceId.value}.pdf`);
    ElMessage.success(t("views.invoices.messages.pdfDownloadStarted"));
  } catch (e: any) {
    opErrorMsg.value = e?.message || String(e);
    ElMessage.error(opErrorMsg.value);
  } finally {
    downloadLoading.value = false;
  }
}

/**
 * 构建支持内联预览的 PDF 直链（GET /api/billing/invoices/:id/pdf?mode=inline）。
 * 说明：
 * - 通过查询参数 mode=inline，后端/Mock 将返回 Content-Disposition: inline；
 * - 返回相对路径，避免在开发与生产环境中的域名差异；
 * - 使用 window.open 以新标签页打开，确保浏览器原生 PDF 查看器接管。
 * @param id 发票 ID
 * @returns 预览直链 URL
 */
function buildInlinePreviewUrl(id: string): string {
  const encodedId = encodeURIComponent(id);
  return `/api/billing/invoices/${encodedId}/pdf?mode=inline`;
}

/**
 * 预览发票 PDF（新标签页打开内联预览）。
 * 说明：
 * - 先以 XHR 调用 downloadInvoicePdf 捕获请求/响应头中的 Authorization 与 X-Correlation-ID；
 * - 同步记录响应的 Blob 元信息（size/type），便于在 DebugInfo 中展示；
 * - 再使用 window.open 打开直链（mode=inline），让浏览器原生 PDF 查看器内联呈现；
 * - 注意：由于 window.open 会再次发起 GET 请求，网络层面会产生一次额外请求，用于真实预览展示。
 */
async function doPreviewPdf() {
  if (!invoiceId.value) {
    ElMessage.warning(t("views.invoices.messages.fillInvoiceIdFirst"));
    return;
  }
  clearOperationDebug();
  previewLoading.value = true;
  try {
    // 先同步打开浏览器内联预览（新标签页）以保留用户激活状态，避免异步请求后 window.open 被浏览器拦截。
    const previewUrl = buildInlinePreviewUrl(invoiceId.value);
    window.open(previewUrl, "_blank", "noopener,noreferrer");

    // 再以 XHR 捕获请求/响应头中的 Authorization 与 X-Correlation-ID，并记录 Blob 元信息（不触发下载）。
    const blob = await downloadInvoicePdf(invoiceId.value, {
      // 通过 config.params 注入查询参数，确保契约可验证
      params: { mode: "inline" },
      beforeRequestCallback: config => {
        const headers = (config.headers || {}) as Record<string, string>;
        opRequestCorrelationId.value =
          headers["x-correlation-id"] || headers["X-Correlation-ID"] || "";
        opRequestAuthorization.value =
          headers["authorization"] || headers["Authorization"] || "";
      },
      beforeResponseCallback: response => {
        const headers = response.headers as Record<string, string> | undefined;
        if (headers) {
          opCorrelationId.value =
            headers["x-correlation-id"] || headers["X-Correlation-ID"] || "";
        }
      }
    });
    // 记录预览的基础信息（用于 DebugInfo 展示），但不触发下载
    opResponseData.value = { size: blob.size, type: blob.type, mode: "inline" };
    ElMessage.success(t("views.invoices.messages.pdfPreviewOpened"));
  } catch (e: any) {
    opErrorMsg.value = e?.message || String(e);
    ElMessage.error(opErrorMsg.value);
  } finally {
    previewLoading.value = false;
  }
}
</script>

<template>
  <div>
    <h2>{{ t("views.invoices.title") }}</h2>
    <div class="mt-2 flex items-center gap-2">
      <el-input
        v-model="invoiceId"
        :placeholder="t('common.inputs.invoiceId.placeholder')"
        style="max-width: 320px"
      />
      <el-button type="primary" :loading="loading" @click="fetchDetail">{{
        t("common.buttons.fetchDetail")
      }}</el-button>
      <el-button @click="goBack">{{ t("common.buttons.backList") }}</el-button>
    </div>

    <div class="mt-4">
      <DebugInfo
        :title="t('common.sections.responseInfo')"
        :request-authorization="requestAuthorization"
        :request-correlation-id="requestCorrelationId"
        :response-correlation-id="correlationId"
        :response-data="responseData"
        :error-msg="errorMsg"
      />
    </div>

    <el-divider class="mt-6" />
    <h3>{{ t("common.sections.operationPanel") }}</h3>
    <div class="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
      <!-- 对账 -->
      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            {{ t("views.invoices.cards.reconcile") }}
          </div>
        </template>
        <div class="flex flex-col gap-2">
          <el-input
            v-model="reconcileForm.period"
            :placeholder="t('common.inputs.reconcile.period.placeholder')"
          />
          <el-input
            v-model="reconcileForm.itemsJson"
            type="textarea"
            :rows="4"
            :placeholder="t('common.inputs.reconcile.itemsJson.placeholder')"
          />
          <el-button
            type="primary"
            :loading="reconcileLoading"
            @click="doReconcile"
            >{{ t("common.buttons.startReconcile") }}</el-button
          >
        </div>
      </el-card>

      <!-- 审批 -->
      <el-card shadow="never">
        <template #header>
          <div class="card-header">{{ t("views.invoices.cards.approve") }}</div>
        </template>
        <div class="flex flex-col gap-2">
          <el-input
            v-model="approveForm.approvedBy"
            :placeholder="t('common.inputs.approve.approvedBy.placeholder')"
          />
          <el-input
            v-model="approveForm.comment"
            type="textarea"
            :rows="3"
            :placeholder="t('common.inputs.approve.comment.placeholder')"
          />
          <el-button
            type="primary"
            :loading="approveLoading"
            @click="doApprove"
            >{{ t("common.buttons.submitApproval") }}</el-button
          >
        </div>
      </el-card>

      <!-- 签章 -->
      <el-card shadow="never">
        <template #header>
          <div class="card-header">{{ t("views.invoices.cards.sign") }}</div>
        </template>
        <div class="flex flex-col gap-2">
          <el-input
            v-model="signForm.signatureProvider"
            :placeholder="t('common.inputs.sign.signatureProvider.placeholder')"
          />
          <el-input
            v-model="signForm.sealId"
            :placeholder="t('common.inputs.sign.sealId.placeholder')"
          />
          <el-button type="primary" :loading="signLoading" @click="doSign">{{
            t("common.buttons.sign")
          }}</el-button>
        </div>
      </el-card>

      <!-- PDF 下载 -->
      <el-card shadow="never">
        <template #header>
          <div class="card-header">{{ t("views.invoices.cards.pdf") }}</div>
        </template>
        <div class="flex flex-col gap-2">
          <el-button
            type="primary"
            :loading="previewLoading"
            @click="doPreviewPdf"
            >{{ t("common.buttons.previewPdf") }}</el-button
          >
          <el-button
            type="success"
            :loading="downloadLoading"
            @click="doDownloadPdf"
            >{{ t("common.buttons.downloadPdf") }}</el-button
          >
          <small class="text-gray-500">{{
            t("common.tips.pdfDownloadNote")
          }}</small>
        </div>
      </el-card>
    </div>

    <!-- 操作结果调试信息 -->
    <div class="mt-4">
      <DebugInfo
        :title="t('common.sections.operationResult')"
        :request-authorization="opRequestAuthorization"
        :request-correlation-id="opRequestCorrelationId"
        :response-correlation-id="opCorrelationId"
        :response-data="opResponseData"
        :error-msg="opErrorMsg"
      />
    </div>
  </div>
</template>
