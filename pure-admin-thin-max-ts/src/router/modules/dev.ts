const Layout = () => import("@/layout/index.vue");

export default {
  path: "/dev",
  name: "DevTools",
  component: Layout,
  redirect: "/dev/icon-audit",
  meta: {
    // 仅在开发模式展示到菜单
    title: "开发工具",
    icon: "ri:tools-line",
    showLink: import.meta.env.DEV === true,
    rank: 9999
  },
  children: [
    {
      path: "/dev/icon-audit",
      name: "IconAudit",
      component: () => import("@/views/dev/IconAudit/index.vue"),
      meta: {
        title: "Icon 校验",
        icon: "ri:focus-2-line",
        showLink: import.meta.env.DEV === true
      }
    },
    {
      path: "/dev/schedule-preview",
      name: "ScheduleDevPreview",
      component: () => import("@/views/schedule/index.vue"),
      meta: {
        title: "Schedule 预览",
        icon: "ri:calendar-line",
        showLink: import.meta.env.DEV === true
      }
    }
  ]
} satisfies RouteConfigsTable;
