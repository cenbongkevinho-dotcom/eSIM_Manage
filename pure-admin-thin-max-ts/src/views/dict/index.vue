<script setup lang="ts">
import { ref } from "vue";
import tree from "./tree.vue";
import { useDict } from "./utils/hook";
import { isAllEmpty } from "@pureadmin/utils";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useI18n } from "vue-i18n";

/**
 * 在线版 Iconify 图标常量
 * @description 统一采用冒号命名（prefix:name），使在线组件可以直接加载
 */
const Delete = "ep:delete";
const EditPen = "ep:edit-pen";
const AddFill = "ri:add-circle-line";

defineOptions({
  name: "SystemDict"
});

const treeRef = ref();
const tableRef = ref();

/**
 * 获取国际化 t 函数。
 * 用于页面标题、按钮与确认弹窗文案的多语言处理。
 */
const { t } = useI18n();

const {
  dictId,
  loading,
  columns,
  dataList,
  pagination,
  deviceDetection,
  onSearch,
  openDialog,
  onTreeSelect,
  handleDelete,
  handleSizeChange,
  handleCurrentChange
} = useDict();
</script>

<template>
  <div :class="['flex', 'justify-between', deviceDetection() && 'flex-wrap']">
    <tree
      ref="treeRef"
      :class="['mr-2', deviceDetection() ? 'w-full' : 'min-w-[200px]']"
      @tree-select="onTreeSelect"
    />
    <div :class="[deviceDetection() ? ['w-full'] : 'w-[calc(100%-200px)]']">
      <PureTableBar
        class="mt-0!"
        :title="t('views.dict.index.title')"
        :columns="columns"
        @refresh="onSearch"
      >
        <template #buttons>
          <el-button
            type="primary"
            :disabled="isAllEmpty(dictId)"
            :icon="useRenderIcon(AddFill)"
            @click="openDialog('add')"
          >
            {{ t("views.dict.index.buttons.addDetail") }}
          </el-button>
        </template>
        <template v-slot="{ size, dynamicColumns }">
          <pure-table
            ref="tableRef"
            row-key="id"
            adaptive
            :adaptiveConfig="{ offsetBottom: 108 }"
            align-whole="center"
            table-layout="auto"
            :loading="loading"
            :size="size"
            :data="dataList"
            :columns="dynamicColumns"
            :pagination="pagination"
            :paginationSmall="size === 'small' ? true : false"
            :header-cell-style="{
              background: 'var(--el-fill-color-light)',
              color: 'var(--el-text-color-primary)'
            }"
            @page-size-change="handleSizeChange"
            @page-current-change="handleCurrentChange"
          >
            <template #operation="{ row }">
              <el-button
                class="reset-margin"
                link
                type="primary"
                :size="size"
                :icon="useRenderIcon(EditPen)"
                @click="openDialog('edit', row)"
              >
                {{ t("common.buttons.edit") }}
              </el-button>
              <el-popconfirm
                :title="
                  t('views.dict.index.popconfirm.deleteLabel', {
                    label: row.label
                  })
                "
                @confirm="handleDelete(row)"
              >
                <template #reference>
                  <el-button
                    class="reset-margin"
                    link
                    type="primary"
                    :size="size"
                    :icon="useRenderIcon(Delete)"
                  >
                    {{ t("common.buttons.delete") }}
                  </el-button>
                </template>
              </el-popconfirm>
            </template>
          </pure-table>
        </template>
      </PureTableBar>
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

:deep(.el-button:focus-visible) {
  outline: none;
}

.main-content {
  margin: 24px 24px 0 !important;
}
</style>
