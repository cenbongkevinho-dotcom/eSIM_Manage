import { i18n } from "@/plugins/i18n";

/**
 * 返回當前應用的語言代碼（Locale）。
 * 說明：封裝 i18n.global.locale.value，確保在工具內部獲取一致的語言配置。
 */
export function getCurrentLocale(): string {
  return i18n.global.locale.value as string;
}

/**
 * 使用 Intl.DateTimeFormat 進行日期格式化。
 * @param value 可被 Date 構造的值（Date | number | string）
 * @param options Intl.DateTimeFormatOptions（例如 { year: 'numeric', month: '2-digit', day: '2-digit' }）
 * @returns 格式化後的日期字串
 */
export function formatDate(
  value: Date | number | string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }
): string {
  try {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(getCurrentLocale(), options).format(date);
  } catch {
    return String(value ?? "");
  }
}

/**
 * 使用 Intl.NumberFormat 進行數字格式化。
 * @param value 數字值
 * @param options Intl.NumberFormatOptions（例如 { maximumFractionDigits: 2 }）
 * @returns 格式化後的數字字串
 */
export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {
    maximumFractionDigits: 2
  }
): string {
  try {
    return new Intl.NumberFormat(getCurrentLocale(), options).format(value);
  } catch {
    return String(value ?? "");
  }
}

/**
 * 使用 Intl.NumberFormat 進行貨幣格式化。
 * @param value 金額數值
 * @param currency 貨幣代碼（例如 'CNY' | 'USD' | 'JPY'）
 * @param options 其他 Intl.NumberFormatOptions，將與基本貨幣配置合併
 * @returns 格式化後的貨幣字串
 */
export function formatCurrency(
  value: number,
  currency: string,
  options: Intl.NumberFormatOptions = {}
): string {
  try {
    return new Intl.NumberFormat(getCurrentLocale(), {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
      ...options
    }).format(value);
  } catch {
    return String(value ?? "");
  }
}
