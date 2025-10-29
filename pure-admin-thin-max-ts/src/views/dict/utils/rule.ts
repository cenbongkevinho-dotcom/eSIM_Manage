import { reactive } from "vue";
import type { FormRules } from "element-plus";
import { i18n } from "@/plugins/i18n";

/**
 * 字典管理页面的表单规则。
 * 使用 i18n 返回错误提示，确保不同语言环境下文案一致。
 * 注意：若切换语言后需要更新提示文案，可在调用处重新初始化规则对象。
 */
const t = i18n.global.t;

/**
 * 字典详情（标签/值/颜色/排序/状态/备注）表单的规则定义。
 * 当前仅校验 label/value 的必填。
 */
export const formRules = reactive(<FormRules>{
  label: [
    {
      required: true,
      message: t("views.dict.rules.labelRequired"),
      trigger: "blur"
    }
  ],
  value: [
    {
      required: true,
      message: t("views.dict.rules.valueRequired"),
      trigger: "blur"
    }
  ]
});

/**
 * 字典（名称/编码/描述）表单的规则定义。
 * 当前仅校验 name/code 的必填。
 */
export const dictFormRules = reactive(<FormRules>{
  name: [
    {
      required: true,
      message: t("views.dict.rules.nameRequired"),
      trigger: "blur"
    }
  ],
  code: [
    {
      required: true,
      message: t("views.dict.rules.codeRequired"),
      trigger: "blur"
    }
  ]
});
