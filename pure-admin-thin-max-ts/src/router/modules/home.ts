const { VITE_HIDE_HOME } = import.meta.env;
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/",
  name: "Home",
  component: Layout,
  redirect: "/welcome",
  meta: {
    // 统一为在线冒号风格，便于通过 Iconify API 按需加载
    icon: "ep:home-filled",
    // 使用 i18n 路由标题键
    title: "routes.home",
    rank: 0
  },
  children: [
    {
      path: "/welcome",
      name: "Welcome",
      component: () => import("@/views/welcome/index.vue"),
      meta: {
        // 使用与首页一致的 i18n 键
        title: "routes.home",
        showLink: VITE_HIDE_HOME === "true" ? false : true
      }
    }
  ]
} satisfies RouteConfigsTable;
