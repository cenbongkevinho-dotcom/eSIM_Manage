<script setup lang="ts">
import { ref } from "vue";
import { listActivationCodes } from "@/api/esim";
import DebugInfo from "@/views/esim/components/DebugInfo.vue";

defineOptions({ name: "ActivationCodes" });

const loading = ref(false);
const correlationId = ref("");
const requestCorrelationId = ref("");
const requestAuthorization = ref("");
const responseData = ref<any>(null);
const errorMsg = ref<string | null>(null);

/**
 * 拉取激活码列表并展示请求与响应的可观察性ID。
 * 说明：
 * - 在请求拦截器中会自动为每个请求注入 X-Correlation-ID；
 * - 通过 beforeRequestCallback 捕获本次请求所注入的 X-Correlation-ID 并展示；
 * - 通过 beforeResponseCallback 从响应头尝试读取服务端返回的 X-Correlation-ID（若规范有声明）。
 */
async function fetchList() {
  loading.value = true;
  errorMsg.value = null;
  correlationId.value = "";
  requestCorrelationId.value = "";
  requestAuthorization.value = "";
  responseData.value = null;
  try {
    const data = await listActivationCodes({
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
</script>

<template>
  <div>
    <h2>激活码 - 列表（GET /api/activation-codes）</h2>
    <el-button type="primary" :loading="loading" @click="fetchList">
      拉取列表
    </el-button>

    <div class="mt-4">
      <DebugInfo
        title="响应信息"
        :request-authorization="requestAuthorization"
        :request-correlation-id="requestCorrelationId"
        :response-correlation-id="correlationId"
        :response-data="responseData"
        :error-msg="errorMsg"
      />
    </div>
  </div>
</template>
