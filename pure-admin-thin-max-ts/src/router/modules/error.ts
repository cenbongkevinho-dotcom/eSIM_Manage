export default {
  path: "/error",
  redirect: "/error/403",
  meta: {
    // 统一为冒号风格，运行时由 useRenderIcon/SmartIcon 离线优先 + 在线回退渲染
    icon: "ri:information-line",
    // showLink: false,
    title: "routes.error.root",
    rank: 9
  },
  children: [
    {
      path: "/error/403",
      name: "403",
      component: () => import("@/views/error/403.vue"),
      meta: {
        title: "routes.error403"
      }
    },
    {
      path: "/error/404",
      name: "404",
      component: () => import("@/views/error/404.vue"),
      meta: {
        title: "routes.error404"
      }
    },
    {
      path: "/error/500",
      name: "500",
      component: () => import("@/views/error/500.vue"),
      meta: {
        title: "routes.error500"
      }
    }
  ]
} satisfies RouteConfigsTable;
