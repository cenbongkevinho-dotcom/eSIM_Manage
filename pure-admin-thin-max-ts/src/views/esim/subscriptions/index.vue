<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { listSubscriptions } from "@/api/esim";
import DebugInfo from "@/views/esim/components/DebugInfo.vue";

defineOptions({ name: "Subscriptions" });

/**
 * 获取国际化 t 函数。
 * 用于订阅列表页标题、输入框占位符与按钮的多语言化。
 */
const { t } = useI18n();

const loading = ref(false);
const correlationId = ref("");
const requestCorrelationId = ref("");
const requestAuthorization = ref("");
const responseData = ref<any>(null);
const errorMsg = ref<string | null>(null);
const router = useRouter();
const inputId = ref("");

/**
 * 拉取订阅列表并展示请求与响应的可观察性ID。
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
    const data = await listSubscriptions({
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
 * 跳转到订阅详情页。
 * 说明：
 * - 接收订阅 ID 字符串，若为空则不进行跳转；
 * - 使用 vue-router 将用户导航到 /esim/customers/subscriptions/:id 路径；
 * - 该详情页用于验证拦截器注入的请求与响应头（Authorization、X-Correlation-ID）等契约信息。
 */
function goSubscriptionDetail(id: string) {
  const target = (id || "").trim();
  if (!target) return;
  router.push(`/esim/customers/subscriptions/${encodeURIComponent(target)}`);
}
</script>

<template>
  <div>
    <h2>{{ t("views.subscriptions.index.title") }}</h2>
    <el-button type="primary" :loading="loading" @click="fetchList">
      {{ t("views.subscriptions.index.buttons.fetchList") }}
    </el-button>

    <!-- 查看详情入口：输入订阅ID并跳转到详情页 -->
    <div class="mt-2 flex items-center gap-2">
      <el-input
        v-model="inputId"
        :placeholder="t('common.inputs.subscriptionId.placeholder')"
        style="max-width: 320px"
      />
      <el-button
        type="primary"
        :loading="false"
        @click="goSubscriptionDetail(inputId)"
      >
        {{ t("views.subscriptions.index.buttons.viewDetail") }}
      </el-button>
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
  </div>
</template>
