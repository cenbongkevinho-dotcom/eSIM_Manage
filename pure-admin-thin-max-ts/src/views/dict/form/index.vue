<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import { formRules } from "../utils/rule";
import { FormProps } from "../utils/types";
import { usePublicHooks } from "../hooks";
import { useI18n } from "vue-i18n";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    isAdd: true,
    label: "",
    value: "",
    color: "#6abe39",
    sort: 999,
    status: 1,
    remark: ""
  })
});

const ruleFormRef = ref();
const { switchStyle } = usePublicHooks();
const newFormInline = ref(props.formInline);
const predefineColors = ref([
  "#6abe39",
  "#e84749",
  "#9fceff",
  "#fab6b6",
  "#172412",
  "#274a17",
  "#2b1316",
  "#58191c"
]);

/**
 * 获取当前表单的 ref 引用，供父组件调用表单校验等方法。
 * @returns 当前表单的 Element Plus 表单实例
 */
function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });

// 获取 i18n t 函数，用于表单标签、占位符与状态文案的国际化。
const { t } = useI18n();
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="82px"
  >
    <el-row :gutter="30">
      <re-col>
        <el-form-item :label="t('views.dict.form.label')" prop="label">
          <el-input
            v-model="newFormInline.label"
            clearable
            :placeholder="t('views.dict.form.placeholders.label')"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item :label="t('views.dict.form.value')" prop="value">
          <el-input
            v-model="newFormInline.value"
            clearable
            :placeholder="t('views.dict.form.placeholders.value')"
          />
        </el-form-item>
      </re-col>

      <re-col>
        <el-form-item :label="t('views.dict.form.color')">
          <el-input
            v-model="newFormInline.color"
            class="color-input"
            clearable
            :placeholder="t('views.dict.form.placeholders.color')"
          >
            <template #append>
              <el-color-picker
                v-model="newFormInline.color"
                :predefine="predefineColors"
              />
            </template>
          </el-input>
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item :label="t('views.dict.form.sort')">
          <el-input-number
            v-model="newFormInline.sort"
            class="w-full!"
            :min="1"
            controls-position="right"
            :placeholder="t('views.dict.form.placeholders.sort')"
          />
        </el-form-item>
      </re-col>

      <re-col v-if="newFormInline.isAdd">
        <el-form-item :label="t('views.dict.form.status')">
          <el-switch
            v-model="newFormInline.status"
            inline-prompt
            :active-value="1"
            :inactive-value="0"
            :active-text="t('common.status.enabled')"
            :inactive-text="t('common.status.disabled')"
            :style="switchStyle"
          />
        </el-form-item>
      </re-col>

      <re-col>
        <el-form-item :label="t('views.dict.form.remark')">
          <el-input
            v-model="newFormInline.remark"
            :placeholder="t('views.dict.form.placeholders.remark')"
            maxlength="200"
            :rows="3"
            show-word-limit
            type="textarea"
          />
        </el-form-item>
      </re-col>
    </el-row>
  </el-form>
</template>

<style lang="scss" scoped>
.color-input {
  :deep(.el-input-group__append) {
    padding: 0;
  }
}
</style>
