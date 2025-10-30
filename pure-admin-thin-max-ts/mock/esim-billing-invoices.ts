import { defineFakeRoute } from "vite-plugin-fake-server/client";

/**
 * eSIM 发票列表（GET /api/billing/invoices）
 * 返回固定数据集，主要用于页面加载与筛选演示（字段相对灵活）。
 */
export default defineFakeRoute([
  {
    url: "/api/billing/invoices",
    method: "get",
    /**
     * 生成示例发票数据，包含金额、状态与创建时间，满足“近7天”等时间筛选演示。
     * @returns any[] 固定数组（发票字段暂不严格建模）
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
          id: "inv-1",
          operatorId: "CMCC",
          amount: 100,
          currency: "CNY",
          status: "paid",
          createdAt: iso(daysAgo(2))
        },
        {
          id: "inv-2",
          operatorId: "CUCC",
          amount: 50,
          currency: "CNY",
          status: "unpaid",
          createdAt: iso(daysAgo(5))
        }
      ];
    }
  }
  ,
  {
    url: "/api/billing/invoices/:id",
    method: "get",
    /**
     * 获取发票详情（GET /api/billing/invoices/:id）
     * 说明：从固定列表中按 id 查找，若未命中则返回占位对象。
     * @returns Invoice 固定对象
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
          id: "inv-1",
          operatorId: "CMCC",
          amount: 100,
          currency: "CNY",
          status: "paid",
          createdAt: iso(daysAgo(2))
        },
        {
          id: "inv-2",
          operatorId: "CUCC",
          amount: 50,
          currency: "CNY",
          status: "unpaid",
          createdAt: iso(daysAgo(5))
        }
      ];

      const id = (params?.id as string) || "inv-1";
      return list.find(item => item.id === id) || list[0];
    }
  }
]);
