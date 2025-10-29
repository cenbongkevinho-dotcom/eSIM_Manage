const Layout = () => import("@/layout/index.vue");

export default [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      // 登录页标题使用 i18n 键
      title: "routes.login",
      showLink: false
    }
  },
  // 全屏403（无权访问）页面
  {
    path: "/access-denied",
    name: "AccessDenied",
    component: () => import("@/views/error/403.vue"),
    meta: {
      // 403 错误页标题使用 i18n 键
      title: "routes.error403",
      showLink: false
    }
  },
  // 全屏500（服务器出错）页面
  {
    path: "/server-error",
    name: "ServerError",
    component: () => import("@/views/error/500.vue"),
    meta: {
      // 500 错误页标题使用 i18n 键
      title: "routes.error500",
      showLink: false
    }
  },
  {
    path: "/redirect",
    component: Layout,
    meta: {
      // 重定向页标题使用通用加载文案 i18n 键
      title: "common.loading",
      showLink: false
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "Redirect",
        component: () => import("@/layout/redirect.vue")
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
