import { http } from "@/utils/http";

export type Operator = {
  id: string;
  name: string;
  code: string;
  country: string;
  status: "active" | "inactive";
};

/**
 * 列出运营商（GET /api/operators）
 * 说明：
 * - 通过 Vite 代理将 /api 路由转发到 Prism（http://localhost:4010）；
 * - 请求拦截器会自动注入 Authorization 与 X-Correlation-ID；
 * - 支持传入 beforeRequestCallback 与 beforeResponseCallback 以捕获请求侧/响应侧头部信息。
 * @param config 可选扩展配置（含前后回调）
 * @returns 运营商数组
 */
export const listOperators = (config?: any) => {
  return http.get<Operator[], any>("/api/operators", undefined, config);
};
