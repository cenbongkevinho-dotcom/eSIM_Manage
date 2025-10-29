<script setup lang="ts">
import { ref } from "vue";
import ReCol from "@/components/ReCol";
import { dictFormRules } from "../utils/rule";
import { DictFormProps } from "../utils/types";
import { useI18n } from "vue-i18n";

const props = withDefaults(defineProps<DictFormProps>(), {
  formInline: () => ({
    isEdit: false,
    name: "",
    code: "",
    remark: ""
  })
});

const ruleFormRef = ref();
const newFormInline = ref(props.formInline);

/**
 * 获取当前表单的 ref 引用，供父组件调用表单校验等方法。
 * @returns 当前表单的 Element Plus 表单实例
 */
function getRef() {
  return ruleFormRef.value;
}

defineExpose({ getRef });

// 获取 i18n t 函数，用于表单标签的国际化。
const { t } = useI18n();
</script>

<template>
  <el-form
    ref="ruleFormRef"
    label-width="auto"
    :model="newFormInline"
    :rules="dictFormRules"
  >
    <el-row :gutter="30">
      <re-col>
        <el-form-item :label="t('views.dict.dictForm.name')" prop="name">
          <el-input v-model="newFormInline.name" />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item :label="t('views.dict.dictForm.code')" prop="code">
          <el-input
            v-model="newFormInline.code"
            :disabled="newFormInline.isEdit"
          />
        </el-form-item>
      </re-col>
      <re-col>
        <el-form-item :label="t('views.dict.dictForm.remark')" prop="remark">
          <el-input
            v-model="newFormInline.remark"
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
