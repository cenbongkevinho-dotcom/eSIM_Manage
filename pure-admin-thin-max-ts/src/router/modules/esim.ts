const Layout = () => import("@/layout/index.vue");
import { getIconName } from "@/icons/aliases";

export default {
  path: "/esim",
  name: "eSIM",
  component: Layout,
  redirect: "/esim/operators/activation-codes",
  meta: {
    icon: getIconName("home"),
    // 顶级 eSIM 管理标题使用 i18n 键
    title: "routes.esim.root",
    rank: 10
  },
  children: [
    {
      path: "/esim/operators/activation-codes",
      name: "ActivationCodes",
      component: () => import("@/views/esim/activation-codes/index.vue"),
      meta: {
        icon: getIconName("activationCodes"),
        // 激活码列表页标题使用 i18n 键
        title: "routes.esim.activationCodes",
        showLink: true
      }
    },
    {
      path: "/esim/customers/subscriptions",
      name: "Subscriptions",
      component: () => import("@/views/esim/subscriptions/index.vue"),
      meta: {
        icon: getIconName("subscriptions"),
        // 订阅列表页标题使用 i18n 键
        title: "routes.esim.subscriptions",
        showLink: true
      }
    },
    {
      path: "/esim/customers/subscriptions/:id",
      name: "SubscriptionDetail",
      component: () => import("@/views/esim/subscriptions/detail.vue"),
      meta: {
        icon: getIconName("subscriptions"),
        // 订阅详情页标题使用 i18n 键
        title: "routes.esim.subscriptionDetail",
        showLink: false
      }
    },
    {
      path: "/esim/billing/invoices",
      name: "Invoices",
      component: () => import("@/views/esim/invoices/index.vue"),
      meta: {
        icon: getIconName("calendar"),
        // 发票列表页标题使用 i18n 键
        title: "routes.esim.invoices",
        showLink: true
      }
    },
    {
      path: "/esim/billing/invoices/:id",
      name: "InvoiceDetail",
      component: () => import("@/views/esim/invoices/detail.vue"),
      meta: {
        icon: getIconName("calendar"),
        // 发票详情页标题使用 i18n 键
        title: "routes.esim.invoiceDetail",
        showLink: false
      }
    }
  ]
} satisfies RouteConfigsTable;
