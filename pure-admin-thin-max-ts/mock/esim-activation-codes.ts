import { defineFakeRoute } from "vite-plugin-fake-server/client";

/**
 * eSIM 激活码列表（GET /api/activation-codes）
 * 返回固定数据集，确保 dev/preview 环境在无后端时也能正常演示与进行 E2E 测试。
 * 数据字段尽量与 src/api/esim.ts 的 ActivationCode 接口保持一致。
 */
export default defineFakeRoute([
  {
    url: "/api/activation-codes",
    method: "get",
    /**
     * 生成近 15 天内的测试数据，用于支持“近7天”等时间预设的筛选逻辑。
     * @returns ActivationCode[] 固定数组
     */
    response: () => {
      const now = new Date();
      const iso = (d: Date) => d.toISOString();
      const daysAgo = (n: number) => {
        const d = new Date(now.getTime());
        d.setDate(d.getDate() - n);
        return d;
      };

      return [
        {
          id: "ac-1",
          operatorId: "CMCC",
          planId: "plan_cn_cmcc_1gb_7d",
          customerId: "cus_001",
          code: "E123-ABCD-0001",
          status: "unused",
          createdAt: iso(daysAgo(1))
        },
        {
          id: "ac-2",
          operatorId: "CMCC",
          planId: "plan_cn_cmcc_1gb_7d",
          customerId: "cus_002",
          code: "E123-ABCD-0002",
          status: "used",
          createdAt: iso(daysAgo(2))
        },
        {
          id: "ac-3",
          operatorId: "CUCC",
          planId: "plan_cn_cucc_3gb_30d",
          customerId: "cus_003",
          code: "E123-ABCD-0003",
          status: "unused",
          createdAt: iso(daysAgo(3))
        },
        {
          id: "ac-4",
          operatorId: "CTCC",
          planId: "plan_cn_ctcc_2gb_15d",
          customerId: "cus_004",
          code: "E123-ABCD-0004",
          status: "used",
          createdAt: iso(daysAgo(4))
        },
        {
          id: "ac-5",
          operatorId: "CMCC",
          planId: "plan_cn_cmcc_1gb_7d",
          customerId: "cus_005",
          code: "E123-ABCD-0005",
          status: "unused",
          createdAt: iso(daysAgo(6))
        }
      ];
    }
  }
]);

