<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { listInvoices } from "@/api/esim";
import DebugInfo from "@/views/esim/components/DebugInfo.vue";

defineOptions({ name: "Invoices" });

const loading = ref(false);
const correlationId = ref("");
const responseData = ref<any>(null);
const errorMsg = ref<string | null>(null);
const router = useRouter();
const inputId = ref("");

/**
 * 拉取发票列表并展示响应的可观察性ID。
 * 说明：
 * - 发票接口同样遵循可观察性规范，响应头可能包含 X-Correlation-ID；
 * - 通过 beforeResponseCallback 从响应头读取 X-Correlation-ID 并展示；
 * - 本页面为只读展示示例，不对请求头进行额外处理。
 */
async function fetchList() {
  loading.value = true;
  errorMsg.value = null;
  correlationId.value = "";
  responseData.value = null;
  try {
    const data = await listInvoices({
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
 * 跳转到发票详情页。
 * 说明：
 * - 接收发票 ID 字符串，若为空则不进行跳转；
 * - 使用 vue-router 将用户导航到 /esim/billing/invoices/:id 路径；
 * - 该详情页用于验证拦截器注入的请求与响应头（Authorization、X-Correlation-ID）等契约信息。
 */
function goInvoiceDetail(id: string) {
  const target = (id || "").trim();
  if (!target) return;
  router.push(`/esim/billing/invoices/${encodeURIComponent(target)}`);
}
</script>

<template>
  <div>
    <h2>发票 - 列表（GET /api/billing/invoices）</h2>
    <el-button type="primary" :loading="loading" @click="fetchList">
      拉取列表
    </el-button>

    <!-- 查看详情入口：输入发票ID并跳转到详情页 -->
    <div class="mt-2 flex items-center gap-2">
      <el-input
        v-model="inputId"
        placeholder="请输入发票ID"
        style="max-width: 320px"
      />
      <el-button
        type="primary"
        :loading="false"
        @click="goInvoiceDetail(inputId)"
      >
        查看详情
      </el-button>
    </div>

    <div class="mt-4">
      <DebugInfo
        title="响应信息"
        :response-correlation-id="correlationId"
        :response-data="responseData"
        :error-msg="errorMsg"
      />
    </div>
  </div>
</template>
