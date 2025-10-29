<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { getSubscription } from "@/api/esim";
import DebugInfo from "@/views/esim/components/DebugInfo.vue";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

defineOptions({ name: "SubscriptionDetail" });

const { t } = useI18n();

const loading = ref(false);
const subscriptionId = ref("");
const correlationId = ref("");
const requestCorrelationId = ref("");
const requestAuthorization = ref("");
const responseData = ref<any>(null);
const errorMsg = ref<string | null>(null);

/**
 * 拉取订阅详情并展示请求与响应的可观察性ID。
 * 说明：
 * - 通过 getSubscription(id) 发起详情请求；
 * - 请求拦截器自动注入 Authorization 与 X-Correlation-ID；
 * - 使用 beforeRequestCallback 捕获请求头中的注入信息；
 * - 使用 beforeResponseCallback 捕获响应头中的 X-Correlation-ID；
 */
async function fetchDetail() {
  if (!subscriptionId.value) {
    errorMsg.value = t("common.inputs.subscriptionId.placeholder");
    return;
  }
  loading.value = true;
  errorMsg.value = null;
  correlationId.value = "";
  requestCorrelationId.value = "";
  requestAuthorization.value = "";
  responseData.value = null;
  try {
    const data = await getSubscription(subscriptionId.value, {
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
 * 从路由参数预填订阅ID并自动拉取详情。
 * 说明：
 * - 当通过列表页的“查看详情”按钮跳转到 /esim/customers/subscriptions/:id 时，读取 params.id；
 * - 首次进入页面时若存在 id，则自动调用 fetchDetail；
 * - 监听路由参数变更，支持在浏览器内切换不同订阅ID时自动刷新详情。
 */
const route = useRoute();
const router = useRouter();
onMounted(() => {
  const idFromRoute = (route.params.id || "") as string;
  if (idFromRoute) {
    subscriptionId.value = idFromRoute;
    fetchDetail();
  }
});
watch(
  () => route.params.id,
  newId => {
    const idStr = (newId || "") as string;
    if (idStr) {
      subscriptionId.value = idStr;
      fetchDetail();
    }
  }
);

/**
 * 返回上一个页面（通常为订阅列表）。
 * 说明：优先使用浏览器历史回退；若无法回退，可根据实际路由前缀主动导航到列表页。
 */
function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push("/esim/customers/subscriptions");
  }
}
</script>

<template>
  <div>
    <h2>{{ t("views.subscriptions.title") }}</h2>
    <div class="mt-2 flex items-center gap-2">
      <el-input
        v-model="subscriptionId"
        :placeholder="t('common.inputs.subscriptionId.placeholder')"
        style="max-width: 320px"
      />
      <el-button type="primary" :loading="loading" @click="fetchDetail">
        {{ t("common.buttons.fetchDetail") }}
      </el-button>
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
  </div>
</template>
