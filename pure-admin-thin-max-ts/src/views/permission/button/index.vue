<script setup lang="ts">
import { hasAuth, getAuths } from "@/router/utils";
import { useI18n } from "vue-i18n";

defineOptions({
  name: "PermissionButtonRouter"
});

/**
 * 获取国际化 t 函数。
 * 用于页面标题、说明文案与按钮文本的多语言处理。
 */
const { t } = useI18n();
</script>

<template>
  <div>
    <p class="mb-2!">
      {{ t("views.permission.perms.currentCodes") }}{{ getAuths() }}
    </p>

    <el-card shadow="never" class="mb-2">
      <template #header>
        <div class="card-header">
          {{ t("views.permission.perms.componentCheckTitle") }}
        </div>
      </template>
      <el-space wrap>
        <Auth value="permission:btn:add">
          <el-button plain type="warning">
            {{
              t("views.permission.perms.visibleWhen", {
                codes: "'permission:btn:add'"
              })
            }}
          </el-button>
        </Auth>
        <Auth :value="['permission:btn:edit']">
          <el-button plain type="primary">
            {{
              t("views.permission.perms.visibleWhen", {
                codes: "['permission:btn:edit']"
              })
            }}
          </el-button>
        </Auth>
        <Auth
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
        </Auth>
      </el-space>
    </el-card>

    <el-card shadow="never" class="mb-2">
      <template #header>
        <div class="card-header">
          {{ t("views.permission.perms.functionCheckTitle") }}
        </div>
      </template>
      <el-space wrap>
        <el-button v-if="hasAuth('permission:btn:add')" plain type="warning">
          {{
            t("views.permission.perms.visibleWhen", {
              codes: "'permission:btn:add'"
            })
          }}
        </el-button>
        <el-button v-if="hasAuth(['permission:btn:edit'])" plain type="primary">
          {{
            t("views.permission.perms.visibleWhen", {
              codes: "['permission:btn:edit']"
            })
          }}
        </el-button>
        <el-button
          v-if="
            hasAuth([
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
        <el-button v-auth="'permission:btn:add'" plain type="warning">
          {{
            t("views.permission.perms.visibleWhen", {
              codes: "'permission:btn:add'"
            })
          }}
        </el-button>
        <el-button v-auth="['permission:btn:edit']" plain type="primary">
          {{
            t("views.permission.perms.visibleWhen", {
              codes: "['permission:btn:edit']"
            })
          }}
        </el-button>
        <el-button
          v-auth="[
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
