import { http } from "@/utils/http";

/**
 * 列表响应通用结构
 * @template T 具体的列表项类型
 */
export type ListResult<T = any> = {
  success?: boolean;
  data?: T;
};

/**
 * 激活码对象结构
 * 说明：字段取自后端返回示例。若后续规范变更，请同步调整此类型。
 */
export interface ActivationCode {
  id: string;
  operatorId: string; // 运营商唯一标识（例如 op_cn_cmcc）
  planId: string; // 套餐唯一标识（例如 plan_global_5gb_30d）
  customerId: string; // 客户ID（例如 cus_001）
  code: string; // 激活码字符串（例如 E123-XXXX-ABCD-XYZ）
  status: "unused" | "used" | "expired";
  createdAt: string; // 创建时间 ISO 字符串
}

/**
 * 订阅对象结构
 * 说明：字段取自后端返回示例。若后续规范变更，请同步调整此类型。
 */
export interface Subscription {
  id: string;
  operatorId: string;
  planId: string;
  customerId: string;
  /**
   * 订阅状态
   * - active: 正常启用
   * - inactive: 已停用
   * - cancelled: 已取消（与 OpenAPI 契约一致）
   */
  status: "active" | "inactive" | "cancelled";
  createdAt: string;
  expiresAt?: string;
}

/**
 * 发票对象结构
 * 说明：后端示例暂未固定字段，保留索引签名以便兼容；可按实际契约逐步完善。
 */
export interface Invoice {
  id: string;
  [key: string]: any;
}

/**
 * 拉取激活码列表（GET /api/activation-codes）
 * 说明：
 * - 请求拦截器会自动注入 Authorization 与 X-Correlation-ID；
 * - 可通过 `beforeRequestCallback` / `beforeResponseCallback` 捕获请求与响应头信息；
 * - 本函数按 ActivationCode[] 类型返回，便于在页面中获得类型提示。
 * @param config 可选扩展配置（如：beforeRequestCallback、beforeResponseCallback）
 * @returns ActivationCode 数组
 */
export const listActivationCodes = (config?: any) => {
  return http.get<ActivationCode[], any>(
    "/api/activation-codes",
    undefined,
    config
  );
};

/**
 * 拉取订阅列表（GET /api/subscriptions）
 * 说明：同上，返回 Subscription[] 类型。
 * @param config 可选扩展配置
 * @returns Subscription 数组
 */
export const listSubscriptions = (config?: any) => {
  return http.get<Subscription[], any>("/api/subscriptions", undefined, config);
};

/**
 * 拉取发票列表（GET /api/billing/invoices）
 * 说明：此接口返回结构暂未严格建模，保持 any，页面展示原始 JSON。
 * @param config 可选扩展配置
 * @returns 任意结构的数组
 */
export const listInvoices = (config?: any) => {
  return http.get<Invoice[], any>("/api/billing/invoices", undefined, config);
};

/**
 * 获取订阅详情（GET /api/subscriptions/:id）
 * @param id 订阅 ID
 * @param config 可选扩展配置
 * @returns Subscription 详情
 */
export const getSubscription = (id: string, config?: any) => {
  return http.get<Subscription, any>(
    `/api/subscriptions/${id}`,
    undefined,
    config
  );
};

/**
 * 获取发票详情（GET /api/billing/invoices/:id）
 * @param id 发票 ID
 * @param config 可选扩展配置
 * @returns 任意结构的发票详情
 */
export const getInvoice = (id: string, config?: any) => {
  return http.get<Invoice, any>(
    `/api/billing/invoices/${encodeURIComponent(id)}`,
    undefined,
    config
  );
};

/**
 * 发票对账（POST /api/billing/invoices/:id/reconcile）
 * 说明：
 * - 根据 OpenAPI 契约，需传入 period 与 reconcileItems；
 * - 该接口用于对账运营商用量、账单与支付流水，返回差异与建议调整；
 * - 可通过 beforeRequestCallback / beforeResponseCallback 捕获请求/响应头。
 * @param id 发票 ID
 * @param payload 对账请求体（例如 { period: "2025-10", reconcileItems: [...] }）
 * @param config 额外 axios 配置与回调
 * @returns 任意结构的对账结果
 */
export const reconcileInvoice = (id: string, payload: any, config?: any) => {
  return http.post<any, any>(
    `/api/billing/invoices/${encodeURIComponent(id)}/reconcile`,
    { data: payload },
    config
  );
};

/**
 * 发票审批（POST /api/billing/invoices/:id/approve）
 * 说明：
 * - 需提供审批人与意见（approvedBy、comment）；
 * - 返回审批后的状态与记录；
 * - 可通过回调捕获 Authorization 与 X-Correlation-ID 用于契约验证。
 * @param id 发票 ID
 * @param payload 审批请求体（例如 { approvedBy: "ops-user", comment: "Looks good" }）
 * @param config 额外 axios 配置与回调
 * @returns 任意结构的审批结果
 */
export const approveInvoice = (id: string, payload: any, config?: any) => {
  return http.post<any, any>(
    `/api/billing/invoices/${encodeURIComponent(id)}/approve`,
    { data: payload },
    config
  );
};

/**
 * 发票签章（POST /api/billing/invoices/:id/sign）
 * 说明：
 * - 需提供签章服务商与印章标识（signatureProvider、sealId）；
 * - 返回签章后的状态与元数据；
 * - 支持通过回调捕获请求/响应头以验证拦截器契约。
 * @param id 发票 ID
 * @param payload 签章请求体（例如 { signatureProvider: "example-sign", sealId: "seal-123" }）
 * @param config 额外 axios 配置与回调
 * @returns 任意结构的签章结果
 */
export const signInvoice = (id: string, payload: any, config?: any) => {
  return http.post<any, any>(
    `/api/billing/invoices/${encodeURIComponent(id)}/sign`,
    { data: payload },
    config
  );
};

/**
 * 下载发票 PDF（GET /api/billing/invoices/:id/pdf）
 * 说明：
 * - 通过 responseType: 'blob' 获取二进制文件；
 * - 可配合页面生成临时 URL 进行下载；
 * - 回调中同样可捕获 X-Correlation-ID 等头部。
 * @param id 发票 ID
 * @param config 额外 axios 配置与回调
 * @returns Blob 对象（二进制 PDF）
 */
export const downloadInvoicePdf = (id: string, config?: any) => {
  const axiosConfig = { responseType: "blob", ...(config || {}) };
  return http.get<Blob, any>(
    `/api/billing/invoices/${encodeURIComponent(id)}/pdf`,
    undefined,
    axiosConfig
  );
};
