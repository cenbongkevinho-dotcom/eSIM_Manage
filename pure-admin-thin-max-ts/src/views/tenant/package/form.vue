<script setup lang="ts">
import { ref } from "vue";
import { formRules } from "./utils/rule";
import { FormProps } from "./utils/types";
import { useI18n } from "vue-i18n";

const props = withDefaults(defineProps<FormProps>(), {
  formInline: () => ({
    name: "",
    remark: ""
  })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

// i18n 文案函数
const { t } = useI18n();

/**
 * 获取当前表单组件的 ref 引用
 * 供父级弹框在提交前进行表单校验与取值
 */
function getRef() {
  return ruleFormRef.value;
}

/**
 * 暴露方法到父组件
 * 目前暴露 getRef，便于父组件通过 ref 调用表单校验与数据读取
 */
defineExpose({ getRef });
</script>

<template>
  <el-form
    ref="ruleFormRef"
    :model="newFormInline"
    :rules="formRules"
    label-width="82px"
  >
    <el-form-item :label="t('views.tenant.package.form.name')" prop="name">
      <el-input
        v-model="newFormInline.name"
        clearable
        :placeholder="t('views.tenant.package.form.placeholders.name')"
      />
    </el-form-item>

    <el-form-item :label="t('views.tenant.package.form.remark')">
      <el-input
        v-model="newFormInline.remark"
        :placeholder="t('views.tenant.package.form.placeholders.remark')"
        type="textarea"
      />
    </el-form-item>
  </el-form>
</template>
