<script setup lang="ts">
import { hasPerms } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";
import { useI18n } from "vue-i18n";

/**
 * 组件说明：权限按钮演示页
 * 展示三种权限判断方式（组件方式、函数方式、指令方式），并通过国际化展示说明文案。
 */

/**
 * 获取用户权限列表
 * 来自用户 Store，用于在页面顶部展示当前拥有的权限码列表
 */
const { permissions } = useUserStoreHook();

/**
 * 国际化 t 函数
 * 用于模板内的文案翻译与插值
 */
const { t } = useI18n();

defineOptions({
  name: "PermissionButtonLogin"
});
</script>

<template>
  <div>
    <p class="mb-2!">
      {{ t("views.permission.perms.currentCodes") }}{{ permissions }}
    </p>
    <p v-show="permissions?.[0] === '*:*:*'" class="mb-2!">
      {{ t("views.permission.perms.allPermsNotice") }}
    </p>

    <el-card shadow="never" class="mb-2">
      <template #header>
        <div class="card-header">
          {{ t("views.permission.perms.componentCheckTitle") }}
        </div>
      </template>
      <el-space wrap>
        <Perms value="permission:btn:add">
          <el-button plain type="warning">
            {{
              t("views.permission.perms.visibleWhen", {
                codes: "'permission:btn:add'"
              })
            }}
          </el-button>
        </Perms>
        <Perms :value="['permission:btn:edit']">
          <el-button plain type="primary">
            {{
              t("views.permission.perms.visibleWhen", {
                codes: "['permission:btn:edit']"
              })
            }}
          </el-button>
        </Perms>
        <Perms
          :value="[
            'permission:btn:add',
            'permission:btn:edit',
            'permission:btn:delete'
          ]"
        >
          <el-button plain type="danger">
            {{
              t("views.permission.perms.visibleWhen", {
                codes:
                  "['permission:btn:add', 'permission:btn:edit', 'permission:btn:delete']"
              })
            }}
          </el-button>
        </Perms>
      </el-space>
    </el-card>

    <el-card shadow="never" class="mb-2">
      <template #header>
        <div class="card-header">
          {{ t("views.permission.perms.functionCheckTitle") }}
        </div>
      </template>
      <el-space wrap>
        <el-button v-if="hasPerms('permission:btn:add')" plain type="warning">
          {{
            t("views.permission.perms.visibleWhen", {
              codes: "'permission:btn:add'"
            })
          }}
        </el-button>
        <el-button
          v-if="hasPerms(['permission:btn:edit'])"
          plain
          type="primary"
        >
          {{
            t("views.permission.perms.visibleWhen", {
              codes: "['permission:btn:edit']"
            })
          }}
        </el-button>
        <el-button
          v-if="
            hasPerms([
              'permission:btn:add',
              'permission:btn:edit',
              'permission:btn:delete'
            ])
          "
          plain
          type="danger"
        >
          {{
            t("views.permission.perms.visibleWhen", {
              codes:
                "['permission:btn:add', 'permission:btn:edit', 'permission:btn:delete']"
            })
          }}
        </el-button>
      </el-space>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          {{ t("views.permission.perms.directiveCheckTitle") }}
        </div>
      </template>
      <el-space wrap>
        <el-button v-perms="'permission:btn:add'" plain type="warning">
          {{
            t("views.permission.perms.visibleWhen", {
              codes: "'permission:btn:add'"
            })
          }}
        </el-button>
        <el-button v-perms="['permission:btn:edit']" plain type="primary">
          {{
            t("views.permission.perms.visibleWhen", {
              codes: "['permission:btn:edit']"
            })
          }}
        </el-button>
        <el-button
          v-perms="[
            'permission:btn:add',
            'permission:btn:edit',
            'permission:btn:delete'
          ]"
          plain
          type="danger"
        >
          {{
            t("views.permission.perms.visibleWhen", {
              codes:
                "['permission:btn:add', 'permission:btn:edit', 'permission:btn:delete']"
            })
          }}
        </el-button>
      </el-space>
    </el-card>
  </div>
</template>
