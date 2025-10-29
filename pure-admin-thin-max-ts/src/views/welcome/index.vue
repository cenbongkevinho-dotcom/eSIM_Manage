<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { listOperators } from "@/api/operators";

defineOptions({
  name: "Welcome"
});

// 国际化：通过 useI18n 获取 t 方法，用于渲染页面文案。
const { t } = useI18n();
const loading = ref(false);
const correlationId = ref("");
const requestCorrelationId = ref("");
const requestAuthorization = ref("");
const responseData = ref<any>(null);
const errorMsg = ref<string | null>(null);

/**
 * 测试契约调用（GET /api/operators）。
 * 说明：
 * - 请求拦截器会自动注入 X-Correlation-ID 与 Authorization（开发环境自动注入临时 token）；
 * - 通过 beforeRequestCallback 捕获请求侧注入的 X-Correlation-ID；
 * - 通过 beforeResponseCallback 捕获服务端返回的 X-Correlation-ID；
 * - 所有可见文案均通过 i18n 渲染（views.welcome.*、common.sections.*、debug.*）。
 */
async function testContractCall() {
  loading.value = true;
  errorMsg.value = null;
  correlationId.value = "";
  requestCorrelationId.value = "";
  requestAuthorization.value = "";
  responseData.value = null;
  try {
    const data = await listOperators({
      beforeRequestCallback: config => {
        const headers = (config.headers || {}) as Record<string, string>;
        requestCorrelationId.value =
          headers["x-correlation-id"] || headers["X-Correlation-ID"] || "";
        requestAuthorization.value =
          headers["authorization"] || headers["Authorization"] || "";
      },
      beforeResponseCallback: response => {
        // 从响应头读取可观察性ID
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
    <h1>{{ t("views.welcome.title") }}</h1>
    <el-link
      class="text-2xl! mt-4"
      type="primary"
      href="https://pure-admin.cn/pages/service/#max-ts-版本"
      target="_blank"
    >
      {{ t("views.welcome.linkText") }}
    </el-link>

    <div class="mt-6">
      <el-button type="success" :loading="loading" @click="testContractCall">
        {{ t("views.welcome.testButton") }}
      </el-button>
    </div>

    <div class="mt-4">
      <el-descriptions
        :title="t('common.sections.responseInfo')"
        :column="1"
        border
      >
        <el-descriptions-item :label="t('debug.requestAuthorization')">
          <span v-if="requestAuthorization">{{ requestAuthorization }}</span>
          <span v-else class="text-gray">{{ t("debug.notCaptured") }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="t('debug.requestCorrelationId')">
          <span v-if="requestCorrelationId">{{ requestCorrelationId }}</span>
          <span v-else class="text-gray">{{ t("debug.notCaptured") }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="t('debug.responseCorrelationId')">
          <span v-if="correlationId">{{ correlationId }}</span>
          <span v-else class="text-gray">{{ t("debug.notReturned") }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="t('debug.responseBody')">
          <pre style="word-break: break-all; white-space: pre-wrap"
            >{{
              responseData
                ? JSON.stringify(responseData, null, 2)
                : t("debug.emptyOrUndefined")
            }}
          </pre>
        </el-descriptions-item>
        <el-descriptions-item :label="t('debug.error')">
          <span v-if="errorMsg" class="text-red">{{ errorMsg }}</span>
          <span v-else class="text-gray">{{ t("debug.none") }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>
