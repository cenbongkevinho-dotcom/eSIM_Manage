<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

/**
 * 将响应及可观察性信息以统一样式展示。
 * 组件说明：
 * - 可选展示：请求 Authorization、请求 X-Correlation-ID、响应 X-Correlation-ID；
 * - 始终展示：响应体与错误信息（无内容时给出友好占位文案）。
 * - 用于在激活码、订阅、发票等页面减少重复模板代码，统一调试信息布局。
 */
const props = defineProps<{
  title?: string;
  requestAuthorization?: string | null;
  requestCorrelationId?: string | null;
  responseCorrelationId?: string | null;
  responseData?: unknown;
  errorMsg?: string | null;
}>();

const showRequestAuth = computed(
  () => props.requestAuthorization !== undefined
);
const showRequestCorr = computed(
  () => props.requestCorrelationId !== undefined
);
const showResponseCorr = computed(
  () => props.responseCorrelationId !== undefined
);

/**
 * 将响应体安全地序列化为字符串以供展示。
 * 说明：
 * - 对传入的未知类型数据进行 JSON.stringify，带缩进，便于阅读；
 * - 若数据为空或未定义，则返回占位文案以避免模板中出现 undefined。
 */
const { t } = useI18n();

/**
 * 将响应体安全地序列化为字符串以供展示。
 * @param data 任意类型的响应体数据
 * @returns 可读性友好的字符串表示（当空或未定义时返回占位文案）
 */
function stringifySafe(data: unknown): string {
  try {
    if (data === undefined || data === null) return t("debug.emptyOrUndefined");
    return typeof data === "string" ? data : JSON.stringify(data, null, 2);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return t("debug.serializationFailed", { message: msg });
  }
}
</script>

<template>
  <el-descriptions
    :title="title || t('common.sections.responseInfo')"
    :column="1"
    border
  >
    <!-- 请求 Authorization（可选） -->
    <el-descriptions-item
      v-if="showRequestAuth"
      :label="t('debug.requestAuthorization')"
    >
      <span v-if="props.requestAuthorization">{{
        props.requestAuthorization
      }}</span>
      <span v-else class="text-gray">{{ t("debug.notCaptured") }}</span>
    </el-descriptions-item>

    <!-- 请求 X-Correlation-ID（可选） -->
    <el-descriptions-item
      v-if="showRequestCorr"
      :label="t('debug.requestCorrelationId')"
    >
      <span v-if="props.requestCorrelationId">{{
        props.requestCorrelationId
      }}</span>
      <span v-else class="text-gray">{{ t("debug.notCaptured") }}</span>
    </el-descriptions-item>

    <!-- 响应 X-Correlation-ID（可选） -->
    <el-descriptions-item
      v-if="showResponseCorr"
      :label="t('debug.responseCorrelationId')"
    >
      <span v-if="props.responseCorrelationId">{{
        props.responseCorrelationId
      }}</span>
      <span v-else class="text-gray">{{ t("debug.notReturned") }}</span>
    </el-descriptions-item>

    <!-- 响应体（始终展示） -->
    <el-descriptions-item :label="t('debug.responseBody')">
      <pre style="word-break: break-all; white-space: pre-wrap">{{
        stringifySafe(props.responseData)
      }}</pre>
    </el-descriptions-item>

    <!-- 错误（始终展示） -->
    <el-descriptions-item :label="t('debug.error')">
      <span v-if="props.errorMsg" class="text-red">{{ props.errorMsg }}</span>
      <span v-else class="text-gray">{{ t("debug.none") }}</span>
    </el-descriptions-item>
  </el-descriptions>
</template>
