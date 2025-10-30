import { defineFakeRoute } from "vite-plugin-fake-server";

/**
 * 发票操作相关接口 Mock
 * 覆盖：POST /api/billing/invoices/:id/reconcile、/approve、/sign
 * 返回：简单操作结果，包含传入的 id 与新状态。
 */
export default defineFakeRoute([
  {
    url: "/api/billing/invoices/:id/reconcile",
    method: "post",
    /**
     * 对账发票（POST /api/billing/invoices/:id/reconcile）
     * @param body 任意请求体（前端无需关注）
     * @param params 路径参数，包含 id
     * @returns 操作结果对象
     */
    response: ({ body, params }) => {
      const id = (params?.id as string) || "inv-1";
      return {
        success: true,
        id,
        action: "reconcile",
        status: "reconciled",
        // echo 传入请求体，便于调试
        echo: body ?? null,
        processedAt: new Date().toISOString()
      };
    }
  },
  {
    url: "/api/billing/invoices/:id/approve",
    method: "post",
    /**
     * 审批发票（POST /api/billing/invoices/:id/approve）
     * @param body 任意请求体
     * @param params 路径参数，包含 id
     * @returns 操作结果对象
     */
    response: ({ body, params }) => {
      const id = (params?.id as string) || "inv-1";
      return {
        success: true,
        id,
        action: "approve",
        status: "approved",
        echo: body ?? null,
        processedAt: new Date().toISOString()
      };
    }
  },
  {
    url: "/api/billing/invoices/:id/sign",
    method: "post",
    /**
     * 电子签章（POST /api/billing/invoices/:id/sign）
     * @param body 任意请求体
     * @param params 路径参数，包含 id
     * @returns 操作结果对象
     */
    response: ({ body, params }) => {
      const id = (params?.id as string) || "inv-1";
      return {
        success: true,
        id,
        action: "sign",
        status: "signed",
        echo: body ?? null,
        processedAt: new Date().toISOString()
      };
    }
  }
]);
