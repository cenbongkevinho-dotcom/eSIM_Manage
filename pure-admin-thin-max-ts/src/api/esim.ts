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

// 开发环境模拟数据
const mockData = import.meta.env.DEV ? {
  // 生成随机日期
  randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  },
  
  // 生成随机状态
  randomStatus<T extends string>(statuses: T[]): T {
    return statuses[Math.floor(Math.random() * statuses.length)];
  },
  
  // 运营商列表
  operators: ['op_cn_cmcc', 'op_cn_unicom', 'op_cn_telecom', 'op_global_airalo', 'op_global_holafly'],
  
  // 套餐列表
  plans: ['plan_global_5gb_30d', 'plan_cn_10gb_30d', 'plan_cn_20gb_30d', 'plan_global_2gb_7d', 'plan_global_10gb_30d'],
  
  // 生成激活码数据
  activationCodes: Array.from({ length: 50 }, (_, index) => ({
    id: `activation_code_${index + 1}`,
    operatorId: 'op_cn_cmcc', // 使用固定运营商便于测试
    planId: 'plan_global_5gb_30d', // 使用固定套餐便于测试
    customerId: `cus_${Math.floor(Math.random() * 50) + 1}`,
    code: `E${Math.floor(Math.random() * 1000)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`,
    status: index % 3 === 0 ? 'unused' : index % 3 === 1 ? 'used' : 'expired', // 平均分布状态
    createdAt: new Date(Date.now() - index * 86400000).toISOString() // 连续的日期
  })),
  
  // 生成订阅数据
  subscriptions: Array.from({ length: 30 }, (_, index) => ({
    id: `subscription_${index + 1}`,
    operatorId: index % 5 === 0 ? 'op_cn_cmcc' : index % 5 === 1 ? 'op_cn_unicom' : index % 5 === 2 ? 'op_cn_telecom' : index % 5 === 3 ? 'op_global_airalo' : 'op_global_holafly',
    planId: 'plan_global_5gb_30d',
    customerId: `cus_${Math.floor(Math.random() * 50) + 1}`,
    status: index % 3 === 0 ? 'active' : index % 3 === 1 ? 'inactive' : 'cancelled', // 平均分布状态
    createdAt: new Date(Date.now() - index * 172800000).toISOString(), // 连续的日期
    expiresAt: new Date(Date.now() + (30 - index) * 86400000).toISOString()
  })),
  
  // 生成发票数据
  invoices: Array.from({ length: 20 }, (_, index) => ({
    id: `invoice_${index + 1}`,
    subscriptionId: `subscription_${index % 30 + 1}`,
    customerId: `cus_${Math.floor(Math.random() * 50) + 1}`,
    operatorId: index % 5 === 0 ? 'op_cn_cmcc' : index % 5 === 1 ? 'op_cn_unicom' : index % 5 === 2 ? 'op_cn_telecom' : index % 5 === 3 ? 'op_global_airalo' : 'op_global_holafly',
    period: `2024-${String(Math.floor(index / 2) + 1).padStart(2, '0')}`,
    amount: (index + 1) * 100,
    currency: 'USD',
    status: index % 4 === 0 ? 'draft' : index % 4 === 1 ? 'issued' : index % 4 === 2 ? 'paid' : 'overdue',
    createdAt: new Date(Date.now() - index * 2592000000).toISOString(),
    dueDate: new Date(Date.now() + (30 - index) * 86400000).toISOString()
  }))
} : null;

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
  // 开发环境返回模拟数据
  if (import.meta.env.DEV && mockData) {
    // 模拟请求延迟
    return new Promise<ActivationCode[]>((resolve) => {
      setTimeout(() => {
        // 模拟回调处理
        if (config?.beforeRequestCallback) {
          config.beforeRequestCallback({ headers: { 'X-Correlation-ID': 'mock-correlation-id', 'Authorization': 'Bearer mock-token' } });
        }
        if (config?.beforeResponseCallback) {
          config.beforeResponseCallback({ headers: { 'X-Correlation-ID': 'mock-correlation-id' } } as any);
        }
        resolve(mockData.activationCodes);
      }, 300);
    });
  }
  
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
  // 开发环境返回模拟数据
  if (import.meta.env.DEV && mockData) {
    return new Promise<Subscription[]>((resolve) => {
      setTimeout(() => {
        if (config?.beforeRequestCallback) {
          config.beforeRequestCallback({ headers: { 'X-Correlation-ID': 'mock-correlation-id', 'Authorization': 'Bearer mock-token' } });
        }
        if (config?.beforeResponseCallback) {
          config.beforeResponseCallback({ headers: { 'X-Correlation-ID': 'mock-correlation-id' } } as any);
        }
        resolve(mockData.subscriptions);
      }, 300);
    });
  }
  
  return http.get<Subscription[], any>("/api/subscriptions", undefined, config);
};

/**
 * 拉取发票列表（GET /api/billing/invoices）
 * 说明：此接口返回结构暂未严格建模，保持 any，页面展示原始 JSON。
 * @param config 可选扩展配置
 * @returns 任意结构的数组
 */
export const listInvoices = (config?: any) => {
  // 开发环境返回模拟数据
  if (import.meta.env.DEV && mockData) {
    return new Promise<Invoice[]>((resolve) => {
      setTimeout(() => {
        if (config?.beforeRequestCallback) {
          config.beforeRequestCallback({ headers: { 'X-Correlation-ID': 'mock-correlation-id', 'Authorization': 'Bearer mock-token' } });
        }
        if (config?.beforeResponseCallback) {
          config.beforeResponseCallback({ headers: { 'X-Correlation-ID': 'mock-correlation-id' } } as any);
        }
        resolve(mockData.invoices);
      }, 300);
    });
  }
  
  return http.get<Invoice[], any>("/api/billing/invoices", undefined, config);
};

/**
 * 获取订阅详情（GET /api/subscriptions/:id）
 * @param id 订阅 ID
 * @param config 可选扩展配置
 * @returns Subscription 详情
 */
export const getSubscription = (id: string, config?: any) => {
  // 开发环境返回模拟数据
  if (import.meta.env.DEV && mockData) {
    return new Promise<Subscription>((resolve, reject) => {
      setTimeout(() => {
        const subscription = mockData.subscriptions.find(s => s.id === id);
        if (subscription) {
          if (config?.beforeRequestCallback) {
            config.beforeRequestCallback({ headers: { 'X-Correlation-ID': 'mock-correlation-id', 'Authorization': 'Bearer mock-token' } });
          }
          if (config?.beforeResponseCallback) {
            config.beforeResponseCallback({ headers: { 'X-Correlation-ID': 'mock-correlation-id' } } as any);
          }
          resolve(subscription);
        } else {
          reject(new Error('Subscription not found'));
        }
      }, 300);
    });
  }
  
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
  // 开发环境返回模拟数据
  if (import.meta.env.DEV && mockData) {
    return new Promise<Invoice>((resolve, reject) => {
      setTimeout(() => {
        const invoice = mockData.invoices.find(i => i.id === id);
        if (invoice) {
          if (config?.beforeRequestCallback) {
            config.beforeRequestCallback({ headers: { 'X-Correlation-ID': 'mock-correlation-id', 'Authorization': 'Bearer mock-token' } });
          }
          if (config?.beforeResponseCallback) {
            config.beforeResponseCallback({ headers: { 'X-Correlation-ID': 'mock-correlation-id' } } as any);
          }
          resolve(invoice);
        } else {
          reject(new Error('Invoice not found'));
        }
      }, 300);
    });
  }
  
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
  // 开发环境返回模拟数据
  if (import.meta.env.DEV) {
    return new Promise<any>((resolve) => {
      setTimeout(() => {
        if (config?.beforeRequestCallback) {
          config.beforeRequestCallback({ headers: { 'X-Correlation-ID': 'mock-correlation-id', 'Authorization': 'Bearer mock-token' } });
        }
        if (config?.beforeResponseCallback) {
          config.beforeResponseCallback({ headers: { 'X-Correlation-ID': 'mock-correlation-id' } } as any);
        }
        resolve({
          success: true,
          message: '对账成功',
          data: {
            differences: [],
            totalAmount: 1000,
            reconcileItems: []
          }
        });
      }, 300);
    });
  }
  
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
  // 开发环境返回模拟数据
  if (import.meta.env.DEV) {
    return new Promise<any>((resolve) => {
      setTimeout(() => {
        if (config?.beforeRequestCallback) {
          config.beforeRequestCallback({ headers: { 'X-Correlation-ID': 'mock-correlation-id', 'Authorization': 'Bearer mock-token' } });
        }
        if (config?.beforeResponseCallback) {
          config.beforeResponseCallback({ headers: { 'X-Correlation-ID': 'mock-correlation-id' } } as any);
        }
        resolve({
          success: true,
          message: '审批成功',
          status: 'approved'
        });
      }, 300);
    });
  }
  
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
  // 开发环境返回模拟数据
  if (import.meta.env.DEV) {
    return new Promise<any>((resolve) => {
      setTimeout(() => {
        if (config?.beforeRequestCallback) {
          config.beforeRequestCallback({ headers: { 'X-Correlation-ID': 'mock-correlation-id', 'Authorization': 'Bearer mock-token' } });
        }
        if (config?.beforeResponseCallback) {
          config.beforeResponseCallback({ headers: { 'X-Correlation-ID': 'mock-correlation-id' } } as any);
        }
        resolve({
          success: true,
          message: '签章成功',
          status: 'signed'
        });
      }, 300);
    });
  }
  
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
  // 开发环境返回模拟数据
  if (import.meta.env.DEV) {
    return new Promise<Blob>((resolve) => {
      setTimeout(() => {
        if (config?.beforeRequestCallback) {
          config.beforeRequestCallback({ headers: { 'X-Correlation-ID': 'mock-correlation-id', 'Authorization': 'Bearer mock-token' } });
        }
        if (config?.beforeResponseCallback) {
          config.beforeResponseCallback({ headers: { 'X-Correlation-ID': 'mock-correlation-id' } } as any);
        }
        // 创建一个简单的PDF文件（实际应用中应该返回真实的PDF）
        const blob = new Blob(['Mock PDF Content for invoice ' + id], { type: 'application/pdf' });
        resolve(blob);
      }, 300);
    });
  }
  
  const axiosConfig = { responseType: "blob", ...(config || {}) };
  return http.get<Blob, any>(
    `/api/billing/invoices/${encodeURIComponent(id)}/pdf`,
    undefined,
    axiosConfig
  );
};
