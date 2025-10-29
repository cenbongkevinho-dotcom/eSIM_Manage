import { reactive } from "vue";
import type { FormRules } from "element-plus";
import { i18n } from "@/plugins/i18n";

/**
 * 租户套餐表单规则校验。
 * 使用 i18n.global.t 返回错误提示，确保不同语言环境下文案一致。
 */
const t = i18n.global.t;

export const formRules = reactive(<FormRules>{
  name: [
    {
      required: true,
      message: t("views.tenant.package.rules.nameRequired"),
      trigger: "blur"
    }
  ]
});
