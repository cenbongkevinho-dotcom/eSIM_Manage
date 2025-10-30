import { defineFakeRoute } from "vite-plugin-fake-server/client";

/**
 * eSIM 订阅列表（GET /api/subscriptions）
 * 返回固定数据集，支持图表与导出功能的演示与 E2E 测试。
 */
export default defineFakeRoute([
  {
    url: "/api/subscriptions",
    method: "get",
    /**
     * 生成近 15 天内的订阅数据，覆盖不同运营商与状态，便于筛选与分组图表演示。
     * @returns Subscription[] 固定数组
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
          id: "sub-1",
          operatorId: "CMCC",
          planId: "plan_cn_cmcc_1gb_7d",
          customerId: "cus_001",
          status: "active",
          createdAt: iso(daysAgo(0))
        },
        {
          id: "sub-2",
          operatorId: "CMCC",
          planId: "plan_cn_cmcc_1gb_7d",
          customerId: "cus_002",
          status: "inactive",
          createdAt: iso(daysAgo(1))
        },
        {
          id: "sub-3",
          operatorId: "CUCC",
          planId: "plan_cn_cucc_3gb_30d",
          customerId: "cus_003",
          status: "active",
          createdAt: iso(daysAgo(2))
        },
        {
          id: "sub-4",
          operatorId: "CTCC",
          planId: "plan_cn_ctcc_2gb_15d",
          customerId: "cus_004",
          status: "active",
          createdAt: iso(daysAgo(10))
        },
        {
          id: "sub-5",
          operatorId: "CMCC",
          planId: "plan_cn_cmcc_1gb_7d",
          customerId: "cus_005",
          status: "active",
          createdAt: iso(daysAgo(15))
        }
      ];
    }
  }
  ,
  {
    url: "/api/subscriptions/:id",
    method: "get",
    /**
     * 获取订阅详情（GET /api/subscriptions/:id）
     * 说明：从固定列表中按 id 查找，若未命中则返回一个占位对象。
     * @returns Subscription 固定对象
     */
    response: ({ params }) => {
      const now = new Date();
      const iso = (d: Date) => d.toISOString();
      const daysAgo = (n: number) => {
        const d = new Date(now.getTime());
        d.setDate(d.getDate() - n);
        return d;
      };

      const list = [
        {
          id: "sub-1",
          operatorId: "CMCC",
          planId: "plan_cn_cmcc_1gb_7d",
          customerId: "cus_001",
          status: "active",
          createdAt: iso(daysAgo(0))
        },
        {
          id: "sub-2",
          operatorId: "CMCC",
          planId: "plan_cn_cmcc_1gb_7d",
          customerId: "cus_002",
          status: "inactive",
          createdAt: iso(daysAgo(1))
        },
        {
          id: "sub-3",
          operatorId: "CUCC",
          planId: "plan_cn_cucc_3gb_30d",
          customerId: "cus_003",
          status: "active",
          createdAt: iso(daysAgo(2))
        },
        {
          id: "sub-4",
          operatorId: "CTCC",
          planId: "plan_cn_ctcc_2gb_15d",
          customerId: "cus_004",
          status: "active",
          createdAt: iso(daysAgo(10))
        },
        {
          id: "sub-5",
          operatorId: "CMCC",
          planId: "plan_cn_cmcc_1gb_7d",
          customerId: "cus_005",
          status: "active",
          createdAt: iso(daysAgo(15))
        }
      ];

      const id = (params?.id as string) || "sub-1";
      return list.find(item => item.id === id) || list[0];
    }
  }
]);
