import { createI18n } from "vue-i18n";
import { ref } from "vue";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import en from "element-plus/es/locale/lang/en";
import zhTw from "element-plus/es/locale/lang/zh-tw";
import ja from "element-plus/es/locale/lang/ja";
import zhMessages from "@/locales/zh-CN";
import enMessages from "@/locales/en-US";
import zhTwMessages from "@/locales/zh-TW";
import jaJPMessages from "@/locales/ja-JP";

/**
 * i18n 插件初始化与语言切换工具。
 * 功能说明：
 * - 初始化 vue-i18n，加载 zh-CN / en-US / zh-TW / ja-JP 语言包；
 * - 通过 localStorage + 浏览器语言进行语言协商，确定初始语言；
 * - 暴露 elementLocaleRef，以便 Element Plus 的 ElConfigProvider 动态跟随切换；
 * - 提供 setAppLocale(locale) 方法，统一切换应用与组件库的语言并持久化。
 */

export type SupportedLocale = "zh-CN" | "en-US" | "zh-TW" | "ja-JP";

// Element Plus 语言包的响应式引用，供 App.vue 注入到 ElConfigProvider
export const elementLocaleRef = ref(zhCn);

// 应用支持的消息字典
const messages = {
  "zh-CN": zhMessages,
  "en-US": enMessages,
  "zh-TW": zhTwMessages,
  "ja-JP": jaJPMessages
};

/**
 * 归一化并选择受支持的语言代码。
 * @param raw 浏览器或存储中的原始语言标识
 * @returns 受支持的语言代码（zh-CN / en-US / zh-TW / ja-JP）
 */
function normalizeToSupported(raw: string | null | undefined): SupportedLocale {
  const val = (raw || "").toLowerCase();
  // 中文：简体与繁体（zh, zh-cn -> zh-CN；zh-hant / zh-tw -> zh-TW）
  if (val.startsWith("zh")) {
    if (val.includes("hant") || val.includes("tw")) return "zh-TW";
    return "zh-CN";
  }
  // 日文：ja, ja-jp
  if (val.startsWith("ja")) return "ja-JP";
  // 其他默认英文
  return "en-US";
}

/**
 * 计算应用初始语言：优先 localStorage，其次浏览器语言，最后默认 zh-CN。
 */
function resolveInitialLocale(): SupportedLocale {
  const fromStorage = normalizeToSupported(localStorage.getItem("locale"));
  if (fromStorage) return fromStorage;
  const browserLangs =
    navigator.languages?.[0] || navigator.language || "zh-CN";
  return normalizeToSupported(browserLangs);
}

// 创建 i18n 实例
export const i18n = createI18n({
  legacy: false,
  locale: resolveInitialLocale(),
  fallbackLocale: "zh-CN",
  messages
});

// 初始化 Element Plus 的语言包引用
/**
 * 根据应用语言设置 Element Plus 语言包。
 * @param locale 目标语言
 */
function setElementLocale(locale: SupportedLocale) {
  switch (locale) {
    case "en-US":
      elementLocaleRef.value = en;
      break;
    case "zh-TW":
      elementLocaleRef.value = zhTw;
      break;
    case "ja-JP":
      elementLocaleRef.value = ja;
      break;
    default:
      elementLocaleRef.value = zhCn;
  }
}

// 初始化 Element Plus 语言包
setElementLocale(i18n.global.locale.value as SupportedLocale);

/**
 * 切换应用语言（包含 vue-i18n 与 Element Plus）。
 * @param locale 目标语言代码，支持 zh-CN / en-US / zh-TW / ja-JP
 */
export function setAppLocale(locale: SupportedLocale) {
  // 切换 vue-i18n 语言
  i18n.global.locale.value = locale;
  // 持久化到本地存储
  localStorage.setItem("locale", locale);
  // Element Plus 语言联动
  setElementLocale(locale);
  // 设置 html lang 属性，便于无障碍与第三方（如密码管理）识别
  document.documentElement.lang = locale;
}

/**
 * 在应用入口处安装 i18n 插件。
 * @param app Vue 应用实例
 */
export function setupI18n(app: import("vue").App) {
  app.use(i18n);
}
