import dayjs from "dayjs";
import editForm from "../form.vue";
import { handleTree } from "@/utils/tree";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import { usePublicHooks } from "../../hooks";
import { addDialog } from "@/components/ReDialog";
import type { FormItemProps } from "../utils/types";
import type { PaginationProps } from "@pureadmin/table";
import { getKeyList, deviceDetection } from "@pureadmin/utils";
import { type Ref, reactive, ref, onMounted, h, toRaw, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  getTenantPackage,
  getTenantPackageMenu,
  getTenantPackageMenuIds
} from "@/api/system";

/**
 * 租户套餐模块的业务逻辑 Hook。
 * 功能涵盖：列表查询、分页、开关状态确认提示、删除与菜单权限保存、弹框新增/编辑等。
 * 全面接入 i18n，将所有用户可见文案国际化。
 */
export function useTenantPackage(treeRef: Ref) {
  // i18n 文案函数
  const { t } = useI18n();
  const form = reactive({
    name: "",
    status: ""
  });
  const curRow = ref();
  const formRef = ref();
  const dataList = ref([]);
  const treeIds = ref([]);
  const treeData = ref([]);
  const isShow = ref(false);
  const loading = ref(true);
  const isLinkage = ref(false);
  const treeSearchValue = ref();
  const switchLoadMap = ref({});
  const isExpandAll = ref(false);
  const isSelectAll = ref(false);
  const { switchStyle } = usePublicHooks();
  const treeProps = {
    value: "id",
    label: "title",
    children: "children"
  };
  const pagination = reactive<PaginationProps>({
    total: 0,
    pageSize: 10,
    currentPage: 1,
    background: true
  });
  /**
   * 表格列定义（全部使用 i18n 文案）。
   */
  const columns: TableColumnList = [
    {
      label: t("views.tenant.package.index.columns.id"),
      prop: "id"
    },
    {
      label: t("views.tenant.package.index.columns.name"),
      prop: "name"
    },
    {
      label: t("views.tenant.package.index.columns.status"),
      cellRenderer: scope => (
        <el-switch
          size={scope.props.size === "small" ? "small" : "default"}
          loading={switchLoadMap.value[scope.index]?.loading}
          v-model={scope.row.status}
          active-value={1}
          inactive-value={0}
          active-text={t("views.tenant.package.index.switchTexts.active")}
          inactive-text={t("views.tenant.package.index.switchTexts.inactive")}
          inline-prompt
          style={switchStyle.value}
          onChange={() => onChange(scope as any)}
        />
      ),
      minWidth: 90
    },
    {
      label: t("views.tenant.package.index.columns.remark"),
      prop: "remark",
      minWidth: 160
    },
    {
      label: t("common.columns.createTime"),
      prop: "createTime",
      minWidth: 160,
      formatter: ({ createTime }) =>
        dayjs(createTime).format("YYYY-MM-DD HH:mm:ss")
    },
    {
      label: t("views.tenant.package.index.columns.operation"),
      fixed: "right",
      width: 210,
      slot: "operation"
    }
  ];

  /**
   * 状态开关切换：弹出确认框并在确认后提示成功。
   */
  function onChange({ row, index }) {
    const actionText =
      row.status === 0
        ? t("views.tenant.package.index.switchActions.disable")
        : t("views.tenant.package.index.switchActions.enable");
    ElMessageBox.confirm(
      t("views.tenant.package.index.switchConfirmHtml", {
        action: actionText,
        name: row.name
      }),
      t("views.tenant.package.index.confirmTitle"),
      {
        confirmButtonText: t("common.buttons.confirm"),
        cancelButtonText: t("common.buttons.cancel"),
        type: "warning",
        dangerouslyUseHTMLString: true,
        draggable: true
      }
    )
      .then(() => {
        switchLoadMap.value[index] = Object.assign(
          {},
          switchLoadMap.value[index],
          {
            loading: true
          }
        );
        setTimeout(() => {
          switchLoadMap.value[index] = Object.assign(
            {},
            switchLoadMap.value[index],
            {
              loading: false
            }
          );
          const updatedActionText =
            row.status === 0
              ? t("views.tenant.package.index.switchActions.disable")
              : t("views.tenant.package.index.switchActions.enable");
          message(
            t("views.tenant.package.messages.statusUpdated", {
              action: updatedActionText,
              name: row.name
            }),
            { type: "success" }
          );
        }, 300);
      })
      .catch(() => {
        row.status === 0 ? (row.status = 1) : (row.status = 0);
      });
  }

  /**
   * 删除当前行：仅演示，提示删除成功并刷新列表。
   */
  function handleDelete(row) {
    message(t("views.tenant.package.messages.deleted", { name: row.name }), {
      type: "success"
    });
    onSearch();
  }

  /**
   * 分页尺寸变化（演示打印）。
   */
  function handleSizeChange(val: number) {
    console.log(`${val} items per page`);
  }

  /**
   * 当前页变化（演示打印）。
   */
  function handleCurrentChange(val: number) {
    console.log(`current page: ${val}`);
  }

  /**
   * 表格选择项变化（演示打印）。
   */
  function handleSelectionChange(val) {
    console.log("handleSelectionChange", val);
  }

  /**
   * 查询列表数据。
   */
  async function onSearch() {
    loading.value = true;
    const { data } = await getTenantPackage(toRaw(form));
    dataList.value = data.list;
    pagination.total = data.total;
    pagination.pageSize = data.pageSize;
    pagination.currentPage = data.currentPage;

    setTimeout(() => {
      loading.value = false;
    }, 500);
  }

  /**
   * 重置查询表单并刷新列表。
   */
  const resetForm = formEl => {
    if (!formEl) return;
    formEl.resetFields();
    onSearch();
  };

  /**
   * 打开新增/编辑弹框。
   * @param mode 操作类型：add | edit
   * @param row 当前行（用于编辑场景回填）
   */
  function openDialog(mode: "add" | "edit" = "add", row?: FormItemProps) {
    addDialog({
      title:
        mode === "add"
          ? t("views.tenant.package.index.dialog.addPackageTitle")
          : t("views.tenant.package.index.dialog.editPackageTitle"),
      props: {
        formInline: {
          name: row?.name ?? "",
          remark: row?.remark ?? ""
        }
      },
      width: "40%",
      draggable: true,
      fullscreen: deviceDetection(),
      fullscreenIcon: true,
      closeOnClickModal: false,
      contentRenderer: () => h(editForm, { ref: formRef, formInline: null }),
      beforeSure: (done, { options }) => {
        const FormRef = formRef.value.getRef();
        const curData = options.props.formInline as FormItemProps;
        function chores() {
          const msg =
            mode === "add"
              ? t("views.tenant.package.messages.created", {
                  name: curData.name
                })
              : t("views.tenant.package.messages.updated", {
                  name: curData.name
                });
          message(msg, { type: "success" });
          done(); // 关闭弹框
          onSearch(); // 刷新表格数据
        }
        FormRef.validate(valid => {
          if (valid) {
            console.log("curData", curData);
            // 表单规则校验通过
            if (mode === "add") {
              // 实际开发先调用新增接口，再进行下面操作
              chores();
            } else {
              // 实际开发先调用修改接口，再进行下面操作
              chores();
            }
          }
        });
      }
    });
  }

  /** 菜单权限 */
  async function handleMenu(row?: any) {
    const { id } = row;
    if (id) {
      curRow.value = row;
      isShow.value = true;
      const { data } = await getTenantPackageMenuIds({ id });
      treeRef.value.setCheckedKeys(data);
    } else {
      curRow.value = null;
      isShow.value = false;
    }
  }

  /** 高亮当前权限选中行 */
  function rowStyle({ row: { id } }) {
    return {
      cursor: "pointer",
      background: id === curRow.value?.id ? "var(--el-fill-color-light)" : ""
    };
  }

  /** 菜单权限-保存 */
  function handleSave() {
    const { id, name } = curRow.value;
    // 根据用户 id 调用实际项目中菜单权限修改接口
    console.log(id, treeRef.value.getCheckedKeys());
    message(t("views.tenant.package.messages.menuUpdated", { name }), {
      type: "success"
    });
  }

  /**
   * 树节点过滤：根据 query 过滤 title。
   */
  const onQueryChanged = (query: string) => {
    treeRef.value!.filter(query);
  };

  /**
   * 树过滤方法：包含 query 的标题即命中。
   */
  const filterMethod = (query: string, node) => {
    return node.title!.includes(query);
  };

  onMounted(async () => {
    onSearch();
    const { data } = await getTenantPackageMenu();
    treeIds.value = getKeyList(data, "id");
    treeData.value = handleTree(data);
  });

  watch(isExpandAll, val => {
    val
      ? treeRef.value.setExpandedKeys(treeIds.value)
      : treeRef.value.setExpandedKeys([]);
  });

  watch(isSelectAll, val => {
    val
      ? treeRef.value.setCheckedKeys(treeIds.value)
      : treeRef.value.setCheckedKeys([]);
  });

  return {
    form,
    isShow,
    curRow,
    loading,
    columns,
    rowStyle,
    dataList,
    treeData,
    treeProps,
    isLinkage,
    pagination,
    isExpandAll,
    isSelectAll,
    treeSearchValue,
    onSearch,
    resetForm,
    openDialog,
    handleMenu,
    handleSave,
    handleDelete,
    filterMethod,
    onQueryChanged,
    handleSizeChange,
    handleCurrentChange,
    handleSelectionChange
  };
}
