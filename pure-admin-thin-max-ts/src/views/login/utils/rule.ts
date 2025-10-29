import { reactive } from "vue";
import { i18n } from "@/plugins/i18n";
import type { FormRules } from "element-plus";

/** 密码正则（密码格式应为8-18位数字、字母、符号的任意两种组合） */
export const REGEXP_PWD =
  /^(?![0-9]+$)(?![a-z]+$)(?![A-Z]+$)(?!([^(0-9a-zA-Z)]|[()])+$)(?!^.*[\u4E00-\u9FA5].*$)([^(0-9a-zA-Z)]|[()]|[a-z]|[A-Z]|[0-9]){8,18}$/;

/**
 * 校验密码。使用 i18n 返回错误提示。
 * 规则：
 * 1) 必填；
 * 2) 必须满足 8-18 位，且至少包含数字/字母/符号中的两种组合。
 * @param rule Element Plus 的规则对象（未使用）
 * @param value 当前输入的密码字符串
 * @param callback 回调函数；传入 Error 表示校验失败
 */
function validatePassword(
  rule: any,
  value: string,
  callback: (error?: Error) => void
) {
  const t = i18n.global.t;
  if (!value) {
    callback(new Error(t("login.rules.passwordRequired")));
    return;
  }
  if (!REGEXP_PWD.test(value)) {
    callback(new Error(t("login.rules.passwordPattern")));
    return;
  }
  callback();
}

/** 登录校验 */
const loginRules = reactive<FormRules>({
  password: [
    {
      validator: validatePassword,
      trigger: "blur"
    }
  ]
});

export { loginRules };
