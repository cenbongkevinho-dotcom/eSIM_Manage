// 模拟后端动态生成路由
import { defineFakeRoute } from "vite-plugin-fake-server/client";

/**
 * roles：页面级别权限，这里模拟二种 "admin"、"common"
 * admin：管理员角色
 * common：普通角色
 */

const permissionRouter = {
  path: "/permission",
  meta: {
    title: "权限管理",
    icon: "ep/lollipop",
    rank: 10
  },
  children: [
    {
      path: "/permission/page/index",
      name: "PermissionPage",
      meta: {
        title: "页面权限",
        roles: ["admin", "common"]
      }
    },
    {
      path: "/permission/button",
      meta: {
        title: "按钮权限",
        roles: ["admin", "common"]
      },
      children: [
        {
          path: "/permission/button/router",
          component: "permission/button/index",
          name: "PermissionButtonRouter",
          meta: {
            title: "路由返回按钮权限",
            auths: [
              "permission:btn:add",
              "permission:btn:edit",
              "permission:btn:delete"
            ]
          }
        },
        {
          path: "/permission/button/login",
          component: "permission/button/perms",
          name: "PermissionButtonLogin",
          meta: {
            title: "登录接口返回按钮权限"
          }
        }
      ]
    }
  ]
};

const scheduleRouter = {
  path: "/schedule",
  meta: {
    icon: "ri/calendar-todo-line",
    title: "日历排班",
    rank: 11
  },
  children: [
    {
      path: "/schedule/index",
      name: "Schedule",
      meta: {
        title: "日历排班",
        roles: ["admin"]
      }
    }
  ]
};

const dictManagementRouter = {
  path: "/dict",
  meta: {
    icon: "ri/book-2-line",
    title: "字典管理",
    rank: 12
  },
  children: [
    {
      path: "/dict/index",
      name: "SystemDict",
      meta: {
        title: "字典管理",
        roles: ["admin"]
      }
    }
  ]
};

const tenantManagementRouter = {
  path: "/tenant",
  meta: {
    icon: "ri/home-gear-line",
    title: "租户管理",
    rank: 13
  },
  children: [
    {
      path: "/tenant/list/index",
      name: "TenantList",
      meta: {
        icon: "ri/list-check",
        title: "租户列表",
        roles: ["admin"]
      }
    },
    {
      path: "/tenant/package/index",
      name: "TenantPackage",
      meta: {
        icon: "ri/file-paper-line",
        title: "租户套餐",
        roles: ["admin"]
      }
    }
  ]
};

export default defineFakeRoute([
  {
    url: "/get-async-routes",
    method: "get",
    response: () => {
      return {
        success: true,
        data: [
          permissionRouter,
          scheduleRouter,
          dictManagementRouter,
          tenantManagementRouter
        ]
      };
    }
  }
]);
